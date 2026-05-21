import { AllJobsStats } from "@/components/custom/charts/allJobStats"
import StatsBar from "@/components/custom/dashboard/statsBar"
import { AllEventStats } from "@/components/custom/charts/AllEventStats"
import * as React from "react"

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-4">
      <StatsBar />
      <AllJobsStats />
      <AllEventStats />
    </div>
  )
}
