import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

import useDialogueManager from "@/hooks/useDialogManager"
import { LoginForm } from "@/components/login-form"
import authService from "@/services/authService"
import { useCallback, useEffect, useState } from "react"
import {
  ConnectionStatus,
  connectionStatus,
  setUser,
} from "@/app/reducers/authReducer"
import type {
  LoginFormData,
  RegisterFormData,
  SavedUserData,
} from "@/models/auth"
import { verifyUserConnection } from "@/utils/authUtils"
import { useServers } from "@/hooks/use-servers"
import { useMutation } from "@tanstack/react-query"
import systemService from "@/services/SystemService"
import { toast } from "@/hooks/use-toast"
import Spinner from "@/components/custom/LoadingOverlay"

export interface AuthenticationProps extends React.ComponentProps<"div"> {}

export default function Authentication({
  children,
  ...props
}: AuthenticationProps) {
  const dispatch = useAppDispatch()
  const { isDialogOpen, setDialogState } = useDialogueManager()
  const { setNewTargetServer } = useServers()
  const targetConnectionStatus = useAppSelector(connectionStatus)

  const isConnected = targetConnectionStatus === ConnectionStatus.CONNECTED
  const connectionInProgress =
    targetConnectionStatus === ConnectionStatus.INPROGRESS

  useEffect(() => {
    if (isConnected) {
      setDialogState(false)
    } else {
      if (!connectionInProgress) {
        setDialogState(true)
      }
    }
  }, [isConnected, targetConnectionStatus])

  const loginAction = useCallback(
    async (data: LoginFormData) => {
      return await authService
        .login(data)
        .then((resData: { data: SavedUserData }) => {
          dispatch(setUser(resData.data))
          setNewTargetServer(data.host)
          return resData.data
        })
    },
    [dispatch],
  )

  const registerAction = useCallback(
    async (data: RegisterFormData) => {
      return await authService
        .register(data)
        .then((resData: { data: SavedUserData }) => {
          dispatch(setUser(resData.data))
          setNewTargetServer(data.host)
          return resData.data
        })
    },
    [dispatch],
  )

  const loginMutation = useMutation({
    mutationFn: loginAction,
    onSuccess: async (data, variables) => {
      toast({
        title: `Logged in as ${data.username}`,
        duration: 2000,
      })
    },
    onError: (error, variables) => {
      toast({
        title: `Error logging in to ${variables.host}`,
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const registerMutation = useMutation({
    mutationFn: registerAction,
    onSuccess: async (data, variables) => {
      toast({
        title: `Logged in as ${data.username}`,
        duration: 2000,
      })
    },
    onError: (error, variables) => {
      toast({
        title: `Error registering with to ${variables.host}`,
        description: error.message,
        variant: "destructive",
      })
    },
  })

  return (
    <Dialog open={isDialogOpen} onOpenChange={() => {}}>
      <DialogTrigger
        className=""
        onClick={v => {
          v.preventDefault()
          setDialogState(true)
        }}
        asChild
      >
        {children}
      </DialogTrigger>
      <DialogContent
        hideCloseButton={true}
        className="sm:max-w-[300px] md:max-w-[40%] lg:max-w-[450px] xxl:max-w-[450px] text-foreground bg-background border-border"
      >
        <Spinner
          className="w-full"
          isLoading={loginMutation.isPending || registerMutation.isPending}
        >
          <LoginForm
            className="w-full"
            onLoginSubmit={v => loginMutation.mutate(v)}
            onRegisterSubmit={v => registerMutation.mutate(v)}
          />
        </Spinner>
      </DialogContent>
    </Dialog>
  )
}
