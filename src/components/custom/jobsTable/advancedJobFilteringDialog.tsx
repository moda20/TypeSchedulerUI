import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import useDialogueManager from "@/hooks/useDialogManager"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Download, LucideScanEye, Search } from "lucide-react"
import { DatePickerWithPresets } from "@/components/ui/date-picker-presets"
import type { InputType } from "@/components/custom/general/MultiTypedInput"
import { FlexibleInput } from "@/components/custom/general/MultiTypedInput"
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react"
import ManagedSelect from "@/components/custom/ManagedSelect"
import type { advancedJobExecutionFormSchemaType } from "@/components/custom/jobsTable/AdvancedJobExecutionForm"
import { AdvancedJobExecutionForm } from "@/components/custom/jobsTable/AdvancedJobExecutionForm"
import type { jobsTableData } from "@/features/jobsTable/interfaces"
import jobsService from "@/services/JobsService"
import ScrollableList from "@/components/custom/general/ScrollableList"
import JobItem from "@/components/custom/general/JobItem"
import { ButtonWithTooltip } from "@/components/custom/general/ButtonWithTooltip"
import { Separator } from "@/components/ui/separator"

export interface AdvancedJobFilteringDialogProps {
  children: React.ReactNode
  triggerClassName?: string
  onSubmit?: (value: any, reset?: boolean) => void
  onExecutionSubmit?: (value: any) => void
  inputJobIds?: number[]
}

const jobFilteringSchema = z.object({
  name: z.object({ value: z.string(), type: z.string() }).optional().nullish(),
  cronSetting: z
    .object({ value: z.string(), type: z.string() })
    .optional()
    .nullish(),
  consumer: z
    .object({ value: z.string(), type: z.string() })
    .optional()
    .nullish(),
  status: z.string().optional().nullish(),
  isRunning: z.boolean().optional().nullish(),
  averageTime: z
    .object({
      value1: z.coerce.number(),
      value2: z.coerce.number(),
      type: z.string(),
    })
    .optional()
    .nullish(),
  latestRun: z
    .object({
      from: z.union([z.date(), z.literal(undefined)]),
      to: z.union([z.date(), z.literal(undefined)]).optional(),
    })
    .optional()
    .nullish(),
})

export type jobFilteringSchemaType = z.infer<typeof jobFilteringSchema>

const statusOptions = [
  {
    label: "Stopped",
    value: "STOPPED",
  },
  {
    label: "Started",
    value: "STARTED",
  },
  {
    label: "All",
    value: undefined,
  },
]
const runningStatusOptions = [
  {
    label: "Running",
    value: true,
  },
  {
    label: "Not running",
    value: false,
  },
  {
    label: "All",
    value: undefined,
  },
]

export type AdvancedJobFilteringDialogHandle = {
  reset: () => void
}

const textOnlyInputTypes: InputType[] = ["exact", "regex"]

export const AdvancedJobFilteringDialog = forwardRef<
  AdvancedJobFilteringDialogHandle,
  AdvancedJobFilteringDialogProps
