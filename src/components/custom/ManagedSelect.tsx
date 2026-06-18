import { FormControl } from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import useDialogueManager from "@/hooks/useDialogManager"
import {
  forwardRef,
  useEffect,
  useState,
  type ElementRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react"
import { safeStringCast } from "@/utils/generalUtils"
import { cn } from "@/lib/utils"
import { useHotkeys } from "react-hotkeys-hook"

export type ManagedSelectInputValue = {
  value?: string | boolean
  label: string
}

export type ParsedManagedSelectInputValue = {
  value: string
  label: string
}

export interface ManagedSelectProps {
  onChange: (value?: ManagedSelectInputValue | any) => void
  defaultValue?: string | boolean
  inputOptions: Array<ManagedSelectInputValue>
  inputPlaceholder?: string
  exportOnlyValue?: boolean
  disabled?: boolean
  className?: string
  itemClassName?: string
}

const ManagedSelect = forwardRef<
  ElementRef<typeof SelectTrigger>,
  ManagedSelectProps
>((props, ref) => {
  const { isDialogOpen, setDialogState } = useDialogueManager()
  const [parsedInputs, setParsedInputs] = useState<
    Array<ParsedManagedSelectInputValue>
  >([])
  const innerRef = useRef<HTMLButtonElement>(null)
  useImperativeHandle(ref, () => innerRef.current)
  const hotkeyRef = useHotkeys(
    ["enter"],
    () => {
      handleDialogState(!isDialogOpen)
    },
    {
      ignoreModifiers: false,
      preventDefault: true,
    },
  )

  const refCallback = useCallback(
    (elem: HTMLButtonElement) => {
      innerRef.current = elem
      hotkeyRef(elem)
    },
    [hotkeyRef],
  )

  useEffect(() => {
    setParsedInputs(
      props.inputOptions.map(e => {
        return {
          ...e,
          value: safeStringCast(e.value),
        }
      }),
    )
  }, [props.inputOptions])

  const handleDialogState = useCallback(
    (open: boolean) => {
      if (open) {
        if (!props.disabled) {
          setDialogState(true)
        }
      } else {
        setDialogState(false)
      }
    },
    [props.disabled, setDialogState],
  )

  return (
    <Select
      open={isDialogOpen}
      onOpenChange={v => handleDialogState(v)}
      onValueChange={v => {
        const targetValue = props.inputOptions.find(
          e => safeStringCast(e.value) === v,
        )
        props.onChange(props.exportOnlyValue ? targetValue?.value : targetValue)
        handleDialogState(false)
      }}
      defaultValue={safeStringCast(props.defaultValue)}
      disabled={props.disabled}
    >
      <SelectTrigger
        ref={refCallback}
        onKeyDownCapture={e => {
          if (e.key === "Enter") {
            e.preventDefault()
          }
        }}
        onClick={v => {
          v.preventDefault()
          handleDialogState(true)
        }}
        className={cn(props.className)}
      >
        <SelectValue placeholder={props.inputPlaceholder} />
      </SelectTrigger>
      <SelectContent
        className="bg-background text-foreground border-2 border-border"
        onEscapeKeyDown={v => {
          v.preventDefault()
          setDialogState(false)
        }}
      >
        {parsedInputs.map(option => (
          <SelectItem
            key={option.value?.toString()}
            value={option.value}
            className={cn(props.itemClassName)}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})

ManagedSelect.displayName = "ManagedSelect"

export default ManagedSelect
