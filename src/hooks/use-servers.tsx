import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { config, setConfigItem } from "@/app/reducers/uiReducer"
import { verifyUserConnection } from "@/utils/authUtils"
import { toast } from "@/hooks/use-toast"
import axios from "axios"

export function useServers() {
  const dispatch = useAppDispatch()
  const savedConfig = useAppSelector(config)

  const updateSavedTargets = (newTarget?: string) => {
    const updatedTargets = Object.assign([], savedConfig.savedTargets)
    if (newTarget && !updatedTargets.includes(newTarget)) {
      updatedTargets.push(newTarget)
    }
    dispatch(setConfigItem({ name: "savedTargets", value: updatedTargets }))
  }
  const setNewTargetServer = (newTarget?: string, setOnly?: boolean) => {
    dispatch(setConfigItem({ name: "targetServer", value: newTarget }))
    if (setOnly) {
      return
    }
    verifyUserConnection()
    toast({
      title: `Target server updated`,
    })
  }

  const testServerConnection = (inputServer?: string) => {
    const testingInstance = axios.create({
      baseURL: inputServer ?? savedConfig.targetServer,
      timeout: 60000,
      responseType: "json",
    })

    return testingInstance.get("/status/version")
  }

  return {
    targets: savedConfig.savedTargets,
    currentTarget: savedConfig.targetServer,
    updateSavedTargets,
    setNewTargetServer,
    testServerConnection,
  }
}
