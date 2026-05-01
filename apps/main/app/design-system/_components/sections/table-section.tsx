"use client";

import { DataTable } from "@workspace/ui/components/data-table";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { orderRows } from "../../_data/order-rows";
import { SectionHeader } from "../section-header";
import { ShowcaseBox } from "../showcase-box";

const DATA_TABLE_COLUMNS = [
  {
    accessorKey: "id",
    header: "Order #",
    cell: ({ getValue }: { getValue: () => unknown }) => (
      <span className="font-mono text-sm font-medium">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ getValue }: { getValue: () => unknown }) => (
      <span className="text-sm">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: { row: { original: (typeof orderRows)[number] } }) => (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${row.original.statusClasses}`}
      >
        {row.original.status}
      </span>
    ),
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ getValue }: { getValue: () => unknown }) => (
      <span className="font-mono text-sm">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "date",
    header: () => <span className="block text-right">Date</span>,
    cell: ({ getValue }: { getValue: () => unknown }) => (
      <span className="block text-right font-mono text-xs text-muted-foreground/70">
        {getValue() as string}
      </span>
    ),
  },
];

export function TableSection() {
  return (
    <>
      <SectionHeader
        num="12"
        id="table"
        title="Table & DataTable"
        desc="Base Table primitives + DataTable wrapper — with loading, empty, footer, and row-click states."
      />

      {/* Base Table */}
      <ShowcaseBox title="table — base">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-sm font-medium">{row.id}</TableCell>
                <TableCell className="text-sm">{row.customer}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${row.statusClasses}`}
                  >
                    {row.status}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm">{row.total}</TableCell>
                <TableCell className="text-right font-mono text-xs text-muted-foreground/70">
                  {row.date}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ShowcaseBox>

      {/* Table with Footer */}
      <ShowcaseBox title="table — with footer" className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-sm font-medium">{row.id}</TableCell>
                <TableCell className="text-sm">{row.customer}</TableCell>
                <TableCell className="font-mono text-sm">{row.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-semibold">
                Total ({orderRows.length} orders)
              </TableCell>
              <TableCell className="font-mono text-sm font-bold">2,255,000₫</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </ShowcaseBox>

      {/* DataTable — with columns + data */}
      <ShowcaseBox title="data-table — with data" className="mt-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <DataTable columns={DATA_TABLE_COLUMNS as any} data={orderRows} />
      </ShowcaseBox>

      {/* DataTable — loading */}
      <ShowcaseBox title="data-table — loading" className="mt-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <DataTable
          columns={DATA_TABLE_COLUMNS as any}
          data={[]}
          isLoading
          pagination={{ pageIndex: 0, pageSize: 4 }}
        />
      </ShowcaseBox>

      {/* DataTable — empty */}
      <ShowcaseBox title="data-table — empty" className="mt-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <DataTable
          columns={DATA_TABLE_COLUMNS as any}
          data={[]}
          emptyMessage="Không có đơn hàng nào."
        />
      </ShowcaseBox>
    </>
  );
}
