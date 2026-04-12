import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DatabaseBackup, LucideDatabase, LucideDatabaseZap } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import systemService from "@/services/SystemService"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

export default function DatabaseDashboard() {
  const [dbInfo, setDbInfo] = useState<any>({})
  const [baseDbInfo, setBaseDbInfo] = useState<any>({})

  const getDbInfo = useCallback(async () => {
    const dbInfo = await systemService.getDatabaseInformation()
    setDbInfo(dbInfo)
  }, [setDbInfo])

  const getBaseDbInfo = useCallback(async () => {
    const dbInfo = await systemService.getBaseDatabaseInformation()
    setBaseDbInfo(dbInfo)
  }, [setBaseDbInfo])

  const backUpDb = useCallback(() => {
    return systemService.downloadSchedulerDBBackupFile().then(() => {
      toast({
        title: "Backup finished successfully",
        duration: 1500,
      })
    })
  }, [])
  const backUpBaseDb = useCallback(() => {
    return systemService.downloadBaseDBBackupFile().then(() => {
      toast({
        title: "Backup finished successfully",
        duration: 1500,
      })
    })
  }, [])

  useEffect(() => {
    getDbInfo()
    getBaseDbInfo()
  }, [getBaseDbInfo, getDbInfo])

  return (
    <div className="flex flex-col gap-4">
      <div className={"flex flex-col gap-1 mb-4"}>
        <h2 className="text-2xl font-bold tracking-tight">
          Database & Backups
        </h2>
        <p className="text-md font-light">
          Manage the scheduler database, backups, restorations, etc.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 w-full">
        <Card className="border-border ">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 text-foreground bg-background border-border rounded-t-xl">
            <CardTitle className="text-md font-medium">
              Scheduler database : <b>{dbInfo?.databaseName}</b>
            </CardTitle>
            <LucideDatabase />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ul>
              <li className="my-2">
                <b>Host</b> : {dbInfo?.host}
              </li>
              <li className="my-2">
                <b>Database name</b> : {dbInfo?.databaseName}
              </li>
              <li className="my-2">
                <b>Size</b> : {dbInfo?.dbSize} MB
              </li>
            </ul>
          </CardContent>
          <CardFooter className="flex flex-row justify-end gap-2">
            <Button onClick={() => backUpDb()}>
              <DatabaseBackup /> Backup
            </Button>

            <Button variant="outline" disabled>
              <LucideDatabaseZap /> Restore
            </Button>
          </CardFooter>
        </Card>
        <Card className="border-border ">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 text-foreground bg-background border-border rounded-t-xl">
            <CardTitle className="text-md font-medium">
              Base database : <b>{baseDbInfo?.databaseName}</b>
            </CardTitle>
            <LucideDatabase />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ul>
              <li className="my-2">
                <b>Host</b> : {baseDbInfo?.host}
              </li>
              <li className="my-2">
                <b>Database name</b> : {baseDbInfo?.databaseName}
              </li>
              <li className="my-2">
                <b>Size</b> : {baseDbInfo?.dbSize} MB
              </li>
            </ul>
          </CardContent>
          <CardFooter className="flex flex-row justify-end gap-2">
            <Button onClick={() => backUpBaseDb()}>
              <DatabaseBackup /> Backup
            </Button>

            <Button variant="outline" disabled>
              <LucideDatabaseZap /> Restore
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
