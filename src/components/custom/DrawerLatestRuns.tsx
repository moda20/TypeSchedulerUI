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
import { ReactNode, useMemo, useRef } from "react"
import jobsService from "@/services/JobsService"
import { useCallback, useState } from "react"
import moment from "moment"
import { ScrollArea } from "@/components/ui/scroll-area"
import Spinner from "@/components/custom/LoadingOverlay"
import type { JobRunLog, JobRunsQuerySchema } from "@/models/jobs"
import { cn } from "@/lib/utils"
import { CardStackIcon } from "@radix-ui/react-icons"
import ScrollableList from "@/components/custom/general/ScrollableList"
import { useSocketLogs } from "@/lib/socketUtils"
import { LiveLogViewer } from "@/components/custom/general/LogViewer"
import {
  EpochsType,
  formatDiff,
  getTimeIndex,
  momentDateKey,
} from "@/utils/dateUtils"
import ManagedSelect, {
  ManagedSelectInputValue,
} from "@/components/custom/ManagedSelect"
import { EmptyState } from "@/components/custom/general/EmptyState"

export interface DrawerLatestRunsProps {
  JobDetails: jobsTableData
  trigger: ReactNode
}

const GroupingOptions: ManagedSelectInputValue[] = [
  {
    label: "Weekly",
    value: "week",
  },
  {
    label: "Monthly",
    value: "month",
  },
  {
    label: "Daily",
    value: "day",
  },
]

export default function DrawerLatestRuns({
  JobDetails,
  trigger,
}: DrawerLatestRunsProps) {
  const [LogItems, setLogItems] = useState<JobRunLog[]>([])
  const [selectedLogItem, setSelectedLogItem] = useState<any | undefined>(
    undefined,
  )
  const [itemDateArray, setItemDateArray] = useState<any[]>([])
  const [itemsTotal, setItemsTotal] = useState(0)
  const [inputSchema, setInputSchema] = useState<JobRunsQuerySchema>({
    jobId: JobDetails.id,
    limit: 10,
    offset: 0,
  })
  const [loading, setLoading] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [groupingKey, setGroupingKey] = useState<EpochsType>("week")

  const scrollableListRef = useRef<any>(null)

  const { logs, logsLoading } = useSocketLogs({
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
    setItemDateArray([])
  }, [inputSchema])

  const getLatestRuns = useCallback(
    (schema?: JobRunsQuerySchema) => {
      setLoading(true)
      const newItemDateArray = Object.assign([], itemDateArray)
      return jobsService
        .getJobRuns(schema ?? inputSchema)
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

            const weekIndex = getTimeIndex(log.start_time, groupingKey)
            if (
              !newItemDateArray.length ||
              newItemDateArray[newItemDateArray.length - 1] > weekIndex
            ) {
              log.isGroupHead = true
              log.groupHead = `${groupingKey} ${moment(log.start_time).set(momentDateKey[groupingKey], 1).format("YYYY-MM-DD")}`
              newItemDateArray[newItemDateArray.length ?? 0] = weekIndex
            }
          })
          setItemDateArray(newItemDateArray)
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
    },
    [
      inputSchema,
      loading,
      itemDateArray,
      setItemDateArray,
      LogItems,
      groupingKey,
    ],
  )

  const getMoreRuns = useCallback(
    (offset?: number) => {
      const newQuerySchema = {
        ...inputSchema,
        offset: offset ?? inputSchema.offset,
      }
      setInputSchema(newQuerySchema)
      return getLatestRuns(newQuerySchema).then(d => {
        setItemsTotal(d.total)
        return d.data
      })
    },
    [getLatestRuns, inputSchema],
  )

  const openAndFetchLogs = useCallback((LogItem: JobRunLog) => {
    if (LogItem && LogItem.end_time) {
      setSelectedLogItem(LogItem)
      setShowLogs(true)
    }
  }, [])

  const handleGroupingChange = useCallback(
    value => {
      setGroupingKey(value)
      // resetting list via ref
      resetDrawer()
      scrollableListRef?.current?.resetList()
    },
    [groupingKey],
  )

  const SheetDescription = useMemo(() => {
    return (
      <div className="flex justify-between items-center !my-0">
        <div>List of previous job run logs</div>
        <div>
          <ManagedSelect
            exportOnlyValue={true}
            onChange={handleGroupingChange}
            inputOptions={GroupingOptions}
            defaultValue="week"
            className="focus:ring-0 focus-visible:ring-0 border-2 border-border"
          />
        </div>
      </div>
    )
  }, [])

  return (
    <SheetActionDialog
      side={"right"}
      title={`Job runs for ${JobDetails.name}`}
      description={SheetDescription}
      contentClassName={cn(
        "transition-all duration-100",
        showLogs ? "w-[600px] sm:w-[900px] sm:max-w-[80vw]" : "",
      )}
      trigger={trigger}
      onOpenChange={v => {
        if (!v) {
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
            ref={scrollableListRef}
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
                <div className="flex flex-col gap-2">
                  {logParent.isGroupHead && (
                    <div className="flex flex-row gap-1.5 items-center">
                      <div className="separator h-[3px] bg-foreground opacity-80 w-1/6 rounded"></div>
                      <div className="text-xs italic font-bold capitalize">
                        {logParent.groupHead}
                      </div>
                    </div>
                  )}

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
                        title="Run duration"
                      >
                        <Clock2 className="h-5 w-5 text-foreground" />
                        {formatDiff(logParent.end_time, logParent.start_time)}
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
            isLoading={logsLoading}
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
            {!logs?.[0] && !logsLoading && (
              <EmptyState
                className="w-full"
                icon={LogsIcon}
                title="No logs found for this run"
                description=""
              />
            )}
          </Spinner>
        </div>
      </div>
    </SheetActionDialog>
  )
}
