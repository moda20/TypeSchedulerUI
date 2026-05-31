import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { jobsTableData } from "@/features/jobsTable/interfaces"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import Cron from "react-js-cron"
import { PlusIcon, SaveIcon } from "lucide-react"
import type { ComboBoxItem } from "@/components/ui/combo-box"
import { ComboBox } from "@/components/ui/combo-box"
import { cn, parseCron } from "@/lib/utils"
import useDialogueManager from "@/hooks/useDialogManager"
import { useHotkeys } from "react-hotkeys-hook"
import { useCallback, useMemo, useState } from "react"
import MonacoFileViewer from "@/components/custom/MonacoFileViewer"
import ExpandableCard from "@/components/custom/general/ExpandableCard"
import ButtonWithStrCut from "@/components/custom/general/ButtonWithStrCut"

export interface JobUpdateDialogProps {
  children: React.ReactNode
  isCreateDialog?: boolean
  jobDetails?: jobsTableData
  itemList: ComboBoxItem[] | (() => Promise<ComboBoxItem[]>)
  onChange: (value: z.infer<typeof jobUpdateSchema>) => void
  triggerClassName?: string
}
export type JobUpdateType = z.infer<typeof jobUpdateSchema>

const jobUpdateSchema = z.object({
  cronSetting: z.string(),
  name: z.string(),
  consumer: z.string(),
  param: z.string().nullish(),
})

export function JobUpdateDialog({
  children,
  isCreateDialog,
  jobDetails,
  onChange,
  itemList,
  triggerClassName,
}: JobUpdateDialogProps) {
  const [paramsShown, setParamsShown] = useState(false)
  const form = useForm<z.infer<typeof jobUpdateSchema>>({
    resolver: zodResolver(jobUpdateSchema),
    defaultValues: {
      name: jobDetails?.name,
      consumer: jobDetails?.consumer,
      cronSetting: jobDetails?.cronSetting,
      param: jobDetails?.param,
    },
  })
  const { isDialogOpen, setDialogState } = useDialogueManager()

  const resetState = useCallback(
    (finalState: boolean) => {
      if (!finalState) {
        form.reset()
      }
    },
    [form],
  )

  const paramsValue = useMemo(() => {
    return isCreateDialog ? {} : JSON.parse(jobDetails?.param ?? "{}")
  }, [jobDetails?.param, isCreateDialog])

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={v => {
        setDialogState(v, resetState)
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
        className={cn(
          "sm:max-w-[425px] text-foreground bg-background",
          paramsShown ? "sm:w-[900px] sm:max-w-[80vw]" : "",
        )}
        onEscapeKeyDown={e => {
          e.preventDefault()
          setDialogState(false, resetState)
        }}
      >
        <DialogHeader>
          <DialogTitle>{isCreateDialog ? "Create" : "Edit"} Job</DialogTitle>
          <DialogDescription>
            {isCreateDialog
              ? "Create a new job here. Click save when you're done."
              : `Edit the ${jobDetails?.name} job`}
          </DialogDescription>
        </DialogHeader>
        <div className={cn("flex transition-all duration-200 min-w-0")}>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(
                v => {
                  onChange(v)
                  setDialogState(false, resetState)
                },
                err => {},
              )}
              className="space-y-8 w-full"
            >
              <ExpandableCard
                className="gap-2"
                mainContentClassName="gap-4 min-w-0"
                onExpandedChange={expanded => setParamsShown(expanded)}
                expandedContent={
                  <div className="max-w-[400px] flex-grow w-full">
                    <FormField
                      control={form.control}
                      name="param"
                      render={({ field }) => (
                        <div className="">
                          <FormItem className="flex-grow h-[400px] flex flex-col gap-2">
                            <FormLabel>JSON Params</FormLabel>
                            <MonacoFileViewer
                              fileName={
                                isCreateDialog
                                  ? "Params"
                                  : `Params for ${jobDetails?.name}`
                              }
                              fileType="json"
                              fileContent={paramsValue}
                              onChange={field.onChange}
                            />
                          </FormItem>
                        </div>
                      )}
                    />
                  </div>
                }
              >
                <div className="flex flex-col gap-2 min-w-0">
                  <FormField
                    control={form.control}
                    name="cronSetting"
                    render={({ field }) => (
                      <div>
                        <FormItem>
                          <FormLabel>Cron setting</FormLabel>
                          <FormControl>
                            <Input placeholder="0 7 * * *" {...field} />
                          </FormControl>
                          <FormDescription>
                            This is the cron settings for the job :{" "}
                            {parseCron(field.value)}.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                        <Cron
                          value={field.value ?? ""}
                          setValue={(newValue: string) => {
                            field.onChange(newValue)
                          }}
                        />
                      </div>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <div>
                        <FormItem>
                          <FormLabel>job name</FormLabel>
                          <FormControl>
                            <Input placeholder="a unique name" {...field} />
                          </FormControl>
                          <FormDescription>
                            This is the job name, it should be a unique name.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      </div>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="consumer"
                    render={({ field }) => (
                      <div>
                        <FormItem>
                          <FormLabel>Consumer script</FormLabel>
                          <br />
                          <FormControl ref={field.ref}>
                            <ComboBox
                              selectedItemValue={jobDetails?.consumer}
                              itemList={itemList}
                              {...field}
                              noFieldsFoundText={"No consumer scripts found"}
                              searchFieldPlaceholder={
                                "Search consumer scripts..."
                              }
                              inputFieldsText={"Select consumer script..."}
                              className="w-[--radix-popover-trigger-width]"
                              triggerClassName={"w-full "}
                            />
                          </FormControl>
                          <FormDescription>
                            This is the consumer script that will be run when
                            the job is triggered
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      </div>
                    )}
                  />
                </div>
              </ExpandableCard>

              <DialogFooter>
                <ButtonWithStrCut
                  keyBinding={"meta+enter"}
                  variant={"default"}
                  type="submit"
                  useInForm={true}
                >
                  {isCreateDialog ? <PlusIcon /> : <SaveIcon />}
                  {isCreateDialog ? "Add a new job" : "Save changes"}
                </ButtonWithStrCut>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
