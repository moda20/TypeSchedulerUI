import {
  CalendarDays,
  CheckCircle,
  Clock2,
  FileWarning,
  FlagIcon,
  LoaderIcon,
  LoaderPinwheelIcon,
  LogsIcon,
} from "lucide-react"
import SheetActionDialog from "@/components/sheet-action-dialog"
import type { jobsTableData } from "@/features/jobsTable/interfaces"
import { ReactNode, useMemo } from "react"
import jobsService from "@/services/JobsService"
import { useCallback, useState } from "react"
import moment from "moment"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import Spinner from "@/components/custom/LoadingOverlay"
import type { JobRunLog, JobRunsQuerySchema } from "@/models/jobs"
import { cn } from "@/lib/utils"
import { CardStackIcon } from "@radix-ui/react-icons"
import ScrollableList from "@/components/custom/general/ScrollableList"
import { getLokiLogs } from "@/services/components/logsService"
import { Label } from "@/components/ui/label"
import { Loader } from "lucide"
import { useSocketLogs } from "@/lib/socketUtils"
import { MiscNotificationTopics } from "@/models/network"
import { LiveLogViewer } from "@/components/custom/general/LogViewer"

export interface DrawerLatestRunsProps {
  JobDetails: jobsTableData
  trigger: ReactNode
}

