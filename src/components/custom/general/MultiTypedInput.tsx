import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import ManagedSelect from "@/components/custom/ManagedSelect"
import { defaultBatchOrderingItems } from "@/components/custom/jobsTable/AdvancedJobExecutionForm"

export const allAcceptedTypes = ["exact", "regex", "between"] as const
export type InputType = (typeof allAcceptedTypes)[number]

export interface BetweenValue {
  value1: string | number
  value2: string | number
}
export interface defaultValue {
  value: string
  type: string
}

export const defaultMultiTypeNullValue: defaultValue = {
  value: "",
  type: "exact",
}
export const defaultBetweenValue: BetweenValue = {
  value1: "",
  value2: "",
}
export interface FlexibleInputProps {
  type?: InputType
  value?: string | BetweenValue | defaultValue | number
  name?: string
  onChange?: (value: string | BetweenValue | defaultValue) => void
  onError?: (field: any, error?: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  acceptedInputTypes?: Array<InputType>
}

const validateRegex = (pattern: string): string | undefined => {
  if (!pattern) return
  try {
    new RegExp(pattern)
    return
  } catch (error) {
    return `Invalid regex: ${error instanceof Error ? error.message : "Unknown error"}`
  }
}

export function FlexibleInput({
  type,
  value,
  onChange,
  onError,
  placeholder = "Enter value...",
  className,
  disabled = false,
  name,
  acceptedInputTypes,
}: FlexibleInputProps) {
  const [inputType, setInputType] = useState<InputType>(
    typeof value === "object" ? (value as any)?.type : "exact",
  )
  const inputTypeList = (acceptedInputTypes ?? allAcceptedTypes).map(e => ({
    label: e,
    value: e,
  }))
  const [exactValue, setExactValue] = useState<defaultValue>(
    defaultMultiTypeNullValue,
  )
  const [regexValue, setRegexValue] = useState<defaultValue>(
    defaultMultiTypeNullValue,
  )
  const [betweenValue, setBetweenValue] = useState<BetweenValue>({
    value1: "",
    value2: "",
  })

  // Initialize values based on prop
  useEffect(() => {
    switch (inputType) {
      case "exact":
      default:
        setExactValue((value ?? defaultMultiTypeNullValue) as defaultValue)
        break
      case "regex":
        setRegexValue((value ?? defaultMultiTypeNullValue) as defaultValue)
        break
      case "between":
        setBetweenValue((value ?? defaultBetweenValue) as BetweenValue)
        break
    }
  }, [value, inputType])

  // Handle type change
  const handleTypeChange = useCallback(
    (newType: InputType) => {
      setInputType(newType)

      // Reset values and errors when switching types
      setExactValue(defaultMultiTypeNullValue)
      setRegexValue(defaultMultiTypeNullValue)
      setBetweenValue({ value1: "", value2: "" })
      onError?.({ name })

      // Emit initial value for new type
      if (newType === "exact" || newType === "regex") {
        onChange?.(defaultMultiTypeNullValue)
      } else if (newType === "between") {
        onChange?.({ value1: "", value2: "" })
      }
    },
    [onChange, onError, name],
  )

  // Handle exact value change
  const handleExactChange = useCallback(
    (newValue: string) => {
      const typedValue = {
        value: newValue,
        type: "exact",
      }
      setExactValue(typedValue)
      onChange?.(typedValue)
    },
    [onChange],
  )

  // Handle regex value change
  const handleRegexChange = useCallback(
    (newValue: string) => {
      const typedValue = {
        value: newValue,
        type: "regex",
      }
      setRegexValue(typedValue)
      const error = validateRegex(newValue)
      if (error) {
        onError?.({ name }, error)
      } else {
        onError?.({ name })
      }
      onChange?.(typedValue)
    },
    [onChange, onError],
  )

  // Handle between value change
  const handleBetweenChange = useCallback(
    (field: keyof BetweenValue, newValue: string) => {
      const updated = { ...betweenValue, [field]: newValue, type: "between" }
      setBetweenValue(updated)
      onChange?.(updated)
    },
    [onChange, setBetweenValue, betweenValue],
  )

  useEffect(() => {
    if (type) {
      handleTypeChange(type)
    }
  }, [type, handleTypeChange])

  const renderInput = () => {
    switch (inputType) {
      case "exact":
        return (
          <Input
            value={exactValue.value}
            onChange={e => handleExactChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "focus-visible:ring-offset-0 bg-background text-foreground",
              !type ? "border-l-0 rounded-l-none" : "",
            )}
          />
        )

      case "regex":
        return (
          <Input
            value={regexValue.value}
            onChange={e => handleRegexChange(e.target.value)}
            placeholder="Enter regex pattern..."
            disabled={disabled}
            className={cn(
              "focus-visible:ring-offset-0 bg-background text-foreground",
              !type ? "border-l-0 rounded-l-none" : "",
            )}
          />
        )

      case "between":
        return (
          <div className="flex flex-1">
            <Input
              value={betweenValue.value1}
              onChange={e => handleBetweenChange("value1", e.target.value)}
              placeholder="Min value"
              disabled={disabled}
              className="border-l-0 border-r-0 rounded-none focus-visible:ring-offset-0 bg-background text-foreground"
            />
            <Input
              value={betweenValue.value2}
              onChange={e => handleBetweenChange("value2", e.target.value)}
              placeholder="Max value"
              disabled={disabled}
              className="border-l-0 rounded-l-none focus-visible:ring-offset-0"
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={cn("flex w-full", className)}>
      {!type && (
        <ManagedSelect
          onChange={handleTypeChange}
          inputOptions={inputTypeList}
          defaultValue={inputType}
          disabled={disabled}
          exportOnlyValue={true}
          className="w-32 rounded-r-none border-r-0 focus:ring-offset-0 capitalize"
          itemClassName="capitalize"
        />
      )}
      {renderInput()}
    </div>
  )
}
