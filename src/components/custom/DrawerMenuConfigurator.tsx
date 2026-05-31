import { Button } from "@/components/ui/button"
import { CogIcon, DeleteIcon, SaveIcon, Trash2Icon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PlayIcon } from "@radix-ui/react-icons"
import SheetActionDialog from "@/components/sheet-action-dialog"
import { config, setConfigItem } from "@/app/reducers/uiReducer"
import { toast } from "@/hooks/use-toast"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { useCallback, useEffect, useRef, useState } from "react"
import ConfirmationDialogAction, {
  ConfirmationDialogActionType,
} from "@/components/confirmationDialogAction"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { jobActions } from "@/features/jobsTable/interfaces"
import { useHotkeys } from "react-hotkeys-hook"
import HotKeyButton from "@/components/custom/HotKeyButton"
import { verifyUserConnection } from "@/utils/authUtils"
import ButtonWithStrCut from "@/components/custom/general/ButtonWithStrCut"
import { ButtonGroup } from "@/components/ui/button-group"
import { ButtonWithTooltip } from "@/components/custom/general/ButtonWithTooltip"

export default function DrawerMenuConfigurator() {
  useHotkeys(
    ["ctrl+l", "meta+l"],
    () => {
      if (sideBarTriggerRef?.current) {
        sideBarTriggerRef.current.click()
      }
    },
    {
      preventDefault: true,
    },
  )

  const dispatch = useAppDispatch()
  const savedConfig = useAppSelector(config)
  const initialSideBarRef: any = null
  const sideBarTriggerRef = useRef(initialSideBarRef)
  const [targetServer, setTargetServer] = useState<string | undefined>(
    savedConfig.targetServer,
  )

  const updateSavedTargets = (newTarget?: string) => {
    const updatedTargets = Object.assign([], savedConfig.savedTargets)
    if (newTarget && !updatedTargets.includes(newTarget)) {
      updatedTargets.push(newTarget)
    }
    dispatch(setConfigItem({ name: "savedTargets", value: updatedTargets }))
  }

  const removeSavedTarget = (target: string) => {
    const updatedTargets = Object.assign([], savedConfig.savedTargets)
    updatedTargets.splice(updatedTargets.indexOf(target), 1)
    dispatch(setConfigItem({ name: "savedTargets", value: updatedTargets }))
    toast({
      title: `Target server deleted`,
    })
  }

  const setNewTargetServer = (newTarget?: string) => {
    dispatch(setConfigItem({ name: "targetServer", value: newTarget }))
    verifyUserConnection()
    toast({
      title: `Target server updated`,
    })
    sideBarTriggerRef.current.click()
  }
  const hotKLeySaveTargetRef = useHotkeys<HTMLInputElement>(
    ["meta+enter"],
    () => {
      return updateSavedTargets(targetServer)
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  )

  const handleTargetServerRemoval = useCallback(
    (action: ConfirmationDialogActionType, target) => {
      if (action === ConfirmationDialogActionType.CANCEL) {
        return
      }

      return removeSavedTarget(target)
    },
    [savedConfig],
  )

  return (
    <SheetActionDialog
      side={"right"}
      title={"Configuration"}
      description={"Update server configuration"}
      trigger={
        <Button
          variant={"outline"}
          size={"icon"}
          ref={sideBarTriggerRef}
          className={"border-border"}
        >
          <CogIcon />
        </Button>
      }
    >
      <div className="mt-4">
        <Label htmlFor="target" className="text-left font-bold text-lg">
          Backend Server Endpoint
        </Label>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2 justify-between">
            <Label htmlFor="target" className="text-left">
              Current
            </Label>
            <Input
              ref={hotKLeySaveTargetRef}
              name={"target"}
              placeholder="..."
              className="w-6/12"
              value={targetServer}
              onChange={e => setTargetServer(e.target.value)}
            />
            <div className="flex items-center gap-4">
              <Button
                variant={"default"}
                size={"icon"}
                onClick={() => updateSavedTargets(targetServer)}
                className="col-span-1"
              >
                <SaveIcon />
              </Button>
              <Button
                variant={"default"}
                size={"icon"}
                className="col-span-1"
                onClick={() => setNewTargetServer(targetServer)}
              >
                <PlayIcon />
              </Button>
            </div>
          </div>
        </div>
        <div className="grid gap-2 py-2">
          {savedConfig.savedTargets &&
            savedConfig.savedTargets.map((e, i) => (
              <div
                className="flex items-center gap-4 justify-between w-full min-w-0 flex-1 overflow-hidden"
                key={e + i}
              >
                <div
                  className={
                    "flex items-center gap-4 w-full flex-shrink flex-grow-0 min-w-0"
                  }
                >
                  <Label htmlFor="target" className="text-left">
                    Target
                  </Label>
                  <Label
                    htmlFor="target"
                    className="text-left overflow-ellipsis overflow-hidden flex-1 min-w-0"
                    title={e}
                  >
                    {e}
                  </Label>
                </div>
                <div className="flex items-center gap-4">
                  <ConfirmationDialogAction
                    onOpenChange={e => {
                      if (!e) document.body.style.pointerEvents = ""
                    }}
                    title={`Delete Target server : ${e}`}
                    description={
                      "This action will delete the target server from your local browser storage"
                    }
                    extraTakeActionArgs={[e]}
                    takeAction={handleTargetServerRemoval}
                    confirmVariant="destructive"
                    autoFocus={true}
                  >
                    <Button variant={"destructive"} size={"icon"}>
                      <DeleteIcon />
                    </Button>
                  </ConfirmationDialogAction>
                  <ButtonWithTooltip
                    tooltipContent={`(⌘⌥${i + 1})`}
                    keyBinding={["ctrl+alt+" + (i + 1), "meta+alt+" + (i + 1)]}
                    variant={"default"}
                    size={"icon"}
                    onClick={() => setNewTargetServer(e)}
                  >
                    <PlayIcon />
                  </ButtonWithTooltip>
                </div>
              </div>
            ))}
        </div>
      </div>
    </SheetActionDialog>
  )
}