export default function DrawerLatestRuns({
  JobDetails,
  trigger,
}: DrawerLatestRunsProps) {
  const [LogItems, setLogItems] = useState<JobRunLog[]>([])
  const [selectedLogItem, setSelectedLogItem] = useState<any | undefined>(
    undefined,
  )
  const [itemsTotal, setItemsTotal] = useState(0)
  const [inputSchema, setInputSchema] = useState<JobRunsQuerySchema>({
    jobId: JobDetails.id,
    limit: 10,
    offset: 0,
  })
  const [loading, setLoading] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  const { logs } = useSocketLogs({
    actions: [],
    format: (stream: any) => {
      stream.values.forEach((log: any) => {
        log.fullMessage = `${log.timestamp} | ${log.type?.toUpperCase()} | ${log.message}`
      })
      return stream
    },
    initialLogsFilter: selectedLogItem?.filterRange,
    logInterval: undefined,
    mergeOutputStreams: false,
    setEndToMidnight: false,
    logQuery: `{logId="${selectedLogItem?.log_id}"}`,
  })

  const resetDrawer = useCallback(() => {
    setLogItems([])
    setItemsTotal(0)
    setInputSchema({
      ...inputSchema,
      offset: 0,
    })
    setLoading(false)
    setShowLogs(false)
  }, [inputSchema])

  const getLatestRuns = useCallback(() => {
    setLoading(true)
    return jobsService
      .getJobRuns(inputSchema)
      .then(data => {
        data.data.forEach((log: any) => {
          log.start_time = new Date(log.start_time)
          log.isUnfinished = !log.end_time
          log.end_time = log.end_time ? new Date(log.end_time) : new Date()
          log.log_id = log.job_log_id
          log.start_time_text =
            moment(log.start_time).diff(moment(), "hours", true) < -1
              ? moment(log.start_time).format("YYYY-MM-DD HH-mm")
              : moment(log.start_time).fromNow()
          log.start_time_title = `Start time : ${moment(log.start_time).format("YYYY-MM-DD HH-mm-ss")}`
          log.offsettedStartedTime = log.offsettedEndTime = new Date(
            log.end_time.getTime(),
          )
          log.filterRange = {
            from: new Date(log.start_time.getTime()),
            to: new Date(log.end_time.getTime()),
          }
        })
        return data
      })
      .catch(err => {
        console.error(err)
        return {
          data: [],
          total: 0,
        }
      })
      .finally(() => setLoading(false))
  }, [inputSchema, loading])

  const getMoreRuns = useCallback(
    (offset?: number) => {
      setInputSchema({
        ...inputSchema,
        offset: offset ?? inputSchema.offset,
      })
      return getLatestRuns().then(d => d.data)
    },
    [getLatestRuns, inputSchema],
  )

  const openAndFetchLogs = useCallback((LogItem: JobRunLog) => {
    if (LogItem && LogItem.end_time) {
      setSelectedLogItem(LogItem)
      setShowLogs(true)
    }
  }, [])

  return (
    <SheetActionDialog
      side={"right"}
      title={`Job runs for ${JobDetails.name}`}
      description={"List of previous job run logs"}
      contentClassName={cn(
        "transition-all duration-100",
        showLogs ? "w-[600px] sm:w-[900px] sm:max-w-[80vw]" : "",
      )}
      trigger={trigger}
      onOpenChange={v => {
        if (v) {
          getLatestRuns().then(data => {
            setLogItems(data.data)
            setItemsTotal(data.total)
          })
        } else {
          resetDrawer()
        }
      }}
      modal={true}
    >
      <div className={"flex gap-2 py-4 h-full"}>
        <ScrollArea
          className={cn(
            "max-h-[100%] min-w-[280px]",
            showLogs ? "" : "flex-grow",
          )}
        >
          <ScrollableList
            originalList={LogItems}
            loadMore={!loading && (inputSchema.offset ?? 0) <= itemsTotal}
            loadMoreAction={getMoreRuns}
            className="px-[1px] py-[2px] min-w-[280px]"
            onItemClick={openAndFetchLogs}
            itemClassName={(item: any) => {
              return cn(
                "focus:rounded-lg outline-none focus:ring-2  focus:ring-opacity-50 focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-opacity-50 hover:ring-2 hover:ring-opacity-50 hover:rounded-lg focus:ring-blue-500 focus-visible:ring-blue-500 hover:ring-blue-500",
                item.error ? "border-destructive border-2 rounded-xl" : "",
              )
            }}
            renderItem={(logParent: any) => {
              const CardIcon = () =>
                logParent.isUnfinished ? (
                  <LoaderIcon className="text-foreground animate-spin duration-2000" />
                ) : logParent.error ? (
                  <FileWarning className="h-7 w-7 text-foreground bg-destructive p-1 rounded-lg" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-success p-1 rounded-lg border-2 border-border" />
                )
              return (
                <div
                  className={cn(
                    "px-4 py-2 rounded-lg border border-border transition-all duration-200 cursor-pointer focus:ring-offset-2 min-w-[275px]",
                  )}
                  role="option"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-[12px] italic">
                      {logParent.log_id}
                      {logParent.isUnfinished ? " - in progress" : ""}
                    </h3>
                    <span className="text-xs rounded bg-background text-foreground">
                      <CardIcon />
                    </span>
                  </div>
                  <div className="flex gap-4 mb-2 text-sm text-foreground bg-background">
                    <span
                      className="flex gap-2 items-center min-w-[140px]"
                      title={logParent.start_time_title}
                    >
                      <FlagIcon className="h-5 w-5 text-foreground" />
                      {logParent.start_time_text}
                    </span>
                    <span
                      className="flex gap-2 items-center"
                      title="Duration in minutes"
                    >
                      <Clock2 className="h-5 w-5 text-foreground" />
                      {moment(logParent.end_time).diff(
                        moment(logParent.start_time),
                        "minutes",
                      )}{" "}
                      min
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm",
                      logParent.error
                        ? "text-destructive font-black text-md pt-2"
                        : "text-foreground",
                    )}
                  >
                    {logParent.error ? (
                      <span>{logParent.error}</span>
                    ) : (
                      logParent.result
                    )}
                  </p>
                </div>
              )
            }}
          />
          {LogItems?.length === 0 && (
            <div className="flex flex-col gap-2 items-center justify-center p-2 border-border border rounded-md">
              <CardStackIcon />
              <div className="text-muted-foreground text-sm">
                No previous runs found for this job
              </div>
            </div>
          )}
        </ScrollArea>
        <div
          className={cn(
            "flex flex-col gap-2 border border-border rounded-xl p-2 w-full min-w-0",
            showLogs ? "" : "hidden w-0 p-0",
          )}
        >
          <Spinner
            isLoading={loading}
            icon={LoaderPinwheelIcon}
            className="h-full"
          >
            {logs?.[0] && (
              <LiveLogViewer
                initialLogs={logs[0]?.values.map((e: any) => e.fullMessage)}
                wrapLines={false}
                scrollToLine={1}
                extraLines={4}
              />
            )}
            {!logs?.[0] && !loading && (
              <div className="w-full h-full flex flex-col gap-4 items-center justify-center">
                <LogsIcon className="w-16 h-16 text-destructive" />
                <div className="text-muted-foreground text-md">
                  No logs found for this run
                </div>
              </div>
            )}
          </Spinner>
        </div>
      </div>
    </SheetActionDialog>
  )
}
