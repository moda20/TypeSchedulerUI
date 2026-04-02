import type { ColumnDef, Row, SortingState } from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  Table as ReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import * as React from "react"
import { useRef } from "react"
import {
  useVirtualizer,
  VirtualItem,
  Virtualizer,
} from "@tanstack/react-virtual"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  events: {
    onPageChange: ({ sorting }: { sorting: SortingState }) => void
    actionConfirmed: () => void
    onRowSelectionChange: (selectedRowIds: {}) => void
  }
  filters: {
    sorting: SortingState
  }
  rowSelection?: {}
  size?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  events,
  filters,
  rowSelection,
  size,
}: DataTableProps<TData, TValue>) {
  const tableContainerRef = useRef(null)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    onSortingChange: v => {
      events.onPageChange({
        sorting: typeof v === "function" ? v(filters.sorting) : v,
      })
    },
    state: {
      sorting: filters.sorting,
      rowSelection,
    },
    onRowSelectionChange: events.onRowSelectionChange,
    getRowId: (row: any) => row.id,
  })

  return (
    <div
      className={cn(
        "rounded-md border border-border w-full overflow-auto relative",
        size,
        data.length > 0 ? "" : "min-h-[800px]",
      )}
      ref={tableContainerRef}
    >
      <Table className="grid">
        <TableHeader className="grid sticky top-0 z-10">
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow
              key={headerGroup.id}
              className={"flex w-full border-border"}
            >
              {headerGroup.headers.map(header => {
                return (
                  <TableHead
                    key={header.id}
                    className="flex flex-grow items-center"
                    style={{ width: header.column.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBodyVirtualized
          table={table}
          tableContainerRef={tableContainerRef}
          columnsLength={columns.length}
        />
      </Table>
    </div>
  )
}

interface TableBodyProps {
  table: ReactTable<any>
  tableContainerRef: React.RefObject<HTMLDivElement>
  columnsLength: number
}

function TableBodyVirtualized({
  table,
  tableContainerRef,
  columnsLength,
}: TableBodyProps) {
  const { rows } = table.getRowModel()
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => 76,
    getScrollElement: () => tableContainerRef.current,
    overscan: 24,
    lanes: 1,
  })

  return (
    <TableBody
      className="grid relative"
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
      }}
    >
      {rows.length === 0 ? (
        <TableRow>
          <TableCell colSpan={columnsLength} className="h-24 text-center">
            No results.
          </TableCell>
        </TableRow>
      ) : (
        rowVirtualizer.getVirtualItems().map(virtualRow => {
          const row = rows[virtualRow.index] as Row<any>
          return (
            <TableBodyRow
              key={row.id}
              row={row}
              virtualRow={virtualRow}
              rowVirtualizer={rowVirtualizer}
            />
          )
        })
      )}
    </TableBody>
  )
}

interface TableBodyRowProps {
  row: Row<any>
  virtualRow: VirtualItem
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>
}

function TableBodyRow({ row, virtualRow, rowVirtualizer }: TableBodyRowProps) {
  return (
    <TableRow
      data-index={virtualRow.index}
      ref={node => rowVirtualizer.measureElement(node)}
      key={row.id}
      className="flex absolute w-full border-b-border"
      style={{
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      {row.getVisibleCells().map(cell => {
        return (
          <TableCell
            key={cell.id}
            className="w-full flex flex-grow items-center"
            style={{
              width: cell.column.getSize(),
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}
    </TableRow>
  )
}
