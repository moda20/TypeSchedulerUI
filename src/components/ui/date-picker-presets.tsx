import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import moment from "moment"
import { format, subDays } from "date-fns"
import type { DateRange } from "react-day-picker"
import useDialogueManager from "@/hooks/useDialogManager"

type DateRangeExtended = DateRange & { label?: string; days?: number }

export interface DatePickerWithPresetsProps {
  onChange: (date: DateRange | undefined) => void
  defaultValue?: DateRange
  selectRangeList?: Array<DateRangeExtended>
  disabled?: boolean
}
const presetDates: DateRangeExtended[] = [
  {
    from: subDays(new Date(), 1),
    to: new Date(),
    label: "Last day",
    days: 1,
  },
  {
    from: subDays(new Date(), 2),
    to: new Date(),
    label: "Last 2 days",
    days: 2,
  },
  {
    from: subDays(new Date(), 7),
    to: new Date(),
    label: "Last week",
    days: 7,
  },
  {
    from: subDays(new Date(), 30),
    to: new Date(),
    label: "Last month",
    days: 30,
  },
  {
    from: subDays(new Date(), 180),
    to: new Date(),
    label: "Last 6 month",
    days: 180,
  },
]

export const defaultDateRange = presetDates?.slice(-2)[0]

export function DatePickerWithPresets(props: DatePickerWithPresetsProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(
    props.defaultValue ?? {
      from: defaultDateRange.from,
      to: defaultDateRange.to,
    },
  )

  const [selectRangeList, setSelectRangeList] = React.useState<
    Array<DateRangeExtended>
  >(props.selectRangeList ?? presetDates)

  const mappedPresetDates = React.useMemo(() => {
    return selectRangeList.reduce(
      (acc, cur) => {
        acc[cur.days ?? ""] = cur
        return acc
      },
      {} as Record<string, DateRangeExtended>,
    )
  }, [selectRangeList])

  const { isDialogOpen, setDialogState } = useDialogueManager({
    enableEscapeHotKey: true,
  })

  const selectDate = (date: DateRange | undefined) => {
    setDate(date)
    props.onChange(date)
  }

  const setPresetDates = (command: string) => {
    selectDate(mappedPresetDates[Number(command)])
  }
  const parseDateToPreset = () => {
    const currentDateCount = moment(date?.to).diff(moment(date?.from), "days")
    return mappedPresetDates[currentDateCount]?.days?.toString()
  }

  return (
    <Popover open={isDialogOpen} onOpenChange={v => setDialogState(v)}>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant={"outline"}
          className={cn(
            "justify-start text-left font-normal",
            !date && "text-muted-foreground",
          )}
          onClick={() => setDialogState(true)}
          onKeyDown={v => {
            if (v.key === "Escape") {
              v.preventDefault()
              setDialogState(false)
            }
          }}
          disabled={props.disabled}
        >
          <CalendarIcon />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "LLL dd, y")} -{" "}
                {format(date.to, "LLL dd, y")}
              </>
            ) : (
              format(date.from, "LLL dd, y")
            )
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-50 flex w-auto flex-col space-y-2 p-2 bg-background text-foreground pointer-events-auto border-2"
      >
        <Select onValueChange={setPresetDates} value={parseDateToPreset()}>
          <SelectTrigger className="border-2 border-border">
            <SelectValue
              className="bg-background text-foreground"
              placeholder="Select"
            />
          </SelectTrigger>
          <SelectContent
            className="bg-background text-foreground border-border border-2"
            position="popper"
          >
            {selectRangeList.map((e, i) => {
              return (
                <SelectItem key={i} value={e.days?.toString() ?? ""}>
                  {e.label}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        <div className="rounded-md border-2 border-border">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={selectDate}
            numberOfMonths={2}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
