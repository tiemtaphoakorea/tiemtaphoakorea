"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { formatVnd } from "@/components/admin/shared/format-vnd";

export type SupplierDebtRow = {
  supplierId: string;
  supplierName: string;
  totalReceipts: number;
  totalPayable: number;
  totalPaid: number;
  totalDebt: number;
};

interface SupplierDebtsTableProps {
  items: SupplierDebtRow[];
  isLoading: boolean;
}

export function SupplierDebtsTable({ items, isLoading }: SupplierDebtsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nhà cung cấp</TableHead>
            <TableHead className="text-right">Số phiếu nhập</TableHead>
            <TableHead className="text-right">Tổng phải trả</TableHead>
            <TableHead className="text-right">Đã trả</TableHead>
            <TableHead className="text-right">Còn nợ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableLoadingRows cols={5} rows={5} />}
          {!isLoading && items.length === 0 && (
            <TableEmptyRow cols={5} message="Không có dữ liệu công nợ" />
          )}
          {!isLoading &&
            items.map((row) => (
              <TableRow key={row.supplierId}>
                <TableCell className="font-semibold text-slate-900">{row.supplierName}</TableCell>
                <TableCell className="text-right tabular-nums">{row.totalReceipts}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatVnd(row.totalPayable)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-emerald-600">
                  {formatVnd(row.totalPaid)}
                </TableCell>
                <TableCell className="text-right font-bold tabular-nums text-red-600">
                  {formatVnd(row.totalDebt)}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
