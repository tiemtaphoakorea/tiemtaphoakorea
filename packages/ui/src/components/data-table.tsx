"use client"

import { type ColumnDef, flexRender } from "@tanstack/react-table"
import { cn } from "@workspace/ui/lib/utils"
import { Loader2 } from "lucide-react"
import { PaginationControls } from "./pagination-controls"
import { Skeleton } from "./skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  isFetching?: boolean
  pageCount?: number
  pagination?: {
    pageIndex: number
    pageSize: number
  }
  onPaginationChange?: (pagination: {
    pageIndex: number
    pageSize: number
  }) => void
  emptyMessage?: string
  emptyState?: React.ReactNode
  className?: string
  headerClassName?: string
  onRowClick?: (row: { original: TData }) => void
}

type FlatColumn<TData, TValue> = ColumnDef<TData, TValue> & {
  accessorKey?: keyof TData | string
  accessorFn?: (row: TData, index: number) => unknown
  columns?: ColumnDef<TData, TValue>[]
  id?: string
}

function flattenColumns<TData, TValue>(
  columns: ColumnDef<TData, TValue>[]
): FlatColumn<TData, TValue>[] {
  return columns.flatMap((column) => {
    const flatColumn = column as FlatColumn<TData, TValue>
    return flatColumn.columns?.length
      ? flattenColumns(flatColumn.columns)
      : [flatColumn]
  })
}

function getColumnId<TData, TValue>(
  column: FlatColumn<TData, TValue>,
  index: number
) {
  if (column.id) {
    return column.id
  }

  if (column.accessorKey) {
    return String(column.accessorKey)
  }

  return `column-${index}`
}

function getCellValue<TData, TValue>(
  column: FlatColumn<TData, TValue>,
  row: TData,
  index: number
) {
  if (column.accessorFn) {
    return column.accessorFn(row, index)
  }

  if (column.accessorKey && row && typeof row === "object") {
    return (row as Record<string, unknown>)[String(column.accessorKey)]
  }

  return undefined
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  isFetching = false,
  pageCount = 1,
  pagination,
  onPaginationChange,
  emptyMessage = "Không tìm thấy dữ liệu.",
  emptyState,
  className,
  headerClassName,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const flatColumns = flattenColumns(columns)

  return (
    <div className="relative space-y-4">
      {isFetching && !isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/10 backdrop-blur-[1px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div
        className={cn(
          className,
          isFetching &&
            !isLoading &&
            "pointer-events-none opacity-40 grayscale-20 transition-all duration-300"
        )}
      >
        <Table>
          <TableHeader className={headerClassName}>
            <TableRow className="hover:bg-transparent">
              {flatColumns.map((column, columnIndex) => (
                <TableHead key={getColumnId(column, columnIndex)}>
                  {flexRender(column.header, {
                    column: {
                      columnDef: column,
                      id: getColumnId(column, columnIndex),
                    },
                    header: {
                      id: getColumnId(column, columnIndex),
                      isPlaceholder: false,
                    },
                    table: null,
                  } as never)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pagination?.pageSize || 5 }).map(
                (_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {flatColumns.map((column, columnIndex) => (
                      <TableCell key={getColumnId(column, columnIndex)}>
                        <Skeleton className="h-6 w-full opacity-50" />
                      </TableCell>
                    ))}
                  </TableRow>
                )
              )
            ) : data.length ? (
              data.map((item, rowIndex) => {
                const row = {
                  id: `${rowIndex}`,
                  index: rowIndex,
                  original: item,
                  getIsSelected: () => false,
                  getValue: (columnId: string) => {
                    const column = flatColumns.find(
                      (candidate, index) =>
                        getColumnId(candidate, index) === columnId
                    )
                    return column
                      ? getCellValue(column, item, rowIndex)
                      : undefined
                  },
                }

                return (
                  <TableRow
                    key={row.id}
                    className={
                      onRowClick
                        ? "group cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                        : "group hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                    }
                    onClick={
                      onRowClick
                        ? (e) => {
                            if (
                              (e.target as HTMLElement).closest("button") ||
                              (e.target as HTMLElement).closest("a")
                            ) {
                              return
                            }

                            onRowClick(row)
                          }
                        : undefined
                    }
                  >
                    {flatColumns.map((column, columnIndex) => {
                      const columnId = getColumnId(column, columnIndex)
                      const cellValue = getCellValue(column, item, rowIndex)

                      return (
                        <TableCell key={`${row.id}-${columnId}`}>
                          {flexRender(column.cell, {
                            cell: {
                              id: `${row.id}-${columnId}`,
                              column: { columnDef: column, id: columnId },
                              getValue: () => cellValue,
                            },
                            column: { columnDef: column, id: columnId },
                            row,
                            table: null,
                            getValue: () => cellValue,
                            renderValue: () => cellValue ?? null,
                          } as never) ?? (cellValue as React.ReactNode)}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={flatColumns.length}
                  className="h-40 text-center font-medium text-slate-500"
                >
                  {emptyState || emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {onPaginationChange && pagination && pageCount > 1 && (
        <div className="border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <PaginationControls
            currentPage={pagination.pageIndex + 1}
            totalPages={pageCount}
            onPageChange={(page) =>
              onPaginationChange({ ...pagination, pageIndex: page - 1 })
            }
          />
        </div>
      )}
    </div>
  )
}
