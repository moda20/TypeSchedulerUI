import { FormControl } from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import useDialogueManager from "@/hooks/useDialogManager"
import { useEffect, useState } from "react"
import { safeStringCast } from "@/utils/generalUtils"
import { cn } from "@/lib/utils"

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

export default function ManagedSelect(props: ManagedSelectProps) {
  const { isDialogOpen, setDialogState } = useDialogueManager()
  const [parsedInputs, setParsedInputs] = useState<
    Array<ParsedManagedSelectInputValue>
  >([])

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

  return (
    <Select
      open={isDialogOpen}
      onOpenChange={v => setDialogState(v)}
      onValueChange={v => {
        const targetValue = props.inputOptions.find(
          e => safeStringCast(e.value) === v,
        )
        props.onChange(props.exportOnlyValue ? targetValue?.value : targetValue)
        setDialogState(false)
      }}
      defaultValue={safeStringCast(props.defaultValue)}
      disabled={props.disabled}
    >
      <SelectTrigger
        onClick={v => {
          v.preventDefault()
          setDialogState(true)
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
}
