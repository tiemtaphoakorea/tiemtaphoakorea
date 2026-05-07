"use client";

import { Card, CardContent } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import { PaginationControls } from "@workspace/ui/components/pagination-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { type BadgeTone, TonePill } from "@/components/admin/shared/status-badge";
import type { InventoryMovement } from "@/services/admin.client";
import type { DateRange } from "./finance-range-picker";
import { FinanceRangePicker } from "./finance-range-picker";

const TYPE_LABELS: Record<string, { label: string; tone: BadgeTone }> = {
  stock_out: { label: "Xuất bán", tone: "red" },
  supplier_receipt: { label: "Nhập hàng", tone: "green" },
  manual_adjustment: { label: "Điều chỉnh", tone: "amber" },
  cancellation: { label: "Hủy đơn", tone: "gray" },
  stock_count_balance: { label: "Kiểm kho", tone: "blue" },
  cost_adjustment: { label: "Điều chỉnh giá vốn", tone: "gray" },
};

const MOVEMENT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Tất cả loại" },
  { value: "stock_out", label: "Xuất bán" },
  { value: "supplier_receipt", label: "Nhập hàng" },
  { value: "manual_adjustment", label: "Điều chỉnh" },
  { value: "cancellation", label: "Hủy đơn" },
  { value: "stock_count_balance", label: "Kiểm kho" },
  { value: "cost_adjustment", label: "Điều chỉnh giá vốn" },
];

interface InventoryMovementLogProps {
  data: InventoryMovement[];
  metadata: { total: number; page: number; totalPages: number } | null;
  isLoading: boolean;
  dateRange: DateRange;
  onDateRangeChange: (r: DateRange) => void;
  movementType: string;
  onMovementTypeChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  page: number;
  onPageChange: (p: number) => void;
}

export function InventoryMovementLog({
  data,
  metadata,
  isLoading,
  dateRange,
  onDateRangeChange,
  movementType,
  onMovementTypeChange,
  search,
  onSearchChange,
  page,
  onPageChange,
}: InventoryMovementLogProps) {
  return (
    <Card className="border-none shadow-sm ring-1 ring-slate-200">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">
            Lịch sử biến động kho
          </h2>
          <FinanceRangePicker value={dateRange} onChange={onDateRangeChange} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-white px-3">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" strokeWidth={2} />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm SKU..."
              className="h-auto w-full border-0 bg-transparent px-0 py-0 shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
            />
          </div>
          <Select
            value={movementType}
            onValueChange={onMovementTypeChange}
            className="h-9 w-full rounded-lg text-sm sm:w-48"
          >
            {MOVEMENT_TYPE_OPTIONS.map((o) => (
              <SelectOption key={o.value} value={o.value}>
                {o.label}
              </SelectOption>
            ))}
          </Select>
        </div>

        <div className="overflow-x-auto rounded-lg ring-1 ring-slate-100">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className="text-right">Nhập</TableHead>
                <TableHead className="text-right">Xuất</TableHead>
                <TableHead className="text-right">Trước</TableHead>
                <TableHead className="text-right">Sau</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead>NV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableLoadingRows cols={9} rows={8} />}
              {!isLoading && data.length === 0 && (
                <TableEmptyRow cols={9} message="Không có biến động trong khoảng thời gian này" />
              )}
              {!isLoading &&
                data.map((row) => {
                  const isIn = row.quantity > 0;
                  const typeMeta = TYPE_LABELS[row.type] ?? {
                    label: row.type,
                    tone: "gray" as const satisfies BadgeTone,
                  };
                  const dateStr = row.createdAt
                    ? format(new Date(row.createdAt), "dd/MM HH:mm")
                    : "—";
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {dateStr}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                        {row.variantSku ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5">
                        <TonePill tone={typeMeta.tone}>{typeMeta.label}</TonePill>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right tabular-nums">
                        {isIn ? (
                          <span className="font-semibold text-emerald-600">
                            +{row.quantity.toLocaleString("vi-VN")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right tabular-nums">
                        {!isIn ? (
                          <span className="font-semibold text-red-500">
                            {Math.abs(row.quantity).toLocaleString("vi-VN")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right tabular-nums text-sm">
                        {row.onHandBefore.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right tabular-nums text-sm font-semibold">
                        {row.onHandAfter.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="max-w-40 truncate px-4 py-2.5 text-xs text-muted-foreground">
                        {row.note ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                        {row.createdByName ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>

        {metadata && metadata.totalPages > 1 && (
          <div className="flex justify-center">
            <PaginationControls
              currentPage={page}
              totalPages={metadata.totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
