import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  CogIcon,
  CopyIcon,
  EditIcon,
  FileX2,
  LoaderIcon,
  LoaderPinwheelIcon,
  Plus,
  PlusIcon,
  TestTubeIcon,
  Unlock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import ScrollableList from "@/components/custom/general/ScrollableList"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { NotificationService } from "@/models/notifications"
import { notificationService } from "@/services/notificationsService"

import Spinner from "@/components/custom/LoadingOverlay"
import moment from "moment"
import JobItem from "@/components/custom/general/JobItem"
import HoverScreenComponent from "@/components/custom/general/HoverScreenComponent"
import type { jobsTableData } from "@/features/jobsTable/interfaces"
import jobsService from "@/services/JobsService"
import ConfirmationDialogAction, {
  ConfirmationDialogActionType,
} from "@/components/confirmationDialogAction"
import { toast } from "@/hooks/use-toast"
import { NotificationLinkDialog } from "@/components/custom/system/NotificationLinkDialog"
import { NotificationConfigDialog } from "@/components/custom/system/NotificationConfigDialog"
import BImage from "@/components/custom/general/PublicBackendImage"
import { Separator } from "@/components/ui/separator"
import { CardStackIcon, Cross2Icon } from "@radix-ui/react-icons"
import { NotificationConfigUpdateDialog } from "@/components/custom/system/NotificationConfigUpdateDialog"
import ButtonWithStrCut from "@/components/custom/general/ButtonWithStrCut"
import { NotificationCloneDialog } from "@/components/custom/system/NotificationCloneDialog"
import { useMutation } from "@tanstack/react-query"

