import { Card, CardContent } from "@/components/ui/card"
import { FileWarningIcon, Calendar, Play, Database } from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import jobsService from "@/services/JobsService"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import WithError from "@/components/custom/dashboard/WithError"

export interface StatsBarProps {
  metrics?: any
}

interface MetricSectionProps {
  title: string
  value: ReactNode
  icon: ReactNode
  textSize: string
  bgColor: string
  bgColorLight: string
  hasError?: boolean
  tooltipContent?: string
}

function MetricSection({
  title,
  value,
  icon,
  textSize,
  bgColor,
  bgColorLight,
  hasError,
  tooltipContent,
}: MetricSectionProps) {
  return (
    <div
      className={cn(
        "relative p-5 transition-all duration-300",
        hasError ? "bg-destructive/5" : `${bgColorLight}/5`,
      )}
    >
      {!hasError && (
        <div className={cn("absolute top-0 right-0 w-1 h-full", bgColor)} />
      )}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <WithError errorCpt={`--`} hasError={hasError}>
              <span
                className={cn(
                  "font-bold",
                  textSize ?? "text-2xl",
                  hasError ? "text-destructive" : "text-foreground",
                )}
              >
                {value}
              </span>
            </WithError>
          </div>
        </div>
        <div
          className={cn(
            "flex-shrink-0 ml-4",
            hasError ? "text-destructive" : bgColor,
          )}
        >
          {hasError ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <FileWarningIcon size={28} />
                </TooltipTrigger>
                <TooltipContent className="text-destructive border-destructive">
                  {tooltipContent || "Error fetching data"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            icon
          )}
        </div>
      </div>
    </div>
  )
}

export default function StatsBar(props: StatsBarProps) {
  const [jobMetrics, setJobMetrics] = useState(props.metrics ?? {})
  const [hasError, setHasError] = useState(false)

  const getJobMetrics = async () => {
    jobsService
      .jobMetrics()
      .then(data => {
        setJobMetrics(data)
      })
      .catch(err => {
        setHasError(true)
      })
  }

  useEffect(() => {
    getJobMetrics()
  }, [])

  return (
    <div className="w-full xl:w-1/2">
      <Card
        className={cn(
          "border-border overflow-hidden",
          hasError && "border-destructive",
        )}
      >
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            <div className="flex-1">
              <MetricSection
                title="Registered Jobs"
                value={jobMetrics.job_count}
                icon={<Database size={28} />}
                textSize="text-4xl"
                bgColor="text-metric1"
                bgColorLight="bg-metric1-light"
                hasError={hasError}
                tooltipContent="Error fetching registered jobs"
              />
            </div>

            <div className="hidden md:block w-px bg-border my-5" />
            <div className="md:hidden h-px bg-border mx-5" />

            <div className="flex-1">
              <MetricSection
                title="Scheduled Jobs"
                value={jobMetrics.running_jobs_count}
                icon={<Calendar size={28} />}
                textSize="text-3xl"
                bgColor="text-metric2"
                bgColorLight="bg-metric2-light"
                hasError={hasError}
                tooltipContent="Error fetching scheduled jobs"
              />
            </div>

            <div className="hidden md:block w-px bg-border my-5" />
            <div className="md:hidden h-px bg-border mx-5" />

            <div className="flex-1">
              <MetricSection
                title="Running Jobs"
                value={jobMetrics.runningJobsCount}
                icon={<Play size={28} className="fill-current" />}
                textSize="text-2xl"
                bgColor="text-metric3"
                bgColorLight="bg-metric3-light"
                hasError={hasError}
                tooltipContent="Error fetching running jobs"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
