import type { FileItemProps } from "@/components/custom/general/FileItem"
import FileItem from "@/components/custom/general/FileItem"
import { useMemo, useRef } from "react"
import type { LogFileMetadata, LogsStructure } from "@/models/logs"
import { humanFileSize } from "@/utils/numberUtils"
import { useVirtualizer } from "@tanstack/react-virtual"
import { cn } from "@/lib/utils"

export interface LogfileListProps {
  logFiles: LogFileMetadata[]
  readLogFile: (fileName: string) => Promise<LogsStructure>
  downloadLogFile?: (fileName: string) => Promise<any>
  originName?: string
}

export default function LogFileList(props: LogfileListProps) {
  const parentRef = useRef(null)

  const rowVirtualizer = useVirtualizer({
    count: props.logFiles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 68.5,
    overscan: 24,
    gap: 8,
    lanes: 1,
  })

  const FileList: FileItemProps[] = useMemo(() => {
    return props.logFiles.map((logFile, i) => {
      return {
        item: {
          fileId: logFile.hash,
          fileName: logFile.name,
          fileSize: humanFileSize(logFile.fileStats?.size!),
          index: i,
          createAt: logFile.date
            ? new Date(logFile.date).toISOString()
            : undefined,
          originName: props.originName,
          deletionDate: logFile.deletionDate,
        },
        canPreview: true,
        canDelete: false,
        readLogFile: props.readLogFile,
        downloadFile: props.downloadLogFile,
      } as FileItemProps
    })
  }, [props.logFiles, props.readLogFile])

  return (
    <div
      ref={parentRef}
      className="List overflow-auto w-full h-[calc(100%-3rem)]"
    >
      <div
        className={cn("w-full relative")}
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow, index) => (
          <FileItem
            className="mb-2 absolute"
            style={{
              transform: `translateY(${virtualRow.start}px)`,
            }}
            {...FileList[virtualRow?.index ?? index]}
          />
        ))}
      </div>
    </div>
  )
}
