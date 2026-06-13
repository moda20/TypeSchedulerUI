import useDialogueManager from "@/hooks/useDialogManager"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Bell,
  DockIcon,
  Edit2Icon,
  EllipsisVertical,
  EyeIcon,
  FileSliders,
  LogsIcon,
  Settings,
  Trash2Icon,
} from "lucide-react"
import ConfirmationDialogAction, {
  ConfirmationDialogActionType,
} from "@/components/confirmationDialogAction"
import { JobUpdateDialog } from "@/components/job-update-dialog"
import DrawerLokiLogs from "@/components/custom/DrawerLokiLogs"
import type {
  jobsTableData,
  tableColumnsProps,
} from "@/features/jobsTable/interfaces"
import { jobActions } from "@/features/jobsTable/interfaces"
import type { DateRange } from "react-day-picker"
import DrawerJobFiles from "@/components/custom/DrawerJobFiles"
import type { ComponentPropsWithoutRef, ReactNode } from "react"
import React, { useCallback, useMemo } from "react"
import DropdownMenuItemExtended from "@/components/custom/general/DropdownItemExtended"
import DrawerLatestRuns from "@/components/custom/DrawerLatestRuns"
import { CardStackIcon } from "@radix-ui/react-icons"
import { JobExecutionDialog } from "@/components/job-execution-dialog"
import DrawerJobEvents from "@/components/custom/DrawerJobEvents"
import DrawerFilePreview from "@/components/custom/DrawerFilePreview"
import JobEventNotificationsDrawer from "@/components/custom/jobsTable/JobEvents/JobEventNotificationsDrawer"

