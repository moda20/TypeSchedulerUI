import { Row } from "@tanstack/react-table"
import { ProxyActions, ProxyTableData } from "@/models/proxies"
import { ProxyTableInterfaceProps } from "@/features/network/interfaces"
import useDialogueManager from "@/hooks/useDialogManager"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Edit2Icon,
  EllipsisVertical,
  LinkIcon,
  Settings,
  Zap,
} from "lucide-react"
import ConfirmationDialogAction, {
  ConfirmationDialogActionType,
} from "@/components/confirmationDialogAction"
import { ProxyConfigDialog } from "@/components/custom/system/ProxyConfigDialog"
import { ProxyLinkDialog } from "@/components/custom/system/ProxyLinkDialog"

export interface proxyListActionDropdownProps {
  row: Row<ProxyTableData>
  columnsProps: ProxyTableInterfaceProps
}
export default function ProxyListActionDropdown({
  row,
  columnsProps,
}: proxyListActionDropdownProps) {
  const { isDialogOpen, setDialogState } = useDialogueManager({
    inputGroup: "proxyActions",
  })

  const hasJobsLinked = (row.original?.jobs?.length ?? 0) > 0
  return (
    <DropdownMenu
      modal={false}
      open={isDialogOpen}
      onOpenChange={v => setDialogState(v)}
    >
      <DropdownMenuTrigger asChild onKeyDown={v => v.preventDefault()}>
        <Button
          variant="ghost"
          size={"icon"}
          onKeyDown={v => {
            if (v.key === "Escape") {
              v.preventDefault()
              setDialogState(false)
            }
          }}
        >
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 bg-background"
        onEscapeKeyDown={e => {
          e.preventDefault()
          //e.stopPropagation()
          //e.stopImmediatePropagation()
          setDialogState(false, () => e.stopPropagation())
        }}
      >
        <DropdownMenuLabel>
          {row.original?.proxy_ip}:{row.original?.proxy_port}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <ProxyConfigDialog
            isCreateDialog={false}
            onChange={jobData => {
              columnsProps.proxyAction(ProxyActions.UPDATE, row, jobData)
            }}
            proxyDetails={row.original}
            triggerClassName="w-full"
          >
            <DropdownMenuItem onSelect={e => e.preventDefault()}>
              <Edit2Icon />
              <span>Update config</span>
            </DropdownMenuItem>
          </ProxyConfigDialog>
          <DropdownMenuItem
            onSelect={() =>
              columnsProps.proxyAction(ProxyActions.TEST, row, undefined)
            }
          >
            <Zap />
            <span>Test</span>
          </DropdownMenuItem>
          <ProxyLinkDialog
            proxyDetails={row.original}
            JobsList={columnsProps.getAllJobs}
            onChange={proxyData =>
              columnsProps.proxyAction(ProxyActions.LINK, row, proxyData)
            }
            triggerClassName="w-full"
          >
            <DropdownMenuItem onSelect={e => e.preventDefault()}>
              <LinkIcon />
              <span>Job links</span>
            </DropdownMenuItem>
          </ProxyLinkDialog>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <ConfirmationDialogAction
          title={`Delete the proxy ${hasJobsLinked ? "(in use)" : ""}`}
          description={
            hasJobsLinked ? (
              <div>
                You can't delete this proxy because{" "}
                <span className="font-bold">IT IS BEING USED</span>, unlink the
                proxy and try again
              </div>
            ) : (
              "This action will delete the proxy from the database and unlink it to all jobs"
            )
          }
          takeAction={action => {
            if (action === ConfirmationDialogActionType.CANCEL) return
            columnsProps.proxyAction(ProxyActions.DELETE, row)
          }}
          confirmText={"Delete"}
          confirmVariant="destructive"
          disableConfirm={hasJobsLinked}
        >
          <DropdownMenuItem
            className={"bg-destructive"}
            onSelect={e => e.preventDefault()}
          >
            <Settings />
            <span>Delete proxy</span>
          </DropdownMenuItem>
        </ConfirmationDialogAction>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
