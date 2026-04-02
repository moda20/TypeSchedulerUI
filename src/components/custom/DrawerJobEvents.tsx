import SheetActionDialog from "@/components/sheet-action-dialog"
import type { jobsTableData } from "@/features/jobsTable/interfaces"
import { ReactNode, useEffect } from "react"
import { useCallback } from "react"
import { useMemo, useRef } from "react"
import { useState } from "react"
import { JobEventTypes } from "@/models/jobs"
import { useJobEvents } from "@/hooks/useJobEvents"
import { EventItem } from "@/components/custom/general/EventItem"
import { Separator } from "@/components/ui/separator"
import { ManagedSimpleDropdown } from "@/components/custom/ManagedSimpleDropdown"
import { Spinner } from "@/components/ui/spinner"
import { ButtonWithTooltip } from "@/components/custom/general/ButtonWithTooltip"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { ListCheck } from "lucide-react"
import { useVirtualizer } from "@tanstack/react-virtual"
import LoadingOverlay from "@/components/custom/LoadingOverlay"
import { debounce } from "@/utils/generalUtils"

export interface DrawerNewComponentProps {
  JobDetails: jobsTableData
  trigger: ReactNode
}

const selectEventOptions = Object.values(JobEventTypes).map(e => ({
  label: e.toLocaleLowerCase(),
  value: e,
  selected: true,
}))

export default function DrawerJobEvents({
  JobDetails,
  trigger,
}: DrawerNewComponentProps) {
  const [filteredEventTypes, setFilteredEventTypes] = useState([
    JobEventTypes.ERROR,
    JobEventTypes.WARNING,
    JobEventTypes.INFO,
  ])
  const [unreadOnly, setUnreadOnly] = useState(false)
  const parentRef = useRef<HTMLDivElement>(null)

  const { events, latestEvents, loading, setEventsToHandled } = useJobEvents({
    jobId: JobDetails.id,
    eventTypes: filteredEventTypes,
    limit: undefined,
    offset: undefined,
    jobLogId: JobDetails.latestRun?.jobLogId,
    handled: unreadOnly,
  })

  const updateFilterEventTypes = useCallback(
    (events: any) => {
      setFilteredEventTypes(
        events.filter((e: any) => e.selected).map((e: any) => e.value),
      )
    },
    [filteredEventTypes],
  )

  const setEventsToRead = useCallback(
    (eventIds: string | string[]) => {
      return () =>
        setEventsToHandled(Array.isArray(eventIds) ? eventIds : [eventIds])
    },
    [filteredEventTypes],
  )

  const allEvents = useMemo(() => {
    return [...latestEvents, ...events]
  }, [events, latestEvents, latestEvents.length, events.length])

  const rowVirtualizer = useVirtualizer({
    count: allEvents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 40,
    gap: 8,
    lanes: 1,
    enabled: allEvents.length > 0,
    initialOffset: 0,
    getItemKey: index => String(allEvents[index].id),
  })

  const refreshVirtualizer = useCallback(() => {
    setTimeout(() => {
      // TODO find another solution for this timeout issue :
      // the allEvent array although is always updated, doesn't trigger the virtualizer getVirtualItems() function to return filled item array
      rowVirtualizer.measure()
    }, 200)
  }, [rowVirtualizer])

  return (
    <SheetActionDialog
      side={"right"}
      title={`Job Events for ${JobDetails.name}`}
      description={"Read and handle job specific events"}
      trigger={trigger}
      modal={true}
      contentClassName="w-[600px] sm:w-[800px] sm:max-w-[800px]"
      onOpenChange={refreshVirtualizer}
      innerContainerClassName={"gap-2"}
    >
      <div className="mt-2 flex gap-2 w-full">
        <ManagedSimpleDropdown
          onChange={updateFilterEventTypes}
          defaultValue={selectEventOptions}
          inputOptions={selectEventOptions}
          multiSelect={true}
          inputPlaceholder={"Filter events"}
          buttonProps={{
            variant: "outline",
          }}
        />
        <div className="flex gap-2 items-center">
          <Switch checked={unreadOnly} onCheckedChange={setUnreadOnly} />
          <span
            className={cn("text-foreground text-sm transition-colors", {
              "text-muted-foreground": !unreadOnly,
            })}
          >
            Unread only
          </span>
        </div>
        <div className="flex gap-2 items-center ml-auto">
          {loading && <Spinner className=" size-6" />}
          <ButtonWithTooltip
            className="text-foreground bg-background"
            variant="ghost"
            size="icon"
            tooltipContent={"Set all events to read"}
            tooltipContentClassName="text-foreground bg-background border-border border-2"
          >
            <ListCheck className="!h-5 !w-5" />
          </ButtonWithTooltip>
        </div>
      </div>
      <LoadingOverlay isLoading={loading}>
        <div
          ref={parentRef}
          className="overflow-auto h-[calc(100vh-10rem)] w-full"
        >
          <div
            className="relative w-full py-4"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
            key={allEvents.length}
          >
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const ev = allEvents[virtualRow.index]
              return (
                <div
                  className="absolute w-full"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                >
                  <EventItem
                    timestamp={ev.created_at}
                    message={ev.event_message}
                    type={ev.type}
                    onHandle={setEventsToRead(ev.id)}
                    handled={ev.handled}
                    handleTime={ev.handled_on}
                    job={JobDetails}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </LoadingOverlay>
    </SheetActionDialog>
  )
}
