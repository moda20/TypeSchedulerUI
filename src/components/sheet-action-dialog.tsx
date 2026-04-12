import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { isValidElement, ReactNode } from "react"
import { useEffect, useRef } from "react"
import type React from "react"
import { cn } from "@/lib/utils"
import useDialogueManager from "@/hooks/useDialogManager"
import { isReactFragment } from "@/utils/generalUtils"

export interface SheetActionDialogProps
  extends React.ComponentProps<typeof Sheet> {
  side: "left" | "right"
  title: string | ReactNode
  description?: string | ReactNode
  trigger?: ReactNode
  children?: ReactNode
  contentClassName?: string
  innerContainerClassName?: string
  onOpenChange?: (open: boolean) => void
  modal?: boolean
}

const defaultSheetActionDialogProps: SheetActionDialogProps = {
  side: "right",
  title: "",
  onOpenChange: () => {},
  modal: false,
}

export default function SheetActionDialog(
  props: SheetActionDialogProps = defaultSheetActionDialogProps,
) {
  const ref = useRef<HTMLDivElement>(null)
  const { isDialogOpen, setDialogState } = useDialogueManager()

  useEffect(() => {
    setTimeout(() => {
      ref.current?.focus()
    }, 100)
  }, [])
  const isTitleElement =
    isValidElement(props.title) &&
    !isReactFragment(props.title) &&
    typeof props.title !== "string"
  const isDescriptionElement =
    isValidElement(props.description) &&
    !isReactFragment(props.description) &&
    typeof props.description !== "string"
  return (
    <Sheet
      key={props.side}
      open={isDialogOpen}
      onOpenChange={v => setDialogState(v, props.onOpenChange)}
      modal={props.modal}
    >
      <SheetTrigger
        asChild
        onClick={() => setDialogState(true, props.onOpenChange)}
      >
        {props.trigger}
      </SheetTrigger>
      <SheetContent
        ref={ref}
        onEscapeKeyDown={v => setDialogState(false, props.onOpenChange)}
        side={props.side}
        className={cn(
          "text-foreground bg-background border-border",
          props.side === "right" ? "border-l-2" : "border-r-2",
          props.contentClassName,
        )}
      >
        <SheetHeader>
          <SheetTitle asChild={isTitleElement}>{props.title}</SheetTitle>
          <SheetDescription asChild={isDescriptionElement}>
            {props.description}
          </SheetDescription>
        </SheetHeader>
        <div
          className={cn(
            "h-full pb-8 flex flex-col",
            props.innerContainerClassName,
          )}
        >
          {props.children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
