import jobsService from "@/services/JobsService"
import { DataTable } from "@/features/jobsTable/jobsTable"
import type { jobsTableData } from "@/features/jobsTable/interfaces"
import { getTableColumns, jobActions } from "@/features/jobsTable/interfaces"
import { MouseEventHandler } from "react"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Spinner from "@/components/custom/LoadingOverlay"
import type { ColumnDef, Row, SortingState, Table } from "@tanstack/react-table"
import type { JobUpdateType } from "@/components/job-update-dialog"
import { JobUpdateDialog } from "@/components/job-update-dialog"
import { Button } from "@/components/ui/button"
import {
  PlusIcon,
  LoaderPinwheelIcon,
  FilterIcon,
  Trash2Icon,
  DockIcon,
  TextSelectIcon,
  DownloadIcon,
} from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { getConsumersCBox, takeAction } from "@/features/jobsTable/jobsUtils"
import {
  jobsList,
  setJobsList,
  setRunningJobsCount,
} from "@/app/reducers/jobsReducer"
import type { AdvancedJobFilteringDialogHandle } from "@/components/custom/jobsTable/advancedJobFilteringDialog"
import { AdvancedJobFilteringDialog } from "@/components/custom/jobsTable/advancedJobFilteringDialog"
import { ButtonGroup } from "@/components/ui/buttonGroup"
import { toast } from "@/hooks/use-toast"
import { ButtonWithTooltip } from "@/components/custom/general/ButtonWithTooltip"
import { GearIcon, StopIcon } from "@radix-ui/react-icons"
import ConfirmationDialogAction, {
  ConfirmationDialogActionType,
} from "@/components/confirmationDialogAction"
import { cn } from "@/lib/utils"
import { BatchImportDialog } from "@/components/custom/jobsTable/batchImportDialog"
import { useInView } from "@/hooks/useInView"
import { useJobs } from "@/hooks/useJobs"

export const defaultSortingState = [{ id: "cronSetting", desc: true }]