export interface ActionDropdownProps {
  columnsProps: tableColumnsProps
  row: jobsTableData
  defaultLogPeriod: DateRange
  inputGroup?: string
  children?: ReactNode
  modal?: boolean
  dropdownContentProps?: ComponentPropsWithoutRef<typeof DropdownMenuContent>
  refreshJob?: () => Promise<void>
}
export default function ActionDropdown({
  columnsProps,
  row,
  defaultLogPeriod,
  inputGroup,
  children,
  modal,
  dropdownContentProps,
  refreshJob,
}: ActionDropdownProps) {
  const { isDialogOpen, setDialogState, isTopOfTheStack } = useDialogueManager({
    inputGroup: inputGroup ?? "JobActions",
  })

  const handleMenuTriggerClick = useCallback(
    (e: any) => {
      if (!isDialogOpen) {
        setDialogState(true)
      }
    },
    [setDialogState, isTopOfTheStack],
  )

  const handleEscapeKeyTrigger = useCallback(
    (v: any) => {
      if (v.key === "Escape") {
        v.preventDefault()
        setDialogState(false)
      }
    },
    [setDialogState],
  )

  const handleEscapeDirectTrigger = useCallback(
    (e: any) => {
      e.preventDefault()
      setDialogState(false)
    },
    [setDialogState],
  )

  const handleEventPrevention = useCallback((e: any) => {
    e.preventDefault()
  }, [])

  const handleConfirmationDialogAction = useCallback(
    (action: ConfirmationDialogActionType) => {
      if (action === ConfirmationDialogActionType.CANCEL) return
      columnsProps.takeAction(
        row,
        row.status === "STARTED" ? jobActions.UNSCHEDULE : jobActions.SCHEDULE,
      )
    },
    [columnsProps, row, setDialogState],
  )

  const handleConfirmationDeleteAction = useCallback(
    (action: ConfirmationDialogActionType) => {
      if (action === ConfirmationDialogActionType.CANCEL) return
      columnsProps.takeAction(row, jobActions.SOFT_DELETE)
    },
    [columnsProps, row, setDialogState],
  )

  const handleJobUpdateAction = useCallback(
    async (jobData: any) => {
      return columnsProps.takeAction(row, jobActions.UPDATE, jobData)
    },
    [row],
  )

  const handleJobEventHandlerAction = useCallback(
    async (handlerData: any) => {
      return columnsProps.takeAction(
        row,
        jobActions.UPDATE_EVENT_HANDLER,
        handlerData,
      )
    },
    [row],
  )

  const handleJobEventHandlerDelete = useCallback(
    async ({ configId }: { configId: string; cb?: () => Promise<void> }) => {
      return columnsProps.takeAction(
        row,
        jobActions.DELETE_EVENT_HANDLER,
        configId,
      )
    },
    [row],
  )

  const handleCustomJobExecution = useCallback(
    (jobParams: any) => {
      return columnsProps.takeAction(
        row,
        jobActions.EXECUTE_WITH_PARAMS,
        jobParams,
      )
    },
    [row],
  )

  const handleJobExecutionAction = useCallback(() => {
    if (!row.initialized && row.status === "STARTED") return
    return columnsProps.takeAction(row, jobActions.EXECUTE)
  }, [row])

  const handleJobRefresh = useCallback(() => {
    if (!row.initialized && row.status === "STARTED") return
    return columnsProps.takeAction(row, jobActions.REFRESH)
  }, [row])

  const eventHandlers = useMemo(() => {
    try {
      const params = JSON.parse(row.param || "{}")
      return params.eventHandlers || []
    } catch {
      return []
    }
  }, [row.param])

  return (
    <DropdownMenu
      modal={modal ?? false}
      open={isDialogOpen}
      onOpenChange={setDialogState}
    >
      <DropdownMenuTrigger asChild onSelect={handleMenuTriggerClick}>
        {children ?? (
          <Button
            variant="ghost"
            size={"icon"}
            onKeyDown={handleEscapeKeyTrigger}
          >
            <EllipsisVertical />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-background w-auto"
        onEscapeKeyDown={handleEscapeDirectTrigger}
        {...dropdownContentProps}
      >
        <DropdownMenuLabel>Config {row.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <ConfirmationDialogAction
            title={
              row.status === "STARTED"
                ? "Un-schedule the job"
                : "Schedule the job"
            }
            description={
              "this action will schedule the execution of the job based on it's cron setting"
            }
            takeAction={handleConfirmationDialogAction}
            confirmText={row.status === "STARTED" ? "Un-schedule" : "Schedule"}
            autoFocus={true}
          >
            <DropdownMenuItemExtended
              keyBinding="S"
              disabled={!isTopOfTheStack}
            >
              <Settings />
              <span>
                {row.status === "STARTED" ? "deSchedule" : "Schedule"}
              </span>
              <DropdownMenuShortcut>S</DropdownMenuShortcut>
            </DropdownMenuItemExtended>
          </ConfirmationDialogAction>
          <JobUpdateDialog
            jobDetails={row}
            isCreateDialog={false}
            itemList={columnsProps.getAvailableConsumers}
            onChange={handleJobUpdateAction}
            triggerClassName="w-full"
          >
            <DropdownMenuItemExtended
              keyBinding="meta+u"
              onSelect={handleEventPrevention}
              disabled={!isTopOfTheStack}
            >
              <Edit2Icon />
              <span>Update config</span>
              <DropdownMenuShortcut>⌘U</DropdownMenuShortcut>
            </DropdownMenuItemExtended>
          </JobUpdateDialog>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Execution</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItemExtended
            keyBinding="meta+e"
            onClick={handleJobExecutionAction}
            disabled={
              !isTopOfTheStack || (!row.initialized && row.status === "STARTED")
            }
          >
            <DockIcon />
            <span>Run now</span>
            <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
          </DropdownMenuItemExtended>
          <JobExecutionDialog
            jobDetails={row}
            onChange={handleCustomJobExecution}
            triggerClassName="w-full"
            //freezeDialog={!isTopOfTheStack}
          >
            <DropdownMenuItemExtended
              keyBinding="meta+shift+e"
              onSelect={handleEventPrevention}
              //disabled={!isTopOfTheStack}
            >
              <DockIcon />
              <span>Custom run</span>
              <DropdownMenuShortcut>⌘+⇧+E</DropdownMenuShortcut>
            </DropdownMenuItemExtended>
          </JobExecutionDialog>
          <DropdownMenuItemExtended
            keyBinding="R"
            onClick={handleJobRefresh}
            disabled={
              !isTopOfTheStack || (!row.initialized && row.status === "STARTED")
            }
          >
            <DockIcon />
            <span>Refresh Task File</span>
            <DropdownMenuShortcut>R</DropdownMenuShortcut>
          </DropdownMenuItemExtended>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DrawerJobEvents
            JobDetails={row}
            trigger={
              <DropdownMenuItemExtended
                keyBinding="E"
                onSelect={handleEventPrevention}
                disabled={!isTopOfTheStack}
              >
                <LogsIcon />
                <span>Job Events</span>
                <DropdownMenuShortcut>E</DropdownMenuShortcut>
              </DropdownMenuItemExtended>
            }
          />
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <JobEventNotificationsDrawer
            eventHandlers={eventHandlers}
            JobDetails={row}
            trigger={
              <DropdownMenuItemExtended
                keyBinding="N"
                onSelect={handleEventPrevention}
                disabled={!isTopOfTheStack}
              >
                <Bell />
                <span>Event Notifications</span>
                <DropdownMenuShortcut>N</DropdownMenuShortcut>
              </DropdownMenuItemExtended>
            }
            onNotificationChange={handleJobEventHandlerAction}
            onNotificationDelete={handleJobEventHandlerDelete}
            modal={modal}
          />
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DrawerLokiLogs
            jobName={row.name}
            start={defaultLogPeriod.from}
            end={defaultLogPeriod.to}
            jobId={row.id}
            trigger={
              <DropdownMenuItemExtended
                keyBinding="L"
                onSelect={handleEventPrevention}
                disabled={!isTopOfTheStack}
              >
                <LogsIcon />
                <span>Latest Logs</span>
                <DropdownMenuShortcut>L</DropdownMenuShortcut>
              </DropdownMenuItemExtended>
            }
          />
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DrawerJobFiles
            JobDetails={row}
            trigger={
              <DropdownMenuItemExtended
                keyBinding="O"
                onSelect={handleEventPrevention}
                disabled={!isTopOfTheStack}
              >
                <FileSliders />
                <span>Output Files</span>
                <DropdownMenuShortcut>O</DropdownMenuShortcut>
              </DropdownMenuItemExtended>
            }
          />
          <DrawerFilePreview
            trigger={
              <DropdownMenuItemExtended
                keyBinding="V"
                onSelect={handleEventPrevention}
                disabled={!isTopOfTheStack}
              >
                <EyeIcon />
                <span>Preview Consumer</span>
                <DropdownMenuShortcut>V</DropdownMenuShortcut>
              </DropdownMenuItemExtended>
            }
            id={row.id}
            fileName={row.consumer ?? ""}
            fileType="tsc"
            fileNature="consumer"
            readOnly={true}
          />
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DrawerLatestRuns
            JobDetails={row}
            trigger={
              <DropdownMenuItemExtended
                keyBinding="P"
                onSelect={handleEventPrevention}
                disabled={!isTopOfTheStack}
              >
                <CardStackIcon />
                <span>Previous Runs</span>
                <DropdownMenuShortcut>P</DropdownMenuShortcut>
              </DropdownMenuItemExtended>
            }
          />
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <ConfirmationDialogAction
            title={`Delete Job : ${row.name}`}
            description={
              "This action will un-schedule and set to inactive the job but will NOT stop it if it's running"
            }
            takeAction={handleConfirmationDeleteAction}
            autoFocus={true}
            confirmVariant="destructive"
          >
            <DropdownMenuItem
              className={"bg-destructive"}
              onSelect={handleEventPrevention}
              disabled={!isTopOfTheStack}
            >
              <Trash2Icon />
              <span>Delete job</span>
            </DropdownMenuItem>
          </ConfirmationDialogAction>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
