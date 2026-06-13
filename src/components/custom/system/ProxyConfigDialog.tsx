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
import { PlusIcon, SaveIcon } from "lucide-react"
import type { ComboBoxItem } from "@/components/ui/combo-box"
import { ComboBox } from "@/components/ui/combo-box"
import { cn, parseCron } from "@/lib/utils"
import useDialogueManager from "@/hooks/useDialogManager"
import { useHotkeys } from "react-hotkeys-hook"
import type { ProxyTableData } from "@/models/proxies"
import { proxyProtocolOptions, ProxyStatus } from "@/models/proxies"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PasswordInput } from "@/components/ui/password-input"
import ManagedSelect from "@/components/custom/ManagedSelect"
import ButtonWithStrCut from "@/components/custom/general/ButtonWithStrCut"

export interface ProxyConffigDialogProps {
  children: React.ReactNode
  isCreateDialog?: boolean
  proxyDetails?: ProxyTableData
  JobsList?: ComboBoxItem[] | (() => Promise<ComboBoxItem[]>)
  onChange: (value: z.infer<typeof ProxyUpdateSchema>) => void
  triggerClassName?: string
}

const ProxyUpdateSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  proxy_ip: z.string(),
  proxy_port: z.coerce.number().positive().max(65535),
  description: z.string().optional(),
  status: z.union([z.nativeEnum(ProxyStatus), z.number()]).optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  protocol: z.string().optional(),
  jobs: z.array(z.number()).optional(),
})

export type ProxyConfigUpdateType = z.infer<typeof ProxyUpdateSchema>

export function ProxyConfigDialog({
  children,
  isCreateDialog,
  proxyDetails,
  onChange,
  triggerClassName,
}: ProxyConffigDialogProps) {
  const form = useForm<z.infer<typeof ProxyUpdateSchema>>({
    resolver: zodResolver(ProxyUpdateSchema),
    defaultValues: {
      proxy_ip: proxyDetails?.proxy_ip ?? "",
      proxy_port: proxyDetails?.proxy_port,
      description: proxyDetails?.description ?? "",
      status: proxyDetails?.status,
      username: proxyDetails?.username,
      password: proxyDetails?.password,
      protocol: proxyDetails?.protocol ?? proxyProtocolOptions[0]?.value,
    },
  })
  const { isDialogOpen, setDialogState } = useDialogueManager()

  useHotkeys(["ctrl+alt+n", "meta+alt+n"], () => {
    setDialogState(true)
  })

  return (
    <Dialog open={isDialogOpen} onOpenChange={v => setDialogState(v)}>
      <DialogTrigger
        asChild
        className={cn(triggerClassName)}
        onClick={v => {
          v.preventDefault()
          setDialogState(true)
        }}
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
          <DialogTitle>
            {isCreateDialog ? "Add" : "Edit"} Proxy settings
          </DialogTitle>
          <DialogDescription>
            {isCreateDialog
              ? "Add a new Proxy settings"
              : `Edit the ${proxyDetails?.proxy_ip}:${proxyDetails?.proxy_port} proxy`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              v => {
                onChange(v)
                if (isCreateDialog) {
                  setDialogState(false)
                }
              },
              err => {
                console.log(err)
              },
            )}
            className="space-y-8"
          >
            <div className="ip_port flex gap-2">
              <FormField
                control={form.control}
                name="proxy_ip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP*</FormLabel>
                    <FormControl>
                      <Input placeholder="127.0.0.0" {...field} />
                    </FormControl>
                    <FormDescription>The Proxy IP</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="proxy_port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port*</FormLabel>
                    <FormControl>
                      <Input placeholder="8080" {...field} />
                    </FormControl>
                    <FormDescription>The Proxy Port</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <div className="w-3/5">
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="a proxy description" {...field} />
                      </FormControl>
                      <FormDescription>
                        A meaningful description to the proxy settings
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  </div>
                )}
              />
              <FormField
                render={({ field }) => (
                  <FormItem className="w-2/5">
                    <FormLabel>Protocol</FormLabel>
                    <ManagedSelect
                      onChange={field.onChange}
                      inputOptions={proxyProtocolOptions}
                      defaultValue={field.value}
                      exportOnlyValue={true}
                    />
                    <FormMessage />
                  </FormItem>
                )}
                name={"protocol"}
                control={form.control}
              />
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border-transparent p-4 py-2 shadow">
                  <FormControl>
                    <Checkbox
                      checked={field.value === ProxyStatus.ACTIVE.toString()}
                      onCheckedChange={v => {
                        field.onChange(
                          v ? ProxyStatus.ACTIVE : ProxyStatus.INACTIVE,
                        )
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Enable the proxy instantly after creation ?
                    </FormLabel>
                    <FormDescription>
                      You can enable this later on if you want to
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <div className={"bg-foreground h-[0.5px]"}></div>
            <div>
              <Card className="border-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2 text-foreground bg-background border-transparent rounded-t-xl">
                  <CardTitle className="text-lg font-bold">
                    Authentication
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-0 flex flex-col gap-2">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <div>
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Proxy username"
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription></FormDescription>
                          <FormMessage />
                        </FormItem>
                      </div>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <div>
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <PasswordInput
                              placeholder="Proxy username"
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription></FormDescription>
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
                keyBinding="meta+enter"
                variant={"default"}
                type="submit"
                useInForm={true}
              >
                {isCreateDialog ? <PlusIcon /> : <SaveIcon />}
                {isCreateDialog ? "Add a new Proxy" : "Save changes"}
              </ButtonWithStrCut>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
