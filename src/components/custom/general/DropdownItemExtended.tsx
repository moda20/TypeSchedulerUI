import * as React from "react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useHotkeys } from "react-hotkeys-hook"
import { useImperativeHandle, useRef } from "react"

const DropdownMenuItemExtended = React.forwardRef<
  React.ElementRef<typeof DropdownMenuItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuItem> & {
    inset?: boolean
  } & {
    keyBinding?: string
    onAction?: (arg0: KeyboardEvent) => void
  }
>(({ className, inset, keyBinding, onAction, ...props }, ref) => {
  const newRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(ref, () => newRef.current as HTMLInputElement)
  useHotkeys(
    keyBinding ?? "",
    ev => {
      if (props.disabled) {
        return
      }
      if (onAction) {
        onAction(ev)
      }
      if (newRef.current) {
        newRef.current.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      }
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  )
  return <DropdownMenuItem ref={newRef} {...props} />
})
DropdownMenuItemExtended.displayName = DropdownMenuItem.displayName

export default DropdownMenuItemExtended