export default function NotificationServicesPanel() {
  const [notificationServices, setNotificationServices] = useState<{
    total: number
    offset?: number
    data: NotificationService[]
  }>({ total: 0, data: [] })

  const [selectedService, setSelectedService] = useState<NotificationService>()

  const [selectedServicesAttachedJobs, setSelectedServicesAttachedJobs] =
    useState<Array<any>>([])

  const [infoLoading, setInfoLoading] = useState(false)

  const getServices = (offset?: number) => {
    return notificationService.getAllNotificationServices(
      offset,
    ) as Promise<any>
  }

  const initializeServices = () => {
    getServices().then(data => {
      setNotificationServices(data)
      if (selectedService) {
        setSelectedService(
          data.data.find((e: any) => e.id === selectedService.id) ??
            data.data[0],
        )
      } else {
        setSelectedService(data.data[0])
      }
    })
  }

  const deleteService = (serviceId: number) => {
    return notificationService.deleteNotificationService(serviceId).then(() => {
      toast({
        title: `Service ${selectedService?.name} deleted`,
        duration: 2000,
      })
      return initializeServices()
    })
  }

  const loadMoreServices = useCallback(
    async (offset?: number) => {
      setNotificationServices({
        ...notificationServices,
        offset: offset ?? notificationServices.offset,
      })

      return getServices(offset).then(d => d.data)
    },
    [notificationServices.total, notificationServices.offset],
  )

  const getAllServices = useMemo(() => {
    return notificationServices.data
  }, [notificationServices.data])

  useEffect(() => {
    initializeServices()
  }, [])

  const onItemSelect = useCallback(
    (item: NotificationService) => {
      setInfoLoading(true)
      return notificationService
        .getAttachedJobs(Number(item.id))
        .then((data: any) => {
          setSelectedServicesAttachedJobs(data)
          item.jobs = data.map((e: any) => Number(e.id))
          setSelectedService(item)
        })
        .finally(() => {
          setInfoLoading(false)
        })
    },
    [selectedService],
  )

  const handleConfirmationDialogAction = useCallback(
    (action: ConfirmationDialogActionType, ...rest: any) => {
      if (action === ConfirmationDialogActionType.CANCEL) return
      return detachServiceFromJobNotifications(rest[0], rest[1])
        .then(() => {
          return onItemSelect(selectedService!)
        })
        .catch(err => {
          toast({
            title: err.message,
            variant: "destructive",
          })
        })
    },
    [selectedService, selectedServicesAttachedJobs],
  )
  const detachServiceFromJobNotifications = (
    job: jobsTableData,
    serviceId: number,
  ) => {
    const jobsParam = JSON.parse(job.param || "{}")
    if (jobsParam.notificationServices?.includes(serviceId)) {
      jobsParam.notificationServices = jobsParam.notificationServices.filter(
        (e: number) => e !== serviceId,
      )
      job.param = JSON.stringify(jobsParam)
    }
    return jobsService
      .executeActionWithUpdate(
        "UPDATE",
        {
          param: job.param,
        },
        job.id,
      )
      .finally(() => {
        setInfoLoading(false)
      })
  }

  const getAllJobs = useCallback(() => {
    return jobsService
      .getAllJobs(null, undefined, 999999, 0)
      .then((data: any) => {
        return data.map((item: any) => {
          return {
            value: item.id?.toString(),
            label: item.name,
          }
        })
      })
  }, [])

  const getAllServiceEntrypoints = useCallback(() => {
    return notificationService.getAllServiceEntryPoints().then((data: any) => {
      return data.map((item: any) => {
        return {
          value: item,
          label: item,
        }
      })
    })
  }, [])

  const attachJobsToNotificationService = useCallback(
    (service: { id: string | number; jobs?: Array<any>; name: string }) => {
      return notificationService
        .attachAServiceToJob(
          service.jobs?.map(Number) || [],
          Number(service.id),
        )
        .then(() => {
          toast({
            title: `Service ${service.name} linked to ${service.jobs?.length} jobs`,
            duration: 2000,
          })
        })
    },
    [selectedService, selectedServicesAttachedJobs],
  )

  const createNotificationService = useCallback(
    (inputData: FormData) => {
      return (
        inputData.get("id")
          ? notificationService.updateNotificationService
          : notificationService.addNotificationService
      )(inputData)
        .then(() => {
          toast({
            title: `Notification service ${inputData.get("name")} ${inputData.get("id") ? "updated" : "created"}`,
            duration: 2000,
          })
        })
        .then(initializeServices)
    },
    [selectedService, selectedServicesAttachedJobs],
  )

  const updateNotificationServiceConfig = useCallback(
    async (updatedConfig: any) => {
      if (!selectedService) return
      try {
        const constUpdateResult =
          await notificationService.updateNotificationServiceConfig(
            selectedService?.name,
            updatedConfig,
          )
        if (constUpdateResult.skipped.length) {
          toast({
            title: `Config update skipped for ${constUpdateResult.skipped.join(", ")}
          Config update passed for ${constUpdateResult.updated.join(", ")}
          `,
            duration: 2000,
            variant: "destructive",
          })
        } else {
          const successToastMessage =
            !constUpdateResult.updated.length &&
            !constUpdateResult.skipped.length
              ? `No configuration was updated`
              : `Config update successfully`
          toast({
            title: successToastMessage,
            duration: 2000,
          })
        }
      } catch (e: any) {
        toast({
          title: `Error updating config: ${e.message}`,
          duration: 2000,
          variant: "destructive",
        })
      }
    },
    [selectedService],
  )

  const cloneNotificationService = useCallback(
    async (serviceId: number, name: string) => {
      try {
        await notificationService.cloneNotificationService(serviceId, name)
        toast({
          title: `Service "${name}" created successfully`,
          duration: 2000,
        })
        return initializeServices()
      } catch (e: any) {
        const errorMessage =
          e.response?.data?.message || e.message || "Failed to clone service"
        toast({
          title: `Error cloning service: ${errorMessage}`,
          duration: 2000,
          variant: "destructive",
        })
        throw e
      }
    },
    [selectedService, selectedServicesAttachedJobs],
  )

  const testNotificationService = useCallback(async () => {
    return notificationService.testNotificationService(
      Number(selectedService.id),
    )
  }, [selectedService])

  const testNotificationServiceMutation = useMutation({
    mutationFn: testNotificationService,
    onError: () => {
      toast({
        title: "Error sending test message",
        variant: "destructive",
      })
    },
    onSuccess: data => {
      toast({
        title: `Test message was sent`,
        duration: 2000,
      })
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className={"flex flex-col gap-1 mb-4"}>
        <h2 className="text-2xl font-bold tracking-tight">
          Notification services
        </h2>
        <p className="text-md font-light">
          Manage Notification services and attach them to be used on jobs
        </p>
      </div>
      <Card className="border-0">
        <CardContent className="p-2 pt-0">
          <div className={"flex gap-2 h-full"}>
            <div className="flex flex-col gap-2 pt-2 h-[calc(100vh-12rem)]">
              <NotificationConfigDialog
                JobsList={getAllJobs}
                serviceFileList={getAllServiceEntrypoints}
                onChange={createNotificationService}
                isCreateDialog={true}
              >
                <Button
                  variant="ghost"
                  className="w-full gap-2 border-dashed border-2 border-border hover:border-solid hover:bg-transparent"
                >
                  <Plus className="h-4 w-4" />
                  Add service
                </Button>
              </NotificationConfigDialog>
              <ScrollableList
                className="min-w-[230px] sm:min-w-[260px] md:min-w-[290px] flex-grow overflow-y-auto"
                originalList={getAllServices}
                autoFocus={true}
                loadMore={
                  (notificationServices.offset ?? 0) <
                  notificationServices.total
                }
                autoClickFocusedItem={true}
                renderNoItems={() => (
                  <div className="flex flex-col gap-2 items-center justify-center p-2 border-border border rounded-md">
                    <FileX2 />
                    <div className="text-muted-foreground text-sm">
                      No services found
                    </div>
                  </div>
                )}
                onItemClick={onItemSelect}
                loadMoreAction={loadMoreServices}
                itemClassName={item =>
                  `hover:border-blue-500 focus:border-blue-500 border border-border rounded-xl hover:cursor-pointer hover:shadow-md`
                }
                renderItem={(item: NotificationService, index) => {
                  return (
                    <div className="flex flex-row gap-3 items-center rounded-xl p-2 bg-sidebar sm:min-w-[260px] md:min-w-[280px]">
                      <BImage
                        className="rounded-md w-12 h-12 aspect-square"
                        src={item.image}
                        alt="NoImg"
                      />
                      <div className="flex flex-col gap-1 min-w-0 max-w-[220px]">
                        <div className="text-sm font-bold line-clamp-2">
                          {item.name}
                        </div>
                        <div className="text-xs text-[--muted-foreground] line-clamp-4 md:line-clamp-2 min-w-0">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  )
                }}
              />
            </div>
            <Separator
              orientation="vertical"
              className={"w-1 h-auto rounded mx-1"}
            />
            <Spinner
              isLoading={infoLoading}
              icon={LoaderPinwheelIcon}
              className="h-full w-full block pt-2"
            >
              {notificationServices.data.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-l font-bold tracking-tight italic flex gap-2 items-center">
                    <span>Basic info</span>
                    {selectedService && (
                      <>
                        <NotificationConfigDialog
                          JobsList={getAllJobs}
                          serviceFileList={getAllServiceEntrypoints}
                          onChange={createNotificationService}
                          triggerClassName={"gap-2"}
                          notificationServiceDetails={selectedService}
                          onDeletion={deleteService}
                        >
                          <Button
                            variant={"ghost"}
                            size={"icon"}
                            title="Edit the notification info"
                          >
                            <EditIcon />
                          </Button>
                        </NotificationConfigDialog>

                        <div className="ml-auto flex gap-2">
                          <NotificationCloneDialog
                            notificationServiceDetails={selectedService}
                            onChange={cloneNotificationService}
                          >
                            <ButtonWithStrCut
                              variant={"outline"}
                              title="Clone this notification service"
                            >
                              <CopyIcon />
                              Clone
                            </ButtonWithStrCut>
                          </NotificationCloneDialog>
                          <NotificationConfigUpdateDialog
                            serviceName={selectedService?.name}
                            onChange={updateNotificationServiceConfig}
                          >
                            <ButtonWithStrCut
                              variant={"outline"}
                              title="Edit the notification info"
                            >
                              <CogIcon />
                              Config
                            </ButtonWithStrCut>
                          </NotificationConfigUpdateDialog>
                          <ButtonWithStrCut
                            variant={"outline"}
                            title="Send a test message"
                            disabled={testNotificationServiceMutation.isPending}
                            onClick={() =>
                              testNotificationServiceMutation.mutateAsync()
                            }
                          >
                            {testNotificationServiceMutation.isPending ? (
                              <LoaderIcon className="animate-spin" />
                            ) : (
                              <TestTubeIcon />
                            )}
                            Test
                          </ButtonWithStrCut>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-4 w-full">
                    <BImage
                      src={selectedService?.image}
                      alt={selectedService?.name}
                      className="sm:w-3/12 md:w-2/12 rounded-md"
                    />
                    <div className="flex flex-col gap-2 pl-3 border-l-4 border-border">
                      <div className="flex gap-2 ">
                        <span className="min-w-[120px] font-bold">Name :</span>
                        <div className="font-medium w-auto capitalize">
                          {selectedService?.name}
                        </div>
                      </div>
                      <div className="flex gap-2 ">
                        <span className="min-w-[120px] font-bold">
                          Created at :
                        </span>
                        <div className="font-medium w-auto">
                          {moment(selectedService?.created_at).format(
                            "YYYY-MM-DD HH:mm:ss",
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="min-w-[120px] font-bold">
                          description :
                        </span>
                        <div className="font-medium w-auto ">
                          {selectedService?.description}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-l font-bold italic tracking-tight mt-2 flex gap-2 items-center">
                    <span>
                      Attached jobs ({selectedServicesAttachedJobs?.length})
                    </span>
                    <NotificationLinkDialog
                      JobsList={getAllJobs}
                      notificationDetails={selectedService}
                      onChange={attachJobsToNotificationService}
                    >
                      <Button
                        variant={"ghost"}
                        size={"icon"}
                        title={
                          selectedServicesAttachedJobs?.length
                            ? "Edit attached jobs"
                            : "Attach new Jobs"
                        }
                      >
                        {selectedServicesAttachedJobs?.length ? (
                          <EditIcon />
                        ) : (
                          <PlusIcon />
                        )}
                      </Button>
                    </NotificationLinkDialog>
                  </div>
                  {selectedServicesAttachedJobs?.length === 0 && (
                    <div className="flex flex-col gap-2 items-center justify-center p-2 border-border border rounded-md">
                      <Cross2Icon />
                      <div className="text-muted-foreground text-sm">
                        No attached jobs
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 flex-wrap max-h-[350px] overflow-y-auto">
                    {selectedServicesAttachedJobs.map(e => {
                      return (
                        <HoverScreenComponent
                          key={e.id}
                          hoverComponent={
                            <ConfirmationDialogAction
                              title={`Detach ${e.name} Job ?`}
                              description={
                                "This will detach this service from the job making it not available on the next run of the job"
                              }
                              takeAction={handleConfirmationDialogAction}
                              confirmText="Detach Job"
                              extraTakeActionArgs={[
                                e,
                                Number(selectedService?.id),
                              ]}
                            >
                              <Button variant="destructive" size={"sm"}>
                                <Unlock /> Detach Job
                              </Button>
                            </ConfirmationDialogAction>
                          }
                        >
                          <JobItem className="w-full bg-sidebar" job={e} />
                        </HoverScreenComponent>
                      )
                    })}
                  </div>
                </div>
              )}
            </Spinner>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