>(
  (
    { triggerClassName, children, onSubmit, onExecutionSubmit, inputJobIds },
    ref,
  ) => {
    const { isDialogOpen, setDialogState } = useDialogueManager()
    const [previewJobList, setPreviewJobList] = useState<Array<jobsTableData>>(
      [],
    )

    useEffect(() => {
      if (isDialogOpen && inputJobIds?.length) {
        jobsService
          .getAllJobs(null, undefined, undefined, undefined, inputJobIds)
          .then(d => {
            setPreviewJobList(d)
          })
      }
    }, [isDialogOpen, inputJobIds])

    const getPreviewJobs = (values: jobFilteringSchemaType) => {
      const finalFormValues = sanitizeFormValues(values)
      jobsService.filterJobs(null, [], finalFormValues).then(d => {
        setPreviewJobList(d)
      })
    }

    const exportFilteredJobsToJSON = (values: jobFilteringSchemaType) => {
      const finalFormValues = sanitizeFormValues(values)
      jobsService.exportJobsToJSON(finalFormValues)
    }

    useImperativeHandle(ref, () => ({
      reset: () => {
        form.reset()
        setPreviewJobList([])
      },
    }))

    const form = useForm<jobFilteringSchemaType>({
      resolver: zodResolver(jobFilteringSchema),
      defaultValues: {
        name: undefined,
        cronSetting: undefined,
        consumer: undefined,
        status: undefined,
        isRunning: undefined,
        averageTime: undefined,
        latestRun: undefined,
      },
    })

    const resetFilteringForm = useCallback(() => {
      form.reset({
        name: null,
        cronSetting: null,
        consumer: null,
        status: null,
        isRunning: null,
        averageTime: null,
        latestRun: null,
      })

      setPreviewJobList([])
      submitForm(form.getValues(), null, true)
    }, [form, previewJobList])

    const sanitizeFormValues = (values: jobFilteringSchemaType) => {
      return {
        ...values,
        status: values.status ? [values.status] : ["STOPPED", "STARTED"],
        latestRun: values.latestRun
          ? {
              type: "between",
              value1: values.latestRun.from,
              value2: values.latestRun.to,
            }
          : undefined,
        name: values.name?.value ? values.name : undefined,
        cronSetting: values.cronSetting?.value ? values.cronSetting : undefined,
        consumer: values.consumer?.value ? values.consumer : undefined,
        isRunning: values.isRunning ?? undefined,
        averageTime: values.averageTime ?? undefined,
      }
    }

    function submitForm(
      values: jobFilteringSchemaType,
      event?: any,
      reset?: boolean,
    ) {
      setDialogState(false)
      onSubmit?.(sanitizeFormValues(values), reset ?? false)
    }

    const submitExecutionForm = (
      values: advancedJobExecutionFormSchemaType,
    ) => {
      const finalValues = {
        ...values,
        targetJobs: previewJobList.map(e => e.id),
      }
      onExecutionSubmit?.(finalValues)
    }

    const errorHandler = useCallback(
      (field: any, err?: string) => {
        if (err) {
          form.setError(field.name, { message: err })
        } else {
          form.clearErrors(field.name)
        }
      },
      [form],
    )

    return (
      <Dialog
        open={isDialogOpen}
        onOpenChange={v => {
          setDialogState(v)
        }}
      >
        <DialogTrigger
          className={cn(triggerClassName)}
          onClick={v => {
            v.preventDefault()
            setDialogState(true)
          }}
          asChild
        >
          {children}
        </DialogTrigger>
        <DialogContent
          className={cn("sm:max-w-[925px] text-foreground bg-background")}
          onEscapeKeyDown={e => {
            e.preventDefault()
            setDialogState(false)
          }}
        >
          <DialogHeader>
            <DialogTitle>Advanced Task execution</DialogTitle>
            <DialogDescription>
              Filter and execute tasks in batches
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 ">
            <div className="flex flex-col gap-2 w-6/12">
              <h4>Filtering</h4>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(submitForm)}
                  className="flex flex-col gap-4 py-4 "
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <FlexibleInput
                            type="regex"
                            placeholder="Job name"
                            {...field}
                            value={field.value ?? ""}
                            onError={errorHandler}
                            acceptedInputTypes={textOnlyInputTypes}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cronSetting"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cron Setting</FormLabel>
                        <FormControl>
                          <FlexibleInput
                            type="regex"
                            placeholder="Cron setting"
                            {...field}
                            value={field.value ?? ""}
                            onError={errorHandler}
                            acceptedInputTypes={textOnlyInputTypes}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="consumer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consumer</FormLabel>
                        <FormControl>
                          <FlexibleInput
                            type="regex"
                            placeholder="Consumer"
                            {...field}
                            value={field.value ?? ""}
                            onError={errorHandler}
                            acceptedInputTypes={textOnlyInputTypes}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 justify-evenly w-full">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Status</FormLabel>
                          <ManagedSelect
                            onChange={field.onChange}
                            inputOptions={statusOptions}
                            defaultValue={field.value ?? undefined}
                            exportOnlyValue={true}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isRunning"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Is Running</FormLabel>
                          <FormControl>
                            <div className="flex flex-col space-y-2">
                              <ManagedSelect
                                onChange={field.onChange}
                                inputOptions={runningStatusOptions}
                                defaultValue={field.value ?? undefined}
                                exportOnlyValue={true}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="averageTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Average Time (sec)</FormLabel>
                        <FormControl>
                          <FlexibleInput
                            placeholder="Average time"
                            {...field}
                            onError={errorHandler}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="latestRun"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Last Run Date Range</FormLabel>
                        <FormControl>
                          <DatePickerWithPresets onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 items-center justify-evenly w-full mt-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={resetFilteringForm}
                    >
                      Reset
                    </Button>
                    <Button type="submit" className="w-full">
                      <Search className="mr-2 h-4 w-4" /> Apply Filters
                    </Button>
                    <Button
                      type="button"
                      className="w-4/12"
                      variant="outline"
                      onClick={() => getPreviewJobs(form.getValues())}
                    >
                      <LucideScanEye className="mr-2 h-4 w-4" /> Preview
                    </Button>
                    <ButtonWithTooltip
                      type="button"
                      className="w-3/12"
                      variant="outline"
                      size="icon"
                      onClick={() => exportFilteredJobsToJSON(form.getValues())}
                      tooltipContent="Export filtered jobs to JSON"
                    >
                      <Download className="h-4 w-4" />
                    </ButtonWithTooltip>
                  </div>
                </form>
              </Form>
            </div>
            <Separator
              orientation="vertical"
              className="mr-2 w-1 rounded self-stretch"
            />
            <div className="flex flex-col gap-2 w-6/12">
              <h4>Manual queue execution</h4>
              {previewJobList.length > 0 && (
                <div className="max-h-[240px]  flex flex-col gap-2">
                  <h6 className="text-sm italic">
                    {inputJobIds?.length
                      ? "Pre-selected jobs"
                      : "Affected Jobs"}{" "}
                    ({previewJobList.length})
                  </h6>
                  <ScrollableList
                    className="min-w-[230px] overflow-y-auto"
                    originalList={previewJobList}
                    autoFocus={false}
                    loadMore={false}
                    autoClickFocusedItem={true}
                    renderItem={(job: jobsTableData, index: number) => {
                      return <JobItem className="w-full bg-sidebar" job={job} />
                    }}
                  />
                </div>
              )}
              <AdvancedJobExecutionForm
                onSubmit={submitExecutionForm}
                className=""
                disabled={!previewJobList.length}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  },
)
