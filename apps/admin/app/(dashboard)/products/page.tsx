"use client";

import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ProductListItem } from "@workspace/database/types/admin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
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
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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
  const p = product as ProductListItem & { brand?: string | null; brandName?: string | null };
  return p.brandName ?? p.brand ?? null;
}

export default function AdminProducts() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter") as ProductFilter | null;
  const initialFilter = urlFilter && VALID_FILTERS.has(urlFilter) ? urlFilter : "all";

  const [filter, setFilter] = useState<ProductFilter>(initialFilter);
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // --- Queries ---
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

  // --- Selection derived state ---
  const pageIds = list.map((p) => p.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id)) && !allPageSelected;

  // --- Mutations ---
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminClient.deleteProduct(id),
    onSuccess: () => {
      toast.success("Đã xóa sản phẩm.");
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error ?? "Xóa sản phẩm thất bại.");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => adminClient.bulkDeleteProducts(ids),
    onSuccess: (result) => {
      toast.success(`Đã xóa ${result.deleted} sản phẩm.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
    },
    onError: () => {
      toast.error("Xóa hàng loạt thất bại.");
    },
  });

  const selectedIdsArray = [...selectedIds].sort();
  const checkDeletableQuery = useQuery({
    queryKey: ["products", "check-deletable", selectedIdsArray],
    queryFn: () => adminClient.checkProductsDeletable(selectedIdsArray),
    enabled: bulkDeleteOpen && selectedIdsArray.length > 0,
    staleTime: 0,
  });

  // --- Handlers ---
  const clearSelection = () => setSelectedIds(new Set());

  const handleFilterChange = (next: ProductFilter) => {
    setFilter(next);
    setPage(1);
    clearSelection();
  };
  const handleQueryChange = (next: string) => {
    setQuery(next);
    setPage(1);
    clearSelection();
  };
  const handlePageSizeChange = (next: number) => {
    setPageSize(next);
    setPage(1);
    clearSelection();
  };
  const handlePageChange = (next: number) => {
    setPage(next);
    clearSelection();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => new Set([...prev, ...pageIds]));
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
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

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-2.5">
          <span className="text-sm text-muted-foreground">
            Đã chọn <span className="font-semibold text-foreground">{selectedCount}</span> sản phẩm
          </span>
          <Button
            variant="destructive"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xóa {selectedCount} sản phẩm
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Bỏ chọn
          </Button>
        </div>
      )}

      <Card className="min-w-0 gap-0 overflow-hidden border border-border p-0 shadow-none">
        <div className="min-w-0 max-w-full overflow-x-auto">
          <Table className="min-w-[1020px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[44px] px-3 text-center">
                  <Checkbox
                    checked={allPageSelected || (somePageSelected ? "indeterminate" : false)}
                    onCheckedChange={(v) => handleSelectAll(!!v)}
                    aria-label="Chọn tất cả"
                  />
                </TableHead>
                <TableHead className="w-[72px]">Ảnh</TableHead>
                <TableHead className="w-[280px]">Tên sản phẩm</TableHead>
                <TableHead className="w-[160px]">Loại</TableHead>
                <TableHead className="w-[130px]">Nhãn hiệu</TableHead>
                <TableHead className="w-[110px]">Có thể bán</TableHead>
                <TableHead className="w-[110px]">Tồn kho</TableHead>
                <TableHead className="w-[120px]">Ngày tạo</TableHead>
                <TableHead className="w-[52px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsQuery.isLoading && <TableLoadingRows cols={9} rows={6} />}
              {productsQuery.error && (
                <TableErrorRow cols={9} message={String(productsQuery.error)} />
              )}
              {!productsQuery.isLoading && list.length === 0 && (
                <TableEmptyRow cols={9} message="Không tìm thấy sản phẩm" />
              )}
              {list.map((p) => {
                const stockClass =
                  p.totalAvailable === 0
                    ? "text-red-600 font-bold"
                    : p.totalAvailable < (p.minLowStockThreshold ?? 30)
                      ? "text-amber-700 font-bold"
                      : "text-foreground";
                const brand = getProductBrand(p);
                const isSelected = selectedIds.has(p.id);
                return (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    data-selected={isSelected || undefined}
                    onClick={() => router.push(`/products/${p.id}/edit`)}
                  >
                    <TableCell
                      className="px-3 py-2.5 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(v) => handleSelectOne(p.id, !!v)}
                        aria-label={`Chọn ${p.name}`}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      {p.thumbnail ? (
                        <Image
                          src={p.thumbnail}
                          alt={p.name}
                          width={44}
                          height={44}
                          className="h-11 w-11 shrink-0 rounded-lg object-contain"
                          sizes="44px"
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
                    <TableCell
                      className="px-2 py-2.5 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/products/${p.id}/edit`)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </Card>

      {/* Single delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
            <AlertDialogDescription>
              Sản phẩm <span className="font-semibold">{deleteTarget?.name}</span> sẽ bị xóa vĩnh
              viễn. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa {selectedCount} sản phẩm?</AlertDialogTitle>
            {checkDeletableQuery.isLoading ? (
              <AlertDialogDescription>Đang kiểm tra...</AlertDialogDescription>
            ) : checkDeletableQuery.data?.cannotDelete?.length ? (
              <>
                <AlertDialogDescription>
                  {checkDeletableQuery.data.cannotDelete.length} sản phẩm dưới đây đã có đơn hàng và
                  không thể xóa. Bỏ chọn chúng để tiếp tục.
                </AlertDialogDescription>
                <ul className="mt-3 max-h-48 divide-y divide-border overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5">
                  {checkDeletableQuery.data.cannotDelete.map((p) => (
                    <li key={p.id} className="px-3 py-2 text-sm leading-snug text-destructive">
                      {p.name}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <AlertDialogDescription>
                {selectedCount} sản phẩm đã chọn sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn
                tác.
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => bulkDeleteMutation.mutate(selectedIdsArray)}
              disabled={
                bulkDeleteMutation.isPending ||
                checkDeletableQuery.isLoading ||
                (checkDeletableQuery.data?.cannotDelete?.length ?? 0) > 0
              }
            >
              Xóa {selectedCount} sản phẩm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
