import { MiscNotificationTopics } from "@/models/network"
import { useSocketLogs } from "@/lib/socketUtils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { LiveLogViewer } from "@/components/custom/general/LogViewer"
import { DatePickerWithPresets } from "@/components/ui/date-picker-presets"
import { useCallback, useMemo, useState } from "react"
import type { DateRange } from "react-day-picker"
import { defaultLogPeriod } from "@/features/jobsTable/interfaces"
import TabButtonGroup from "@/components/custom/general/TabButtonGroup"
import LogFileList from "@/components/custom/general/LogFileList"
import { useJobLogs } from "@/hooks/useLogs"
import Spinner from "@/components/custom/LoadingOverlay"

const tabList = ["Events", "Files"]
export function EventLog() {
  const [period, setPeriod] = useState<DateRange>(defaultLogPeriod)
  const [activeLogTypeTab, setActiveLogTypeTab] = useState<string>(tabList[0])
  const { latestLogs, logs } = useSocketLogs({
    actions: [MiscNotificationTopics.EventLog],
    format: (data: any) => ({
      ...data,
      fullMessage: `${data.logs.timestamp} | ${data.logs.level?.toUpperCase()} | ${data.logs.message}`,
    }),
    initialLogsFilter: period,
    mergeOutputStreams: true,
    logQuery: `{eventName=~".+"}`,
    setEndToMidnight: true,
  })

  const onPeriodFilterChange = useCallback((period?: DateRange) => {
    setPeriod(period ?? defaultLogPeriod)
  }, [])

  const isEventsTabActive = useMemo(
    () => activeLogTypeTab === "Events",
    [activeLogTypeTab],
  )

  const {
    systemLogFiles,
    loading: logFileLoading,
    readLogFile,
    downloadLogFile,
  } = useJobLogs({})

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className={"flex flex-col gap-1 mb-4"}>
        <h2 className="text-2xl font-bold tracking-tight">System Event log</h2>
        <p className="text-md font-light">
          Follow the systems event log including job start and end events,
          errors and warnings
        </p>
      </div>
      <Card className="border-border h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 text-foreground bg-background border-border rounded-t-xl">
          <div className="text-l font-bold tracking-tight italic flex-col gap-2 items-left">
            <div>Event logs</div>
            <div className="italic text-sm">
              {isEventsTabActive
                ? "All system event logs, updated in real time"
                : "All system event log files"}
            </div>
          </div>
          <div className="flex gap-2">
            <DatePickerWithPresets
              onChange={onPeriodFilterChange}
              defaultValue={period}
              disabled={!isEventsTabActive}
            />
            <TabButtonGroup
              tabList={tabList}
              setActiveTab={setActiveLogTypeTab}
              activeTab={activeLogTypeTab}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 h-full">
          <div className="flex flex-col gap-2 h-full">
            <div className="space-y-1 rounded bg-background text-foreground text-sm min-h-[500px] w-full flex-grow">
              {isEventsTabActive ? (
                <LiveLogViewer
                  initialLogs={logs.map(e => e.fullMessage)}
                  newLogs={latestLogs.map(e => e.fullMessage)}
                  wrapLines={false}
                />
              ) : (
                <Spinner
                  isLoading={logFileLoading}
                  className="flex flex-col max-h-[calc(100vh-18rem)]"
                >
                  <LogFileList
                    logFiles={systemLogFiles}
                    readLogFile={readLogFile}
                    originName="System"
                    downloadLogFile={downloadLogFile}
                  />
                </Spinner>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
