import { Options, useHotkeys } from "react-hotkeys-hook"
import type { ButtonProps } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import * as React from "react"
import { useImperativeHandle, useRef } from "react"
import { formatForDisplay } from "@tanstack/react-hotkeys"

export interface ButtonWithStrCutProps extends ButtonProps {
  keyBinding?: string | string[]
  onAction?: (arg0: KeyboardEvent) => void
  useInForm?: Options["enableOnFormTags"]
  hideKeyboardShortcut?: boolean
}

const ButtonWithStrCut = React.forwardRef<
  HTMLButtonElement,
  ButtonWithStrCutProps
>(
  (
    {
      keyBinding,
      onAction,
      useInForm,
      children,
      hideKeyboardShortcut,
      ...props
    }: ButtonWithStrCutProps,
    ref,
  ) => {
    const newRef = useRef<HTMLButtonElement>(null)
    useImperativeHandle(ref, () => newRef.current as HTMLButtonElement)
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
          newRef.current.dispatchEvent(
            new MouseEvent("click", { bubbles: true }),
          )
        }
      },
      {
        enableOnFormTags: useInForm,
      },
    )
    const keyBindingLabel = Array.isArray(keyBinding)
      ? keyBinding[0]
      : keyBinding
    return (
      <Button ref={newRef} {...props}>
        {children}
        {!hideKeyboardShortcut && (
          <>
            {" "}
            <span className="font-mono text-[12px]">
              {keyBindingLabel
                ? "(" +
                  formatForDisplay(keyBindingLabel, { separatorToken: "" }) +
                  ")"
                : ""}
            </span>
          </>
        )}
      </Button>
    )
  },
)

export default ButtonWithStrCut
