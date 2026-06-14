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
import { LinkIcon } from "lucide-react"
import { ComboBox } from "@/components/ui/combo-box"
import { cn } from "@/lib/utils"
import useDialogueManager from "@/hooks/useDialogManager"
import {
  JobProxyLinkUpdateSchema,
  JobProxyLinkUpdateType,
  ProxyActions,
} from "@/models/proxies"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ConfirmationDialogAction from "@/components/confirmationDialogAction"
import { MinusIcon } from "@radix-ui/react-icons"
import type { jobsTableData } from "@/features/jobsTable/interfaces"
import { useProxies } from "@/hooks/useProxies"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect } from "react"
import ButtonWithStrCut from "@/components/custom/general/ButtonWithStrCut"

export interface ProxyLinkDialogProps {
  children: React.ReactNode
  jobDetails?: jobsTableData
  onChange?: (value: JobProxyLinkUpdateType) => void
  triggerClassName?: string
}

export function JobProxyLinkDialog({
  children,
  jobDetails,
  onChange,
  triggerClassName,
}: ProxyLinkDialogProps) {
  const { isDialogOpen, setDialogState } = useDialogueManager()

  const { proxyItems, jobProxies, proxyActions } = useProxies()
  const { data: jobProxyList, isLoading } = useQuery({
    queryKey: ["proxies", jobDetails?.id],
    queryFn: () => jobProxies(Number(jobDetails?.id)),
    placeholderData: [],
    select: data => {
      form.setValue(
        "proxies",
        data.map(e => String(e.proxy_id)),
      )
      return data
    },
  })
  const form = useForm<z.infer<typeof JobProxyLinkUpdateSchema>>({
    resolver: zodResolver(JobProxyLinkUpdateSchema),
    defaultValues: {
      id: jobDetails?.id ?? "",
      proxies: jobProxyList?.map(e => String(e.proxy_id)) ?? [],
    },
  })
  const handleSubmit = useCallback(
    async (inputValue: JobProxyLinkUpdateType) => {
      proxyActions(ProxyActions.LINK_TO_JOBS, undefined, undefined, inputValue)
      onChange?.(inputValue)
      setDialogState(false)
    },
    [onChange, isDialogOpen],
  )

  return (
    <Dialog open={isDialogOpen} onOpenChange={v => setDialogState(v)}>
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
        className="sm:max-w-[425px] text-foreground bg-background"
        onEscapeKeyDown={e => {
          e.preventDefault()
          setDialogState(false)
        }}
      >
        <DialogHeader>
          <DialogTitle>Update proxy Links</DialogTitle>
          <DialogDescription>
            Proxies linked to {jobDetails?.name}
          </DialogDescription>
        </DialogHeader>
        {isDialogOpen?.toString()}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              v => {
                handleSubmit(v)
              },
              err => {
                console.log(err)
              },
            )}
            className="space-y-8"
          >
            <div>
              <Card className="border-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2 text-foreground bg-background border-transparent rounded-t-xl">
                  <CardTitle className="text-lg font-bold">
                    Proxy links
                  </CardTitle>
                  <ConfirmationDialogAction
                    title={"Unlink All proxies"}
                    description={"Unlink all proxies from this job"}
                    takeAction={() =>
                      form.setValue("proxies", [], {
                        shouldTouch: true,
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    confirmText={"Unlink all jobs"}
                  >
                    <Button
                      variant={"destructive"}
                      size="sm"
                      className="btn-rounded"
                    >
                      <MinusIcon />
                      Unlink all
                    </Button>
                  </ConfirmationDialogAction>
                </CardHeader>
                <CardContent className="p-0 pt-0 flex flex-col gap-2">
                  <FormField
                    control={form.control}
                    name="proxies"
                    render={({ field }) => (
                      <div>
                        <FormItem>
                          <FormLabel>
                            Select the Proxies to link to this job
                          </FormLabel>
                          <br />
                          <FormControl ref={field.ref}>
                            <ComboBox
                              selectedItemValue={field.value}
                              itemList={proxyItems}
                              {...field}
                              noFieldsFoundText={"No Proxies found"}
                              searchFieldPlaceholder={"Search saved proxies..."}
                              inputFieldsText={
                                "Select proxy to link with this job ..."
                              }
                              className="w-[--radix-popover-trigger-width]"
                              triggerClassName={"w-full"}
                              multiSelect={true}
                              managed={true}
                              maxSelectedItemsToShowOnMainTrigger={3}
                            />
                          </FormControl>
                          <FormDescription>
                            The selected proxy will be part of the job's linked
                            proxies. The proxies are going to be injected to the
                            job based on a strategy
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      </div>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
            <DialogFooter>
              <ButtonWithStrCut
                keyBinding={"meta+enter"}
                variant={"default"}
                type="submit"
              >
                <LinkIcon />
                Update proxy links
              </ButtonWithStrCut>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
