"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ProductListItem } from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
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
import { AlertTriangle, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
  thumbLabelFromName,
  thumbToneFromId,
} from "@/components/admin/shared/data-state";
import { FilterTabs } from "@/components/admin/shared/filter-tabs";
import { formatVnd } from "@/components/admin/shared/format-vnd";
import { ProductThumb } from "@/components/admin/shared/product-thumb";
import { StatusBadge, type StatusType, TonePill } from "@/components/admin/shared/status-badge";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type ProductFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

const TABS: ReadonlyArray<{ id: ProductFilter; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "in_stock", label: "Còn hàng" },
  { id: "low_stock", label: "Sắp hết" },
  { id: "out_of_stock", label: "Hết hàng" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;

/** Pick StatusBadge type from product flags. */
function deriveProductStatus(p: ProductListItem): StatusType {
  if (p.isActive === false) return "draft";
  if (p.totalAvailable <= 0) return "outstock";
  return "active";
}

const VALID_FILTERS = new Set<ProductFilter>(["all", "in_stock", "low_stock", "out_of_stock"]);

export default function AdminProducts() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter") as ProductFilter | null;
  const initialFilter = urlFilter && VALID_FILTERS.has(urlFilter) ? urlFilter : "all";
  const [filter, setFilter] = useState<ProductFilter>(initialFilter);
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const productsQuery = useQuery({
    queryKey: queryKeys.products.list(debouncedQuery, page, pageSize, filter),
    queryFn: async () =>
      await adminClient.getProducts({
        search: debouncedQuery || undefined,
        page,
        limit: pageSize,
        stockStatus: filter,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const list = productsQuery.data?.data ?? [];
  const total = productsQuery.data?.metadata.total ?? 0;
  const totalPages = productsQuery.data?.metadata.totalPages ?? 1;

  const handleFilterChange = (next: ProductFilter) => {
    setFilter(next);
    setPage(1);
  };
  const handleQueryChange = (next: string) => {
    setQuery(next);
    setPage(1);
  };
  const handlePageSizeChange = (next: number) => {
    setPageSize(next);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <FilterTabs tabs={TABS} value={filter} onChange={handleFilterChange} />
        <div className="flex h-[34px] items-center gap-2 rounded-lg border border-border bg-white px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={2} />
          <Input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Tìm tên, mã SP..."
            className="h-auto w-full border-0 bg-transparent px-0 py-0 shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 sm:w-[200px]"
          />
        </div>
        <Button asChild className="h-[34px] gap-1.5 sm:ml-auto">
          <Link href="/products/new">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Thêm sản phẩm
          </Link>
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {["Sản phẩm", "Danh mục", "Giá bán", "Tồn kho", "Trạng thái", ""].map((h, i) => (
                  <TableHead
                    key={i}
                    className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsQuery.isLoading && <TableLoadingRows cols={6} rows={6} />}
              {productsQuery.error && (
                <TableErrorRow cols={6} message={String(productsQuery.error)} />
              )}
              {!productsQuery.isLoading && list.length === 0 && (
                <TableEmptyRow cols={6} message="Không tìm thấy sản phẩm" />
              )}
              {list.map((p) => {
                const stockClass =
                  p.totalAvailable === 0
                    ? "text-red-600 font-bold"
                    : p.totalAvailable < (p.minLowStockThreshold ?? 30)
                      ? "text-amber-700 font-bold"
                      : "text-foreground";
                const status = deriveProductStatus(p);
                return (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/products/${p.id}/edit`)}
                  >
                    <TableCell className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {p.thumbnail ? (
                          // biome-ignore lint/performance/noImgElement: thumbnails are CMS-managed external URLs
                          <img
                            src={p.thumbnail}
                            alt={p.name}
                            className="h-[34px] w-[34px] shrink-0 rounded-lg object-contain"
                          />
                        ) : (
                          <ProductThumb
                            label={thumbLabelFromName(p.name)}
                            tone={thumbToneFromId(p.id)}
                          />
                        )}
                        <div className="flex max-w-[260px] flex-col leading-tight md:max-w-[320px] lg:max-w-[420px]">
                          <span className="truncate text-[13px] font-semibold" title={p.name}>
                            {p.name}
                          </span>
                          <span
                            className="truncate font-mono text-[11px] text-muted-foreground"
                            title={p.skus ?? p.slug ?? undefined}
                          >
                            {p.skus ?? p.slug}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      {p.categoryName ? (
                        <TonePill tone="indigo">{p.categoryName}</TonePill>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 font-bold tabular-nums">
                      {p.maxPrice === 0 ? (
                        <span
                          className="flex items-center gap-1 text-amber-600"
                          title="Sản phẩm chưa có giá bán — ảnh hưởng đến báo cáo lợi nhuận"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          0đ
                        </span>
                      ) : (
                        <span className="text-red-600">
                          {p.minPrice === p.maxPrice
                            ? formatVnd(p.minPrice)
                            : `${formatVnd(p.minPrice)} – ${formatVnd(p.maxPrice)}`}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={`px-4 py-2.5 tabular-nums ${stockClass}`}>
                      {p.totalAvailable}
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <StatusBadge type={status} />
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-md text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/products/${p.id}/edit`}>Sửa</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Hiển thị</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => handlePageSizeChange(Number(v))}
              className="h-8 w-[72px] text-[13px]"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectOption key={size} value={String(size)}>
                  {size}
                </SelectOption>
              ))}
            </Select>
            <span>
              / trang ·{" "}
              {productsQuery.isLoading && total === 0 ? "Đang tải..." : `Tổng ${total} sản phẩm`}
            </span>
          </div>
          <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>
    </div>
  );
}