let lastSelectedID = 0
export default function JobsPage() {
  const [advancedFilters, setAdvancedFilters] = useState<any>()
  const [sorting, setSorting] = useState<SortingState>(defaultSortingState)
  const JobsList = useAppSelector(jobsList)
  const dispatch = useAppDispatch()
  const avFilteringRef = useRef<AdvancedJobFilteringDialogHandle>(null)
  const [selectedRowIds, setSelectedRowIds] = useState<any>({})
  const { ref, inView } = useInView()

  const selectedRowIdsArray = useMemo(
    () => Object.keys(selectedRowIds).map(Number),
    [selectedRowIds],
  )

  const { jobs, isJobFetching, forceJobRefresh } = useJobs({
    sorting,
    advancedFilters: advancedFilters,
    offset: 0,
    limit: 99999,
  })

  useEffect(() => {
    dispatch(setJobsList(jobs ?? []))
  }, [jobs])

  const onAdvancedFilterChange = useCallback((value: any, reset?: boolean) => {
    if (!value) {
      avFilteringRef.current?.reset()
    }
    setAdvancedFilters(reset ? undefined : value)
  }, [])

  const onAdvancedExecutionSubmission = useCallback((value: any) => {
    return jobsService
      .queueJobExecution(value)
      .then((data: any) => {
        toast({
          title: `Jobs queued`,
          duration: 2000,
        })
        return data
      })
      .catch(err => {
        toast({
          title: err.message,
          variant: "destructive",
        })
      })
  }, [])

  async function getRunningJobs() {
    return await jobsService.getRunningJobs().then((data: any) => {
      dispatch(setRunningJobsCount(data.count))
    })
  }

  const filterAndPaginationChange = useCallback(
    async ({ sorting: newSorting }: { sorting: any }) => {
      const targetSorting =
        newSorting?.length ||
        (sorting === defaultSortingState && !newSorting?.length)
          ? newSorting
          : defaultSortingState
      setSorting(targetSorting)
    },
    [advancedFilters],
  )

  const tableEventsMemoized = useMemo(
    () => ({
      onPageChange: filterAndPaginationChange,
      actionConfirmed: forceJobRefresh,
      onRowSelectionChange: setSelectedRowIds,
    }),
    [filterAndPaginationChange, forceJobRefresh],
  )

  const takeJobsAction = useCallback(
    async (
      row: jobsTableData | null,
      action: jobActions,
      data?: JobUpdateType | any,
      batchProcessIds?: Array<number>,
    ) => {
      await takeAction(row, action, data, batchProcessIds)?.catch(err => {
        console.error(err)
        toast({
          title: err.message,
          variant: "destructive",
        })
      })

      await forceJobRefresh()
    },
    [forceJobRefresh],
  )

  const takeBatchJobsAction = useCallback(
    async (action: jobActions) => {
      await takeJobsAction(JobsList[0], action, undefined, selectedRowIdsArray)
      setSelectedRowIds({})
    },
    [selectedRowIds, JobsList, takeJobsAction],
  )

  const confirmBatchJobAction = useCallback(
    (action: jobActions) =>
      async (dialogAction: ConfirmationDialogActionType) => {
        if (dialogAction === ConfirmationDialogActionType.CANCEL) return
        return takeBatchJobsAction(action)
      },
    [takeBatchJobsAction],
  )

  const getRowRange = (
    rows: Row<jobsTableData>[],
    currentID: number,
    selectedID: number,
  ): Row<jobsTableData>[] => {
    const rangeStart = selectedID > currentID ? currentID : selectedID
    const rangeEnd = rangeStart === currentID ? selectedID : currentID
    return rows.slice(rangeStart, rangeEnd + 1)
  }

  const shiftEnabledSelectFunction = useCallback(
    (
      table: Table<jobsTableData>,
      row: Row<jobsTableData>,
    ): MouseEventHandler => {
      return (event: any) => {
        if (event.shiftKey) {
          const { rows, rowsById } = table.getRowModel()
          const rowsToToggle = getRowRange(
            rows,
            Number(row.index),
            Number(lastSelectedID),
          )
          const isCellSelected = rowsById[row.id].getIsSelected()
          rowsToToggle.forEach(_row => _row.toggleSelected(!isCellSelected))
        } else {
          row.toggleSelected()
        }
        lastSelectedID = row.index
      }
    },
    [],
  )

  const columns: ColumnDef<jobsTableData, any>[] = useMemo(() => {
    return getTableColumns({
      takeAction: takeJobsAction,
      getAvailableConsumers: getConsumersCBox,
      selectFunction: shiftEnabledSelectFunction,
    })
  }, [sorting])

  const filterMemo = useMemo(() => {
    return {
      sorting: sorting,
    }
  }, [sorting])

  const importJobs = useCallback(
    async (jobsList: any[]) => {
      await jobsService
        .importJobsFromJSON(jobsList)
        .then(res => {
          toast({
            title: `${jobsList.length} Jobs imported successfully`,
            duration: 2000,
          })
          return forceJobRefresh()
        })
        .catch(err => {
          toast({
            title: err.message,
            duration: 2000,
            variant: "destructive",
          })
        })
    },
    [forceJobRefresh],
  )

  return (
    <div className="h-full">
      <div ref={ref} className="h-[1px]"></div>
      <div
        className={`table-header flex items-center pb-4 pt-0 justify-between sticky  z-10 transition-all duration-100 ${
          !inView ? "bg-background/95 backdrop-blur-sm shadow-md top-16" : ""
        }`}
      >
        <ButtonGroup>
          <JobUpdateDialog
            jobDetails={undefined}
            isCreateDialog={true}
            itemList={getConsumersCBox}
            onChange={jobData =>
              takeJobsAction(null, jobActions.CREATE, jobData)
            }
          >
            <Button
              variant="outline"
              className={"border-border rounded-r-none"}
            >
              <PlusIcon /> New job
            </Button>
          </JobUpdateDialog>
          <BatchImportDialog onChange={importJobs}>
            <ButtonWithTooltip
              variant="outline"
              className="border-l-0 rounded-l-none"
              tooltipContent={"Import jobs"}
              size="icon"
            >
              <PlusIcon />
            </ButtonWithTooltip>
          </BatchImportDialog>
        </ButtonGroup>
        <div className="flex gap-2 items-center">
          {Object.keys(selectedRowIds)?.length > 0 && (
            <ButtonGroup>
              <ButtonWithTooltip
                variant="outline"
                onClick={() => setSelectedRowIds({})}
                tooltipContent="Unselect all"
                tooltipContentClassName="text-foreground bg-background border-border border-2"
              >
                <TextSelectIcon /> {Object.keys(selectedRowIds)?.length}
              </ButtonWithTooltip>
              <ButtonWithTooltip
                variant="outline"
                className="rounded-none border-l-0"
                tooltipContent="Export selected jobs to JSON"
                tooltipContentClassName="text-foreground bg-background border-border border-2"
                onClick={() => takeBatchJobsAction(jobActions.EXPORT)}
              >
                <DownloadIcon />
              </ButtonWithTooltip>
              <ConfirmationDialogAction
                title={"Run all Jobs"}
                description={`This will Run all the ${Object.keys(selectedRowIds).length} selected jobs Simultaneously, if you are looking for queuing check, the advanced filtering modal`}
                takeAction={confirmBatchJobAction(jobActions.EXECUTE)}
                confirmText={"Run all"}
              >
                <ButtonWithTooltip
                  variant="outline"
                  className="rounded-none border-l-0"
                  tooltipContent="Run all selected jobs"
                  tooltipContentClassName="text-foreground bg-background border-border border-2"
                >
                  <DockIcon /> Run All
                </ButtonWithTooltip>
              </ConfirmationDialogAction>
              <ConfirmationDialogAction
                title={"Schedule all Jobs"}
                description={`This will Schedule all the ${Object.keys(selectedRowIds).length} selected jobs`}
                takeAction={confirmBatchJobAction(jobActions.SCHEDULE)}
                confirmText={"Schedule all"}
              >
                <ButtonWithTooltip
                  variant="outline"
                  className="rounded-none border-l-0"
                  tooltipContent="Schedule all selected jobs"
                  tooltipContentClassName="text-foreground bg-background border-border border-2"
                >
                  <GearIcon />
                </ButtonWithTooltip>
              </ConfirmationDialogAction>

              <ConfirmationDialogAction
                title={"Un-schedule all Jobs"}
                description={`This will un-schedule all the ${Object.keys(selectedRowIds).length} selected jobs`}
                takeAction={confirmBatchJobAction(jobActions.UNSCHEDULE)}
                confirmText={"Un-schedule all"}
                confirmVariant={"destructive"}
              >
                <ButtonWithTooltip
                  variant="destructive"
                  className="rounded-l-none"
                  tooltipContent="Unschedule all selected jobs"
                  tooltipContentClassName="text-foreground bg-background border-border border-2"
                >
                  <StopIcon />
                </ButtonWithTooltip>
              </ConfirmationDialogAction>
            </ButtonGroup>
          )}

          <ButtonGroup>
            {advancedFilters && (
              <Button
                variant="destructive"
                onClick={() => onAdvancedFilterChange(undefined)}
              >
                <Trash2Icon />
              </Button>
            )}

            <AdvancedJobFilteringDialog
              onSubmit={onAdvancedFilterChange}
              onExecutionSubmit={onAdvancedExecutionSubmission}
              inputJobIds={selectedRowIdsArray}
              ref={avFilteringRef}
            >
              <Button
                variant="outline"
                className={cn(
                  "border-border",
                  advancedFilters ? "rounded-l-none border-l-0" : "",
                )}
              >
                <FilterIcon /> Advanced filtering
              </Button>
            </AdvancedJobFilteringDialog>
          </ButtonGroup>
        </div>
      </div>
      <Spinner isLoading={isJobFetching} icon={LoaderPinwheelIcon}>
        <DataTable
          columns={columns}
          data={JobsList}
          filters={filterMemo}
          events={tableEventsMemoized}
          rowSelection={selectedRowIds}
          size="h-[calc(100vh-150px)]"
        />
      </Spinner>
    </div>
  )
}
