"use client";

import { Card } from "@workspace/ui/components/card";
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
import {
  TableEmptyRow,
  TableLoadingRows,
  thumbLabelFromName,
  thumbToneFromId,
} from "@/components/admin/shared/data-state";
import { formatVnd } from "@/components/admin/shared/format-vnd";
import { ProductThumb } from "@/components/admin/shared/product-thumb";

export type InventoryValuationItem = {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  categoryName: string;
  onHand: number;
  costPrice: number;
  stockValue: number;
};

export type InventoryValuationTotals = {
  totalValue: number;
  totalQty: number;
};

export type InventoryValuationMetadata = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

interface InventoryValuationTableProps {
  items: InventoryValuationItem[];
  totals: InventoryValuationTotals | null;
  metadata: InventoryValuationMetadata | null;
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  categories: { id: string; name: string }[];
  page: number;
  onPageChange: (page: number) => void;
}

export function InventoryValuationTable({
  items,
  totals,
  metadata,
  isLoading,
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  categories,
  page,
  onPageChange,
}: InventoryValuationTableProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-9 min-w-60 flex-1 items-center gap-2 rounded-lg border border-border bg-white px-3">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" strokeWidth={2} />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm SKU, sản phẩm..."
            className="h-auto border-0 bg-transparent px-0 py-0 shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
          />
        </div>
        <Select value={categoryId} onValueChange={onCategoryChange} className="h-9 w-48">
          <SelectOption value="">Tất cả danh mục</SelectOption>
          {categories.map((c) => (
            <SelectOption key={c.id} value={c.id}>
              {c.name}
            </SelectOption>
          ))}
        </Select>
      </div>

      <Card className="min-w-0 gap-0 overflow-hidden border border-border bg-white p-0 shadow-none">
        <div className="min-w-0 max-w-full overflow-x-auto">
          <Table className="min-w-[1080px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">SKU</TableHead>
                <TableHead className="w-[420px]">Sản phẩm</TableHead>
                <TableHead className="w-[170px]">Danh mục</TableHead>
                <TableHead className="w-[100px] text-right">Tồn kho</TableHead>
                <TableHead className="w-[120px] text-right">Giá nhập</TableHead>
                <TableHead className="w-[140px] text-right">Giá trị tồn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableLoadingRows cols={6} rows={6} />}
              {!isLoading && items.length === 0 && (
                <TableEmptyRow cols={6} message="Không có dữ liệu tồn kho" />
              )}
              {!isLoading &&
                items.map((item) => (
                  <TableRow key={item.variantId}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <span className="block truncate" title={item.sku || undefined}>
                        {item.sku || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <ProductThumb
                          label={thumbLabelFromName(item.productName)}
                          tone={thumbToneFromId(item.variantId)}
                          size={34}
                        />
                        <div className="min-w-0 leading-tight">
                          <span
                            className="block truncate font-semibold text-foreground"
                            title={item.productName}
                          >
                            {item.productName}
                          </span>
                          {item.variantName && item.variantName !== item.productName && (
                            <span
                              className="block truncate text-xs text-muted-foreground"
                              title={item.variantName}
                            >
                              {item.variantName}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="block truncate" title={item.categoryName || undefined}>
                        {item.categoryName || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{item.onHand}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatVnd(item.costPrice)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatVnd(item.stockValue)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
            {totals && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="font-bold">
                    Tổng cộng
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums">
                    {totals.totalQty}
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right font-bold tabular-nums text-slate-900">
                    {formatVnd(totals.totalValue)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-2.5">
          <span className="text-xs text-muted-foreground">
            {isLoading
              ? "Đang tải..."
              : `Hiển thị ${items.length} / ${metadata?.total ?? items.length} SKU`}
          </span>
          {metadata && metadata.totalPages > 1 && (
            <PaginationControls
              currentPage={page}
              totalPages={metadata.totalPages}
              onPageChange={onPageChange}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
