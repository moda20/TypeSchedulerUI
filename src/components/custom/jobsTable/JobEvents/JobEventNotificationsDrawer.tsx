import SheetActionDialog from "@/components/sheet-action-dialog"
import { ReactNode, useMemo } from "react"
import JobEventNotificationsList from "@/components/custom/jobsTable/JobEvents/JobEventNotificationsList"
import type { JobEventHandlerConfig } from "@/models/jobs"
import type { jobsTableData } from "@/features/jobsTable/interfaces"
import { useQuery } from "@tanstack/react-query"
import { notificationService } from "@/services/notificationsService"
import type { NotificationService } from "@/models/notifications"

interface JobEventNotificationsSheetProps {
  eventHandlers: JobEventHandlerConfig[]
  trigger: ReactNode
  JobDetails: jobsTableData
  modal?: boolean
  onNotificationChange: (handlerData: any) => Promise<void>
  onNotificationDelete?: ({
    configId,
    cb,
  }: {
    configId: string
    cb?: () => Promise<void>
  }) => Promise<void>
}

export default function JobEventNotificationsDrawer({
  eventHandlers,
  trigger,
  modal = true,
  JobDetails,
  onNotificationChange,
  onNotificationDelete,
}: JobEventNotificationsSheetProps) {
  const serviceIds = useMemo(
    () => eventHandlers.map(h => h.notification_service_id),
    [eventHandlers],
  )

  const { data: notificationServices, isLoading: loadingServices } = useQuery({
    queryKey: ["notificationServices", "serviceIds"],
    queryFn: () =>
      notificationService.getAllNotificationServices(
        0,
        serviceIds.length,
        serviceIds,
      ),
    placeholderData: { data: useMemo(() => [], []) },
    select: (d: any) => {
      const servicesMap = new Map<number, NotificationService>()
      d.data.forEach((service: NotificationService, index: number) => {
        servicesMap.set(service.id as number, service)
      })
      return servicesMap
    },
  })

  return (
    <SheetActionDialog
      side="right"
      title={`${JobDetails.name} Event Notifications (${eventHandlers?.length})`}
      description="View and manage event notification configurations"
      trigger={trigger}
      modal={modal}
      contentClassName="w-[500px] sm:w-[600px] sm:max-w-[600px]"
    >
      <div className="py-4">
        <JobEventNotificationsList
          eventHandlers={eventHandlers}
          JobDetails={JobDetails}
          onUpdate={onNotificationChange}
          onDelete={onNotificationDelete}
          notificationServices={notificationServices}
        />
      </div>
    </SheetActionDialog>
  )
}
