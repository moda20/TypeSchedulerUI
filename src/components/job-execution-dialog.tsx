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
import { Label } from "@/components/ui/label"
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
import { CogIcon, PlusIcon, SaveIcon } from "lucide-react"
import type { ComboBoxItem } from "@/components/ui/combo-box"
import { ComboBox } from "@/components/ui/combo-box"
import { cn, parseCron } from "@/lib/utils"
import useDialogueManager from "@/hooks/useDialogManager"
import { useCallback, useMemo } from "react"
import MonacoFileViewer from "@/components/custom/MonacoFileViewer"
import ButtonWithStrCut from "@/components/custom/general/ButtonWithStrCut"

export interface JobExecutionDialogProps {
  children: React.ReactNode
  jobDetails?: jobsTableData
  onChange: (value: z.infer<typeof jobExecutionSchema>) => void
  triggerClassName?: string
}
export type JobExecutionType = z.infer<typeof jobExecutionSchema>

const jobExecutionSchema = z.object({
  param: z.string().nullish(),
})

export function JobExecutionDialog({
  children,
  jobDetails,
  onChange,
  triggerClassName,
}: JobExecutionDialogProps) {
  const form = useForm<z.infer<typeof jobExecutionSchema>>({
    resolver: zodResolver(jobExecutionSchema),
    defaultValues: {
      param: jobDetails?.param,
    },
  })
  const { isDialogOpen, setDialogState } = useDialogueManager()

  const stopPropagation = useCallback((e: any) => {
    if (e.key === "Enter") {
      e.stopPropagation()
    }
  }, [])

  const resetState = useCallback(
    (finalState: boolean) => {
      if (!finalState) {
        form.reset()
      }
    },
    [form],
  )

  const paramsValue = useMemo(() => {
    return JSON.parse(jobDetails?.param ?? "{}")
  }, [jobDetails?.param])

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
        className={cn("sm:max-w-[425px] text-foreground bg-background")}
        onEscapeKeyDown={e => {
          e.preventDefault()
          setDialogState(false, resetState)
        }}
      >
        <DialogHeader>
          <DialogTitle>Execute {jobDetails?.name}</DialogTitle>
          <DialogDescription>
            Execute a job with custom, unsaved input parameters
          </DialogDescription>
        </DialogHeader>
        <div className="flex transition-all duration-200 w-full">
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
              <FormField
                control={form.control}
                name="param"
                render={({ field }) => (
                  <FormItem
                    className="h-[400px] flex flex-col gap-2 w-full"
                    onKeyDownCapture={stopPropagation}
                  >
                    <FormLabel>JSON Params</FormLabel>
                    {isDialogOpen && (
                      <MonacoFileViewer
                        fileName={`Params for ${jobDetails?.name}`}
                        fileType="json"
                        fileContent={paramsValue}
                        onChange={field.onChange}
                      />
                    )}
                  </FormItem>
                )}
              />

              <DialogFooter>
                <ButtonWithStrCut
                  keyBinding="meta+enter"
                  variant={"default"}
                  type="submit"
                >
                  <CogIcon />
                  Execute
                  {jobDetails!.name?.length > 40
                    ? `${jobDetails?.name?.slice(0, 40)}...`
                    : jobDetails?.name}{" "}
                </ButtonWithStrCut>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
