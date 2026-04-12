import {
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  differenceInCalendarMonths,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from "date-fns"

const EPOCHS = {
  day: new Date(1970, 0, 1),
  week: new Date(1970, 0, 5),
  month: new Date(1970, 0, 1),
}

export type EpochsType = keyof typeof EPOCHS
export enum momentDateKey {
  day = "hours",
  week = "weekdays",
  month = "date",
}
export function getTimeIndex(date = new Date(), type: EpochsType = "day") {
  switch (type) {
    case "day":
      return differenceInCalendarDays(date, EPOCHS.day)

    case "week":
      return differenceInCalendarWeeks(date, EPOCHS.week, {
        weekStartsOn: 0,
      })

    case "month":
      return differenceInCalendarMonths(date, EPOCHS.month)

    default:
      throw new Error("Invalid type")
  }
}

export function formatDiff(date1: Date, date2: Date) {
  const seconds = Math.abs(differenceInSeconds(date1, date2))

  if (seconds < 60) {
    return `${seconds} sec`
  }

  const minutes = Math.abs(differenceInMinutes(date1, date2))
  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.abs(differenceInHours(date1, date2))
  if (hours < 24) {
    return `${hours} h`
  }

  const days = Math.abs(differenceInDays(date1, date2))
  return `${days} d`
}
