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
  ProxyStrategyOptionEnum,
  ProxyStrategyOptions,
} from "@/models/proxies"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ConfirmationDialogAction from "@/components/confirmationDialogAction"
import { MinusIcon } from "@radix-ui/react-icons"
import type { jobsTableData } from "@/features/jobsTable/interfaces"
import { useProxies } from "@/hooks/useProxies"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ButtonWithStrCut from "@/components/custom/general/ButtonWithStrCut"
import ManagedSelect from "@/components/custom/ManagedSelect"
import { Separator } from "@/components/ui/separator"

import {
  InputBase,
  InputBaseAdornment,
  InputBaseControl,
  InputBaseInput,
} from "@/components/ui/input-base"

export interface ProxyLinkDialogProps {
  children: React.ReactNode
  jobDetails?: jobsTableData
  onChange?: (value: JobProxyLinkUpdateType) => void
  onProxyStrategyChange?: (value: string, proxyId?: string) => void
  triggerClassName?: string
}

export function JobProxyLinkDialog({
  children,
  jobDetails,
  onChange,
  onProxyStrategyChange,
  triggerClassName,
}: ProxyLinkDialogProps) {
  const { isDialogOpen, setDialogState } = useDialogueManager()
  const strategySelectRef = useRef<HTMLButtonElement>(null)
  const proxyConfig = useMemo(() => {
    const jobParams = JSON.parse(jobDetails?.param ?? "{}")
    return jobParams["proxyConfig"]
  }, [jobDetails])

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
      strategy: proxyConfig?.proxyStrategy,
      proxyId: proxyConfig?.targetProxyId,
    },
  })

  const handlePickingStrategy = useCallback(
    (newStrategy: ProxyStrategyOptionEnum) => {
      form.setValue("strategy", newStrategy)
      if (newStrategy !== ProxyStrategyOptionEnum.SPECIFIC) {
        form.setValue("proxyId", "")
      }
      strategySelectRef.current?.blur()
    },
    [],
  )
  const handleSubmit = useCallback(
    async (inputValue: JobProxyLinkUpdateType) => {
      onChange?.(inputValue)
      return proxyActions(
        ProxyActions.LINK_TO_JOBS,
        undefined,
        undefined,
        inputValue,
      )
        .then(() => {
          if (
            inputValue.strategy !== proxyConfig?.proxyStrategy ||
            (inputValue.strategy === ProxyStrategyOptionEnum.SPECIFIC &&
              inputValue.proxyId !== proxyConfig?.targetProxyId)
          ) {
            return onProxyStrategyChange?.(
              inputValue.strategy,
              inputValue.proxyId,
            )
          } else {
            return Promise.resolve()
          }
        })
        .then(() => {
          setDialogState(false)
        })
    },
    [onChange, isDialogOpen, proxyConfig],
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
        <DialogTitle>Update proxy Links</DialogTitle>
        <DialogHeader>
          <DialogDescription>
            Proxies linked to {jobDetails?.name}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              (v, event) => {
                event.preventDefault()
                handleSubmit(v)
              },
              err => {
                console.log(err)
              },
            )}
            className="space-y-8"
          >
            <div className="space-y-4">
              <div className="flex justify-between gap-2 items-center">
                <div className="flex flex-col gap-1 w-8/12">
                  <h4 className="text-lg font-bold">Pick strategy</h4>
                  <p className="text-muted-foreground italic text-sm">
                    Strategy for default proxy choice.
                  </p>
                </div>
                <div className="flex flex-col gap-1 justify-start">
                  <FormField
                    control={form.control}
                    name="strategy"
                    render={({ field }) => (
                      <div>
                        <ManagedSelect
                          ref={strategySelectRef}
                          exportOnlyValue={true}
                          onChange={handlePickingStrategy}
                          inputOptions={ProxyStrategyOptions}
                          defaultValue={field.value}
                        />
                      </div>
                    )}
                  />

                  {form.watch("strategy") ===
                    ProxyStrategyOptionEnum.SPECIFIC && (
                    <FormField
                      control={form.control}
                      name="proxyId"
                      render={({ field }) => (
                        <InputBase>
                          <InputBaseAdornment>id</InputBaseAdornment>
                          <InputBaseControl>
                            <InputBaseInput
                              value={field.value}
                              onChange={e => field.onChange(e.target.value)}
                            />
                          </InputBaseControl>
                        </InputBase>
                      )}
                    />
                  )}
                </div>
              </div>
              <Separator orientation="horizontal" className="my-2 h-1" />
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
                disabled={form.formState.isSubmitting}
                keyBinding={"meta+enter"}
                useInForm={true}
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
