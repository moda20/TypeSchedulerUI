import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import jobsService from "@/services/JobsService"
import { useCallback, useEffect, useState } from "react"
import {
  DatePickerWithPresets,
  defaultDateRange,
} from "@/components/ui/date-picker-presets"
import type { DateRange } from "react-day-picker"
import WithError from "@/components/custom/dashboard/WithError"
import { Button } from "@/components/ui/button"
import { FileWarningIcon, LucideListRestart, SearchIcon } from "lucide-react"
import { getEventStats } from "@/services/components/eventsService"
import { Input } from "@/components/ui/input"
import { ButtonGroup } from "@/components/ui/buttonGroup"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { JobEventsTableFull } from "@/components/custom/dashboard/JobEventsTableFull"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { eventPeriodUnits } from "@/models/jobs"
const chartConfig = {
  events: {
    label: "All events count",
    color: "hsl(var(--chart-4))",
  },
  errors: {
    label: "Errors count",
    color: "hsl(var(--destructive))",
  },
  warnings: {
    label: "Warnings count",
    color: "hsl(var(--chart-3))",
  },
  info: {
    label: "Info count",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export interface AllEventStatsProps {
  dateRange?: DateRange | undefined
  period?: number
  stats?: Array<any>
}

export function AllEventStats(props: AllEventStatsProps) {
  const [stats, setStats] = React.useState(props.stats ?? [])
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: defaultDateRange.from,
    to: defaultDateRange.to,
  })
  const [period, setPeriod] = useState(props.period ?? 1)
  const [periodUnit, setPeriodUnit] = useState<string>("d")

  const [activeTab, setActiveTab] = useState("chart")

  const [hasError, setHasError] = useState(false)

  const ErrorComponent = React.memo(() => (
    <div className=" flex">
      <div className="m-auto flex flex-col gap-4 justify-center items-center text-sm ">
        <span className="flex gap-2">
          <FileWarningIcon /> <p>Error getting event stats</p>
        </span>
        <Button
          variant="default"
          className="btn-sm btn-rounded text-sm px-2 w-[130px]"
          onClick={() => {
            getStats()
          }}
        >
          <LucideListRestart /> Try again
        </Button>
      </div>
    </div>
  ))

  const getStats = () => {
    const calculatedPeriod = eventPeriodUnits[periodUnit] * period
    getEventStats(calculatedPeriod, dateRange)
      .then(data => {
        setStats(data as Array<any>)
      })
      .catch(err => {
        setHasError(true)
      })
  }

  useEffect(() => {
    getStats()
  }, [dateRange])

  const updatePeriod = (period: DateRange | undefined) => {
    setDateRange(period)
  }

  const setChunkPeriod = useCallback(
    (event: any) => {
      setPeriod(Number(event.target.value))
      if (event.key === "Enter") {
        getStats()
      }
    },
    [period],
  )

  const setPeriodUnitProxy = useCallback(
    (unit: any) => {
      setPeriodUnit(unit)
    },
    [setPeriodUnit],
  )

  const setActiveTabProxy = useCallback((tab: string) => {
    return () => setActiveTab(tab)
  }, [])

  return (
    <Card className="border-border">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-4 px-4 sm:flex-row text-foreground bg-background border-border rounded-t-xl sm:flex-wrap lg:flex-nowrap">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>
            {activeTab === "table"
              ? "Top unhandled events"
              : "Events over time"}
          </CardTitle>
          <CardDescription>
            {activeTab === "table"
              ? "Showing the top jobs with unhandled events by type"
              : "Showing recurrent stats for all emitted events"}
          </CardDescription>
        </div>
        <div className="flex gap-2 items-center flex-1 sm:flex-wrap lg:flex-nowrap">
          <ButtonGroup>
            <Button
              data-active={activeTab === "table"}
              className="data-[active=true]:bg-orange-50 data-[active=true]:text-orange-700 dark:data-[active=true]:bg-orange-900 dark:data-[active=true]:text-orange-50"
              variant={"outline"}
              onClick={setActiveTabProxy("table")}
            >
              Table
            </Button>
            <Button
              data-active={activeTab === "chart"}
              className="data-[active=true]:bg-orange-50 data-[active=true]:text-orange-700 dark:data-[active=true]:bg-orange-900 dark:data-[active=true]:text-orange-50"
              variant={"outline"}
              onClick={setActiveTabProxy("chart")}
            >
              Chart
            </Button>
          </ButtonGroup>
          <InputGroup className="w-auto">
            <InputGroupAddon>Period</InputGroupAddon>
            <InputGroupAddon>
              <Select
                value={periodUnit}
                onValueChange={setPeriodUnitProxy}
                data-active={activeTab === "chart"}
              >
                <SelectTrigger className="w-[100px] focus:ring-0 shadow-sm border-0">
                  <SelectValue
                    placeholder="Period Unit"
                    defaultValue={periodUnit}
                  ></SelectValue>
                </SelectTrigger>
                <SelectContent
                  className={
                    "bg-background text-foreground border-border outline-none "
                  }
                >
                  <SelectItem value={"min"}>Minute</SelectItem>
                  <SelectItem value={"h"}>Hour</SelectItem>
                  <SelectItem value={"d"}>Day</SelectItem>
                  <SelectItem value={"m"}>Month</SelectItem>
                </SelectContent>
              </Select>
            </InputGroupAddon>
            <InputGroupInput
              placeholder={"set graph x axis period"}
              value={period}
              onInput={setChunkPeriod}
              type="number"
              min={1}
              onKeyDown={setChunkPeriod}
              disabled={activeTab !== "chart"}
            />
            <InputGroupAddon align="inline-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <InputGroupButton
                    onClick={getStats}
                    size="icon-xs"
                    className="data-[active=true]:bg-orange-100 data-[active=true]:text-orange-700 dark:data-[active=true]:bg-orange-800 dark:data-[active=true]:text-orange-100"
                  >
                    <SearchIcon />
                  </InputGroupButton>
                </TooltipTrigger>
                <TooltipContent>Search</TooltipContent>
              </Tooltip>
            </InputGroupAddon>
          </InputGroup>
          <DatePickerWithPresets
            onChange={updatePeriod}
            defaultValue={dateRange}
          />
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 relative overflow-hidden transition-transform duration-100 ease-in">
        <div
          className={`transition-opacity duration-300 ease-in-out ${
            activeTab === "chart"
              ? "opacity-100"
              : "absolute px-2 pt-4 sm:px-6 sm:pt-6 inset-0 opacity-0 pointer-events-none"
          }`}
        >
          <WithError errorCpt={<ErrorComponent />} hasError={hasError}>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[350px] w-full"
            >
              <AreaChart data={stats}>
                <defs>
                  <linearGradient
                    id="filleAllEvents"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-events)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-events)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillErrors" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-errors)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-errors)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillWarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="95%"
                      stopColor="transparent"
                      stopOpacity={0.8}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={value => {
                    const date = new Date(value)
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      minute: "numeric",
                      hour: "numeric",
                    })
                  }}
                />
                <YAxis
                  yAxisId="main"
                  domain={["dataMin", "auto"]}
                  orientation="left"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  minTickGap={32}
                  amplitude={200}
                  allowDataOverflow={true}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      ItemLabelClassName="gap-4"
                      labelFormatter={value => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      }}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey="events"
                  type="natural"
                  fill="url(#filleAllEvents)"
                  stroke="var(--color-events)"
                  yAxisId="main"
                  stackId="a"
                />
                <Area
                  dataKey="errors"
                  type="natural"
                  fill="url(#fillErrors)"
                  stroke="var(--color-errors)"
                  yAxisId="main"
                />
                <Area
                  dataKey="warnings"
                  type="natural"
                  stroke="var(--color-warnings)"
                  fill="url(#fillWarnings)"
                  yAxisId="main"
                />
                <Area
                  dataKey="info"
                  type="natural"
                  stroke="var(--color-info)"
                  fill="url(#FillTotalRuns)"
                  yAxisId="main"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </WithError>
        </div>
        <div
          className={`transition-opacity duration-300 ease-in-out ${
            activeTab === "table"
              ? "opacity-100"
              : "absolute px-2 pt-4 sm:px-6 sm:pt-6 inset-0 opacity-0 pointer-events-none"
          }`}
        >
          <JobEventsTableFull />
        </div>
      </CardContent>
    </Card>
  )
}
