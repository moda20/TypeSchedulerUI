import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useRef, useState } from "react"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PasswordInput } from "@/components/ui/password-input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useServers } from "@/hooks/use-servers"
import { ComboBox } from "@/components/ui/combo-box"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CrossIcon, SaveIcon, TestTube2Icon } from "lucide-react"
import { ButtonWithTooltip } from "@/components/custom/general/ButtonWithTooltip"
import { Cross2Icon } from "@radix-ui/react-icons"

export interface LoginFormProps extends React.ComponentProps<"div"> {
  onLoginSubmit: (data: any) => void
  onRegisterSubmit: (data: any) => void
}

const LoginFormSchema = z.object({
  email: z.string(),
  password: z.string(),
  host: z.string().optional(),
})

const RegisterFormSchema = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
  host: z.string().optional(),
})

export type LoginFormType = z.infer<typeof LoginFormSchema>
export type RegisterFormType = z.infer<typeof RegisterFormSchema>

const validityMessages: {
  [key: string]: { message: string; type: "success" | "error" }
} = {
  VALID_HOST: {
    message: "Accessible Host",
    type: "success",
  },
  INVALID_HOST: {
    message: "Host is not accessible",
    type: "error",
  },
  HOST_SAVED: {
    message: "Host has been saved",
    type: "success",
  },
}
export function LoginForm({
  className,
  onLoginSubmit,
  onRegisterSubmit,
  ...props
}: LoginFormProps) {
  const [currentTab, setCurrentTab] = useState("login")
  const [newHost, setNewHost] = useState("")
  const [validHost, setValidHost] = useState(undefined)
  const [ValidityMessage, setValidityMessage] = useState<
    { message: string; type: "success" | "error" } | undefined
  >(undefined)
  const ServerInputRef = useRef<HTMLInputElement>(null)
  const { targets, currentTarget, testServerConnection, updateSavedTargets } =
    useServers()
  const form = useForm<z.infer<typeof LoginFormSchema>>({
    resolver: zodResolver(LoginFormSchema),
  })
  const registerForm = useForm<z.infer<typeof RegisterFormSchema>>({
    resolver: zodResolver(RegisterFormSchema),
  })

  const ValidateHost = useCallback(
    (inputHost?: string) => {
      const targetHost = ServerInputRef.current?.value ?? inputHost ?? newHost
      if (z.url().safeParse(targetHost).success) {
        testServerConnection(targetHost)
          .then(() => {
            setValidHost(true)
            setValidityMessage(validityMessages.VALID_HOST)
          })
          .catch(() => {
            setValidHost(false)
            setValidityMessage(validityMessages.INVALID_HOST)
          })
      } else {
        setValidityMessage(undefined)
      }
    },
    [newHost],
  )

  const isASavedHost = useCallback(
    (inputHost?: string) => {
      return targets.some(e => e === inputHost)
    },
    [targets],
  )

  const resetInput = useCallback(() => {
    if (ServerInputRef.current) {
      ServerInputRef.current.value = ""
    }
    setNewHost("")
    setValidHost(undefined)
    setValidityMessage(undefined)
  }, [ServerInputRef])

  const setSavedTarget = useCallback(
    (inputTarget: string) => {
      if (ServerInputRef.current) {
        ServerInputRef.current.value = inputTarget
      }
      setValidHost(undefined)
      setValidityMessage(undefined)
    },
    [ServerInputRef],
  )

  const updateSavedTarget = useCallback((inputHost: string) => {
    updateSavedTargets(inputHost)
    setValidityMessage(validityMessages.HOST_SAVED)
    setTimeout(() => {
      setValidityMessage(undefined)
    }, 2000)
  }, [])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden text-foreground bg-background border-none rounded-none">
        <CardContent className="flex flex-col gap-4 p-0 text-foreground bg-background border-border">
          <div className="flex flex-col gap-2">
            <InputGroup className="border-border !ring-0 outline-none">
              <InputGroupInput
                defaultValue={currentTarget}
                className="!focus:ring-0 border-border !focus-visible:ring-0 outline-none"
                placeholder="Or type the host"
                ref={ServerInputRef}
                onInput={e => {
                  // @ts-ignore
                  setNewHost(e.target.value)
                  setValidityMessage(undefined)
                  setValidHost(undefined)
                }}
              />
              <InputGroupAddon>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <InputGroupButton>Saved hosts</InputGroupButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-40 bg-background text-foreground border-border"
                    align="start"
                  >
                    <DropdownMenuGroup>
                      {targets.map(target => {
                        return (
                          <DropdownMenuItem
                            onSelect={() => setSavedTarget(target)}
                          >
                            {target}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </InputGroupAddon>
              {newHost?.length > 0 && (
                <InputGroupAddon align="inline-end">
                  <ButtonWithTooltip
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex justify-center align-middle gap-0 h-6 w-8"
                    tooltipContent="clear new host"
                    onClick={resetInput}
                  >
                    <Cross2Icon className="!size-3.5" />
                  </ButtonWithTooltip>
                </InputGroupAddon>
              )}
              {(newHost?.length > 0 || currentTarget?.length > 0) && (
                <InputGroupAddon align="inline-end">
                  <ButtonWithTooltip
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex justify-center align-middle gap-0 h-6 w-8"
                    tooltipContent="Test the host connection"
                    onClick={() => ValidateHost(newHost || currentTarget)}
                  >
                    <TestTube2Icon className="!size-3.5" />
                  </ButtonWithTooltip>
                </InputGroupAddon>
              )}
              {validHost === true && newHost && !isASavedHost(newHost) && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton onClick={() => updateSavedTarget(newHost)}>
                    <SaveIcon />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
            {ValidityMessage !== undefined && (
              <div
                className={cn("flex text-xs font-bold w-full justify-end", {
                  "text-success": ValidityMessage.type === "success",
                  "text-destructive": ValidityMessage.type === "error",
                })}
              >
                {ValidityMessage.message}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between transition-all duration-200">
            <Tabs
              defaultValue={currentTab}
              className="w-full flex flex-col gap-4 "
              onValueChange={setCurrentTab}
            >
              <TabsList className="w-full gap-2 h-full">
                <TabsTrigger
                  className="border border-border w-full data-[state=active]:bg-sidebar"
                  value="login"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  className="border border-border w-full data-[state=active]:bg-sidebar"
                  value="register"
                >
                  Sign up
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="login"
                className="data-[state=active]:animate-in data-[state=active]:fade-in-0 !duration-500"
              >
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(
                      v => {
                        v.host = ServerInputRef.current!.value
                        onLoginSubmit(v)
                      },
                      err => {
                        console.log(err)
                      },
                    )}
                  >
                    <div className="flex flex-col gap-6 h-full">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <div>
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="your email" {...field} />
                              </FormControl>
                              <FormDescription>
                                Input your login email.
                              </FormDescription>
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
                                  placeholder="password"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Input your login password.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          </div>
                        )}
                      />
                      <Button type="submit" className="w-full mt-auto">
                        Login
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent
                value="register"
                className="data-[state=active]:animate-in data-[state=active]:fade-in-0 !duration-500"
              >
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(
                      v => {
                        v.host = ServerInputRef.current!.value
                        onRegisterSubmit(v)
                      },
                      err => {
                        console.log(err)
                      },
                    )}
                  >
                    <div className="flex flex-col gap-6">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <div>
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Username" {...field} />
                              </FormControl>
                              <FormDescription>
                                Username to show up on the dashboard
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          </div>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <div>
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="Email" {...field} />
                              </FormControl>
                              <FormDescription>
                                Your login email.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          </div>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <div>
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <PasswordInput
                                  placeholder="Password"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>Your password.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          </div>
                        )}
                      />
                      <Button type="submit" className="w-full">
                        Register
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
