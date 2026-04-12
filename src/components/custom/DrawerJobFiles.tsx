import { Button } from "@/components/ui/button"
import {
  ArrowDownFromLine,
  FileJson2,
  Files,
  FileX2,
  Trash2,
} from "lucide-react"
import SheetActionDialog from "@/components/sheet-action-dialog"
import type { jobsTableData } from "@/features/jobsTable/interfaces"
import type { ReactNode } from "react"
import { useRef } from "react"
import jobsService from "@/services/JobsService"
import { useCallback, useEffect, useState, useMemo } from "react"
import moment from "moment"
import { humanFileSize } from "@/utils/numberUtils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ButtonGroup } from "@/components/ui/buttonGroup"
import ConfirmationDialogAction, {
  ConfirmationDialogActionType,
} from "@/components/confirmationDialogAction"
import { toast } from "@/hooks/use-toast"
import type { CacheFile, jobLog, OutputFile } from "@/models/cacheFiles"
import DrawerFilePreview from "@/components/custom/DrawerFilePreview"
import { cn } from "@/lib/utils"
import ScrollableList from "@/components/custom/general/ScrollableList"

export interface DrawerJobFilesProps {
  JobDetails: jobsTableData
  trigger: ReactNode
}

export default function DrawerJobFiles({
  JobDetails,
  trigger,
}: DrawerJobFilesProps) {
  const [cacheFiles, setCacheFiles] = useState<{
    total: number
    offset?: number
    data: jobLog[]
  }>({ total: 0, data: [] })
  const [outputFiles, setOutputFiles] = useState<{
    total: number
    data: jobLog[]
    offset?: number
  }>({ total: 0, data: [] })
  const cacheFilesListRef = useRef<any>(null)
  const outputFilesListRef = useRef<any>(null)
  const getCacheFiles = (offset?: number) => {
    return jobsService
      .getJobCacheFiles(JobDetails.id.toString(), offset, 10)
      .then(data => {
        data.data.forEach((log: jobLog) => {
          log.cache_files?.forEach((cacheFile: CacheFile) => {
            cacheFile["parsed_file_size"] = humanFileSize(cacheFile.file_size)
          })
        })
        return data
      })
  }

  const getOutputFiles = (offset?: number) => {
    return jobsService
      .getJobOutputFiles(JobDetails.id.toString(), offset, 10)
      .then(data => {
        data.data.forEach((log: jobLog) => {
          log.output_files?.forEach((outputFile: OutputFile) => {
            outputFile["parsed_file_size"] = humanFileSize(outputFile.file_size)
          })
        })
        return data
      })
  }

  const downloadFile = useCallback(
    (file: CacheFile, nature: string) => {
      switch (nature) {
        case "cache":
          return jobsService
            .downloadCacheFile(file.id, file.file_name)
            .then(() => {
              toast({
                title: `Cache file ${file.file_name} downloaded`,
                duration: 2000,
              })
              return getCacheFiles()
            })
        case "output":
          return jobsService
            .downloadOutputFile(file.id, file.file_name)
            .then(() => {
              toast({
                title: `Output file ${file.file_name} downloaded`,
                duration: 2000,
              })
              return getOutputFiles()
            })
        default:
          break
      }
    },
    [JobDetails],
  )

  const deleteFile = useCallback(
    (file: CacheFile, nature: string, index: number) => {
      switch (nature) {
        case "cache":
          return jobsService
            .deleteCacheFile(file.id, file.file_name)
            .then(() => {
              toast({
                title: `Cache file ${file.file_name} deleted`,
                duration: 2000,
              })
              return cacheFilesListRef.current?.removeItem(index)
            })
        case "output":
          return jobsService
            .deleteOutputFile(file.id, file.file_name)
            .then(() => {
              toast({
                title: `Output file ${file.file_name} deleted`,
                duration: 2000,
              })
              return outputFilesListRef.current?.removeItem(index)
            })
        default:
          break
      }
    },
    [JobDetails, cacheFilesListRef.current],
  )

  const handleConfirmAction = useCallback(
    (inputFunction: any) => {
      return (action: ConfirmationDialogActionType) => {
        if (action === ConfirmationDialogActionType.CANCEL) return
        return inputFunction(action)
      }
    },
    [deleteFile, downloadFile],
  )

  useEffect(() => {
    getFirstFileList()
  }, [])

  const getFirstFileList = useCallback(() => {
    getCacheFiles().then(data => setCacheFiles(data))
    getOutputFiles().then(data => setOutputFiles(data))
  }, [])

  const getInitialOutputList = useMemo(() => {
    return outputFiles.data
      .map((e: any) => {
        return e.output_files.map((c: any, i: number) => {
          c.cache_index = i
          return c
        })
      })
      .flat()
  }, [outputFiles.data])

  const getNextOutputFiles = useCallback(
    (offset?: number) => {
      setOutputFiles({
        ...outputFiles,
        offset: offset,
      })
      return getOutputFiles(offset).then(data =>
        data.data
          .map((e: any) => {
            return e.output_files.map((c: any, i: number) => {
              c.output_files = i
              return c
            })
          })
          .flat(),
      )
    },
    [outputFiles.offset, outputFiles.total],
  )
  const getFullInitialCacheList = useMemo(() => {
    return cacheFiles.data
      .map((e: any) => {
        return e.cache_files.map((c: any, i: number) => {
          c.cache_index = i
          return c
        })
      })
      .flat()
  }, [cacheFiles.data])

  const getNextCacheFiles = useCallback(
    (offset?: number) => {
      setCacheFiles({
        ...cacheFiles,
        offset: offset,
      })
      return getCacheFiles(offset).then(data => {
        return data.data
          .map((e: any) => {
            return e.cache_files.map((c: any, i: number) => {
              c.cache_index = i
              return c
            })
          })
          .flat()
      })
    },
    [cacheFiles.total, cacheFiles.offset],
  )

  return (
    <SheetActionDialog
      side={"right"}
      title={`Job Files for ${JobDetails.name}`}
      description={"Manage your exported files"}
      trigger={trigger}
      modal={true}
    >
      <div className={"flex flex-col gap-2 py-4"}>
        <div className="text-lg font-bold">Cache Files:</div>
        <ScrollArea className="max-h-96">
          <div className="flex flex-col gap-4">
            <ScrollableList
              ref={cacheFilesListRef}
              autoFocus={true}
              originalList={getFullInitialCacheList}
              loadMore={(cacheFiles.offset ?? 0) < cacheFiles.total}
              loadMoreAction={getNextCacheFiles}
              renderNoItems={() => (
                <div className="flex flex-col gap-2 items-center justify-center p-2 border-border border rounded-md">
                  <FileX2 />
                  <div className="text-muted-foreground text-sm">
                    No cache files found
                  </div>
                </div>
              )}
              itemClassName={(item: any) => {
                return cn(
                  "focus:rounded-lg outline-none border-b-2 border-transparent focus:border-blue-500 hover:border-blue-500 transition-colors duration-200 focus-visible:border-blue-500 hover:rounded-lg",
                  item.error ? "ring-destructive ring-2 rounded-xl" : "",
                )
              }}
              renderItem={(item: any, index: number) => {
                return (
                  <div key={index} className="flex flex-col gap-2">
                    {item.cache_index === 0 && (
                      <div className="flex flex-row gap-1.5 items-center">
                        <div className="separator h-[0.1px] bg-foreground opacity-50 w-1/6"></div>
                        <div className="text-xs italic font-bold">
                          {item.job_log_id}
                        </div>
                      </div>
                    )}
                    <div
                      key={item.created_at}
                      className="flex flex-row gap-3 items-center border border-border rounded-md p-2 bg-sidebar"
                    >
                      <span
                        title={item.file_type}
                        className="flex flex-col gap-1 justify-center items-center"
                      >
                        {item.file_type === "json" ? <FileJson2 /> : <Files />}
                        <DrawerFilePreview
                          trigger={
                            <Button
                              className="italic text-[11px] p-0.5 px-1 h-[unset]"
                              size="sm"
                              variant={"outline"}
                            >
                              Preview
                            </Button>
                          }
                          id={item.id}
                          fileName={item.file_name}
                          fileType={item.file_type}
                          fileNature={"cache"}
                        />
                      </span>
                      <div className="flex flex-col gap-1">
                        <div
                          title={item.file_name}
                          className="text-sm font-bold text-ellipsis overflow-hidden max-w-[200px]"
                        >
                          {item.file_name}
                        </div>
                        <div className="text-xs text-[--muted-foreground]">
                          <span className="font-semibold">Created at: </span>
                          <span title={item.created_at}>
                            {moment(item.created_at).format("YYYY-MM-DD HH")}h
                          </span>
                          , <span className="font-semibold">Size</span>:{" "}
                          <span>{item.parsed_file_size}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-center ml-auto">
                        <ButtonGroup orientation={"vertical"}>
                          <Button
                            variant={"outline"}
                            size={"icon"}
                            className="w-8 h-6 [&_svg]:size-3.5 border-border"
                            onClick={() => downloadFile(item, "cache")}
                          >
                            <ArrowDownFromLine />
                          </Button>
                          <ConfirmationDialogAction
                            title={"Delete cache file"}
                            description={`This will delete the ${item.file_name} cache file permanently`}
                            takeAction={handleConfirmAction(() =>
                              deleteFile(item, "cache", index),
                            )}
                            confirmText={"Delete cache file"}
                            confirmVariant={"destructive"}
                          >
                            <Button
                              variant={"destructive"}
                              size={"icon"}
                              className="w-8 h-6 [&_svg]:size-3.5 border-t-0 rounded-t-none"
                              onClick={e => e.preventDefault()}
                            >
                              <Trash2 />
                            </Button>
                          </ConfirmationDialogAction>
                        </ButtonGroup>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
          </div>
        </ScrollArea>
        <div className="text-lg font-bold">Output Files:</div>
        <ScrollArea className="max-h-96">
          <div className="flex flex-col gap-4">
            <ScrollableList
              ref={outputFilesListRef}
              originalList={getInitialOutputList}
              loadMore={(outputFiles.offset ?? 0) < outputFiles.total}
              loadMoreAction={getNextOutputFiles}
              renderNoItems={() => (
                <div className="flex flex-col gap-2 items-center justify-center p-2 border-border border rounded-md">
                  <FileX2 />
                  <div className="text-muted-foreground text-sm">
                    No output files found
                  </div>
                </div>
              )}
              itemClassName={(item: any) => {
                return cn(
                  "focus:rounded-lg outline-none border-b-2 border-transparent focus:border-blue-500 hover:border-blue-500 transition-colors duration-200 focus-visible:border-blue-500 hover:rounded-lg",
                  item.error ? "ring-destructive ring-2 rounded-xl" : "",
                )
              }}
              renderItem={(item: any, index) => {
                return (
                  <div
                    key={item.created_at}
                    className="flex flex-row gap-3 items-center border border-border rounded-md p-2 bg-sidebar"
                  >
                    <span
                      title={item.file_type}
                      className="flex flex-col gap-1 justify-center items-center"
                    >
                      {item.file_type === "json" ? <FileJson2 /> : <Files />}
                      <DrawerFilePreview
                        trigger={
                          <Button
                            className="italic text-[11px] p-0.5 px-1 h-[unset]"
                            size="sm"
                            variant={"outline"}
                          >
                            Preview
                          </Button>
                        }
                        id={item.id}
                        fileName={item.file_name}
                        fileType={item.file_type}
                        fileNature={"output"}
                      />
                    </span>
                    <div className="flex flex-col gap-1">
                      <div
                        title={item.file_name}
                        className="text-sm font-bold text-ellipsis overflow-hidden max-w-[200px]"
                      >
                        {item.file_name}
                      </div>
                      <div className="text-xs text-[--muted-foreground]">
                        <span className="font-semibold">Created at: </span>
                        <span title={item.created_at}>
                          {moment(item.created_at).format("YYYY-MM-DD HH")}h
                        </span>
                        , <span className="font-semibold">Size</span>:{" "}
                        <span>{item.parsed_file_size}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-center ml-auto">
                      <ButtonGroup orientation={"vertical"}>
                        <Button
                          variant={"outline"}
                          size={"icon"}
                          className="w-8 h-6 [&_svg]:size-3.5 border-border"
                          onClick={() => downloadFile(item, "output")}
                        >
                          <ArrowDownFromLine />
                        </Button>
                        <ConfirmationDialogAction
                          title={"Delete output file"}
                          description={`This will delete the ${item.file_name} output file permanently`}
                          takeAction={handleConfirmAction(() =>
                            deleteFile(item, "output", index),
                          )}
                          confirmText={"Delete output file"}
                          confirmVariant={"destructive"}
                        >
                          <Button
                            variant={"destructive"}
                            size={"icon"}
                            className="w-8 h-6 [&_svg]:size-3.5 border-t-0 rounded-t-none"
                            onClick={e => e.preventDefault()}
                          >
                            <Trash2 />
                          </Button>
                        </ConfirmationDialogAction>
                      </ButtonGroup>
                    </div>
                  </div>
                )
              }}
            />
          </div>
        </ScrollArea>
      </div>
    </SheetActionDialog>
  )
}
