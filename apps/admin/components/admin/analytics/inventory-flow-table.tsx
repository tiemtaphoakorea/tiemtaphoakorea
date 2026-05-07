"use client";

import { Card, CardContent } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import { PaginationControls } from "@workspace/ui/components/pagination-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Search } from "lucide-react";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import type { InventoryFlowRow } from "@/services/admin.client";
import type { DateRange } from "./finance-range-picker";
import { FinanceRangePicker } from "./finance-range-picker";

interface InventoryFlowTableProps {
  items: InventoryFlowRow[];
  totals: { totalNhap: number; totalXuat: number; skuCount: number } | null;
  metadata: { total: number; page: number; totalPages: number } | null;
  isLoading: boolean;
  dateRange: DateRange;
  onDateRangeChange: (r: DateRange) => void;
  search: string;
  onSearchChange: (v: string) => void;
  categoryId: string;
  onCategoryChange: (v: string) => void;
  categories: { id: string; name: string }[];
  page: number;
  onPageChange: (p: number) => void;
}

export function InventoryFlowTable({
  items,
  totals,
  metadata,
  isLoading,
  dateRange,
  onDateRangeChange,
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  categories,
  page,
  onPageChange,
}: InventoryFlowTableProps) {
  return (
    <Card className="border-none shadow-sm ring-1 ring-slate-200">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">
            Xuất nhập tồn
          </h2>
          <FinanceRangePicker value={dateRange} onChange={onDateRangeChange} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-white px-3">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" strokeWidth={2} />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm sản phẩm, SKU..."
              className="h-auto w-full border-0 bg-transparent px-0 py-0 shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
            />
          </div>
          <Select
            value={categoryId}
            onValueChange={onCategoryChange}
            className="h-9 w-full rounded-lg text-sm sm:w-44"
          >
            <SelectOption value="">Tất cả danh mục</SelectOption>
            {categories.map((c) => (
              <SelectOption key={c.id} value={c.id}>
                {c.name}
              </SelectOption>
            ))}
          </Select>
        </div>

        <div className="overflow-x-auto rounded-lg ring-1 ring-slate-100">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="text-right">Tồn đầu</TableHead>
                <TableHead className="text-right">Nhập</TableHead>
                <TableHead className="text-right">Xuất</TableHead>
                <TableHead className="text-right">Tồn cuối</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableLoadingRows cols={6} rows={8} />}
              {!isLoading && items.length === 0 && (
                <TableEmptyRow cols={6} message="Không có dữ liệu trong kỳ này" />
              )}
              {!isLoading &&
                items.map((row) => {
                  const closingStock = Number(row.tonCuoi);
                  const closingStockClass =
                    closingStock === 0
                      ? "text-red-600 font-bold"
                      : closingStock < 10
                        ? "text-amber-600 font-bold"
                        : "font-bold";
                  return (
                    <TableRow key={row.variantId}>
                      <TableCell className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                        {row.sku ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5">
                        <div className="flex flex-col leading-tight">
                          <span className="text-sm font-medium">{row.productName ?? "—"}</span>
                          {row.variantName && (
                            <span className="text-xs text-muted-foreground">{row.variantName}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right tabular-nums">
                        {Number(row.tonDau).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right tabular-nums">
                        {Number(row.nhap) > 0 ? (
                          <span className="font-semibold text-emerald-600">
                            +{Number(row.nhap).toLocaleString("vi-VN")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right tabular-nums">
                        {Number(row.xuat) > 0 ? (
                          <span className="font-semibold text-red-500">
                            -{Number(row.xuat).toLocaleString("vi-VN")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell
                        className={`px-4 py-2.5 text-right tabular-nums ${closingStockClass}`}
                      >
                        {closingStock.toLocaleString("vi-VN")}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
            {totals && !isLoading && items.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="px-4 py-2.5 font-semibold text-muted-foreground"
                  >
                    Tổng ({totals.skuCount} SKU)
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-bold tabular-nums text-emerald-600">
                    +{totals.totalNhap.toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-right font-bold tabular-nums text-red-500">
                    -{totals.totalXuat.toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
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
