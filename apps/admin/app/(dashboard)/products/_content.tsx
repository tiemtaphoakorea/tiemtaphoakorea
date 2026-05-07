"use client";

import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import type { ProductListItem } from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/input-group";
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
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { format } from "date-fns";
import { Plus, Search } from "lucide-react";
import Image from "next/image";
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
import { ProductThumb } from "@/components/admin/shared/product-thumb";
import { TonePill } from "@/components/admin/shared/status-badge";
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
const fmtDate = (d: string | Date | null) => (d ? format(new Date(d), "dd/MM/yyyy, HH:mm") : "—");

const VALID_FILTERS = new Set<ProductFilter>(["all", "in_stock", "low_stock", "out_of_stock"]);

function getProductBrand(product: ProductListItem): string | null {
  const productWithBrand = product as ProductListItem & {
    brand?: string | null;
    brandName?: string | null;
  };

  return productWithBrand.brandName ?? productWithBrand.brand ?? null;
}

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

  const TAB_FILTERS: ProductFilter[] = ["all", "in_stock", "low_stock", "out_of_stock"];
  const countResults = useQueries({
    queries: TAB_FILTERS.map((f) => ({
      queryKey: queryKeys.products.list(debouncedQuery, 1, 1, f),
      queryFn: async () =>
        await adminClient.getProducts({
          search: debouncedQuery || undefined,
          page: 1,
          limit: 1,
          stockStatus: f,
        }),
      staleTime: 60_000,
      select: (data: Awaited<ReturnType<typeof adminClient.getProducts>>) => data.metadata.total,
    })),
  });
  const tabCounts = Object.fromEntries(
    TAB_FILTERS.map((f, i) => [f, countResults[i]?.data ?? null]),
  ) as Record<ProductFilter, number | null>;

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
        <Tabs value={filter} onValueChange={(v) => handleFilterChange(v as ProductFilter)}>
          <TabsList>
            {TABS.map((t) => {
              const count = tabCounts[t.id];
              return (
                <TabsTrigger key={t.id} value={t.id}>
                  {t.label}
                  {count != null && <span className="ml-1 tabular-nums opacity-70">({count})</span>}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
        <InputGroup className="h-9 w-full rounded-lg border-border bg-white sm:w-auto">
          <InputGroupAddon>
            <Search className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={2} />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Tìm tên, mã SP..."
            className="w-full placeholder:text-muted-foreground/60 sm:w-50"
          />
        </InputGroup>
        <Button asChild className="h-9 gap-1.5 sm:ml-auto">
          <Link href="/products/new">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Thêm sản phẩm
          </Link>
        </Button>
      </div>

      <Card className="min-w-0 gap-0 overflow-hidden border border-border p-0 shadow-none">
        <div className="min-w-0 max-w-full overflow-x-auto">
          <Table className="min-w-[980px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[76px]">Ảnh</TableHead>
                <TableHead className="w-[300px]">Tên sản phẩm</TableHead>
                <TableHead className="w-[160px]">Loại</TableHead>
                <TableHead className="w-[140px]">Nhãn hiệu</TableHead>
                <TableHead className="w-[120px]">Có thể bán</TableHead>
                <TableHead className="w-[120px]">Tồn kho</TableHead>
                <TableHead className="w-[120px]">Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsQuery.isLoading && <TableLoadingRows cols={7} rows={6} />}
              {productsQuery.error && (
                <TableErrorRow cols={7} message={String(productsQuery.error)} />
              )}
              {!productsQuery.isLoading && list.length === 0 && (
                <TableEmptyRow cols={7} message="Không tìm thấy sản phẩm" />
              )}
              {list.map((p) => {
                const stockClass =
                  p.totalAvailable === 0
                    ? "text-red-600 font-bold"
                    : p.totalAvailable < (p.minLowStockThreshold ?? 30)
                      ? "text-amber-700 font-bold"
                      : "text-foreground";
                const brand = getProductBrand(p);
                return (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/products/${p.id}/edit`)}
                  >
                    <TableCell className="px-4 py-2.5">
                      {p.thumbnail ? (
                        <Image
                          src={p.thumbnail}
                          alt={p.name}
                          width={44}
                          height={44}
                          className="h-11 w-11 shrink-0 rounded-lg object-contain"
                        />
                      ) : (
                        <ProductThumb
                          label={thumbLabelFromName(p.name)}
                          tone={thumbToneFromId(p.id)}
                          size={44}
                        />
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <span className="block truncate text-sm font-semibold" title={p.name}>
                        {p.name}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      {p.categoryName ? (
                        <TonePill tone="indigo">{p.categoryName}</TonePill>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-sm">
                      {brand ?? <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className={`px-4 py-2.5 tabular-nums ${stockClass}`}>
                      {p.totalAvailable}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 tabular-nums">{p.totalOnHand}</TableCell>
                    <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                      {fmtDate(p.createdAt)}
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
              className="h-8 w-18 text-sm"
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
