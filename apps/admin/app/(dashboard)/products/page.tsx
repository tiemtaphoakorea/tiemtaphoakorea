"use client";

import type { ProductListItem } from "@repo/database/types/admin";
import { PAGINATION_DEFAULT } from "@repo/shared/pagination";
import { formatCurrency } from "@repo/shared/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader } from "@repo/ui/components/card";
import { DataTable } from "@repo/ui/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { useToast } from "@repo/ui/components/use-toast";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckSquare,
  Edit2,
  Image as ImageIcon,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { adminClient } from "@/services/admin.client";

export default function AdminProducts() {
  return (
    <Suspense fallback={<div />}>
      <AdminProductsContent />
    </Suspense>
  );
}

function AdminProductsContent() {
  "use no memo";
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
    // NOTE: does NOT clear bulkError so error banner survives mode exit
  }, []);

  useEffect(() => {
    if (!selectMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) exitSelectMode();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectMode, isDeleting, exitSelectMode]);

  const search = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(
    1,
    parseInt(searchParams.get("limit") || PAGINATION_DEFAULT.LIMIT.toString(), 10),
  );
  const stockStatus = searchParams.get("stockStatus") || "all";
  const updated = searchParams.get("updated") === "1";

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["products", search, page, limit, stockStatus],
    queryFn: () =>
      adminClient.getProducts({
        search,
        page,
        limit,
        stockStatus: stockStatus === "all" ? undefined : stockStatus,
      }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // API đã filter theo search + stockStatus và phân trang (LIMIT/OFFSET).
  // Hiển thị đúng trang hiện tại từ server, không dedupe/lọc lại ở client.
  const products = data?.data || [];
  const metadata = data?.metadata;

  const updateParams = (newParams: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value.toString());
      }
    });

    // Reset to page 1 if search changes
    if (newParams.search !== undefined && newParams.page === undefined) {
      params.set("page", "1");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (val: string) => {
    updateParams({ search: val });
  };

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/products/${id}/edit`);
    },
    [router],
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await adminClient.deleteProduct(deleteTarget.id);
      // Ensure the products table refetches and the deleted item disappears
      await queryClient.invalidateQueries({ queryKey: ["products"], exact: false });
      router.refresh(); // safe no-op for server parts; invalidate handles client data
      setDeleteTarget(null);
    } catch (error: any) {
      console.error(error);
      const message = error?.response?.data?.error ?? "Đã có lỗi xảy ra khi xóa sản phẩm.";
      toast({ title: "Không thể xóa", description: message, variant: "destructive" });
      setDeleteTarget(null);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      const result = await adminClient.bulkDeleteProducts([...selectedIds]);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      router.refresh();
      exitSelectMode();
      if (result.failed.length > 0) {
        setBulkError(
          `Xóa thành công ${result.deleted} sản phẩm. Không thể xóa ${result.failed.length} sản phẩm.`,
        );
      }
      setIsDeleting(false);
    } catch (error) {
      console.error(error);
      setBulkDeleteConfirm(false);
      setBulkError("Đã có lỗi xảy ra khi xóa sản phẩm.");
      setIsDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<ProductListItem>[]>(() => {
    const checkboxColumn: ColumnDef<ProductListItem> = {
      id: "select",
      header: () => {
        const allSelected = products.length > 0 && products.every((p) => selectedIds.has(p.id));
        const someSelected = products.some((p) => selectedIds.has(p.id));
        return (
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected && !allSelected;
            }}
            onChange={(e) => {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (e.target.checked) {
                  products.forEach((p) => next.add(p.id));
                } else {
                  products.forEach((p) => next.delete(p.id));
                }
                return next;
              });
            }}
            aria-label="Chọn tất cả"
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 cursor-pointer accent-primary"
          />
        );
      },
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.original.id)}
          onChange={() => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              if (next.has(row.original.id)) {
                next.delete(row.original.id);
              } else {
                next.add(row.original.id);
              }
              return next;
            });
          }}
          aria-label={`Chọn ${row.original.name}`}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 cursor-pointer accent-primary"
        />
      ),
    };

    const baseColumns: ColumnDef<ProductListItem>[] = [
      {
        accessorKey: "thumbnail",
        header: "Ảnh",
        cell: ({ row }) => (
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
            {row.original.thumbnail ? (
              <Image
                src={row.original.thumbnail}
                alt={row.original.name}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <ImageIcon className="h-5 w-5 text-slate-300" />
            )}
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: "Tên sản phẩm",
        cell: ({ row }) => (
          <span className="flex flex-col">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {row.original.name}
            </span>
            <code className="font-mono text-xs text-slate-400">/{row.original.slug}</code>
            {row.original.skus && (
              <span className="font-mono text-xs text-slate-500">SKU: {row.original.skus}</span>
            )}
          </span>
        ),
      },
      {
        accessorKey: "categoryName",
        header: "Danh mục",
        cell: ({ row }) =>
          row.original.categoryName ? (
            <Badge
              variant="secondary"
              className="bg-slate-100 font-normal text-slate-600 hover:bg-slate-200"
            >
              {row.original.categoryName}
            </Badge>
          ) : (
            <span className="block w-full text-center text-xs text-slate-400 italic">-</span>
          ),
      },
      {
        accessorKey: "price",
        header: "Giá bán",
        cell: ({ row }) => (
          <div className="font-bold text-slate-700 dark:text-slate-200">
            {row.original.minPrice === row.original.maxPrice
              ? formatCurrency(row.original.minPrice)
              : `${formatCurrency(row.original.minPrice)} - ${formatCurrency(row.original.maxPrice)}`}
          </div>
        ),
      },
      {
        accessorKey: "totalStock",
        header: "Tồn kho",
        cell: ({ row }) => {
          const threshold = row.original.minLowStockThreshold ?? 5;
          const isOutOfStock = row.original.totalStock === 0;
          const isLowStock = !isOutOfStock && row.original.totalStock <= threshold;

          return (
            <div className="flex items-center gap-2">
              <span
                className={
                  row.original.totalStock > 0
                    ? "font-bold text-slate-700 dark:text-slate-300"
                    : "font-bold text-red-500"
                }
              >
                {row.original.totalStock}
              </span>
              {isOutOfStock ? (
                <Badge variant="destructive" className="text-[10px] font-bold">
                  Hết hàng
                </Badge>
              ) : isLowStock ? (
                <Badge variant="outline" className="text-[10px] font-bold">
                  Thấp
                </Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Trạng thái",
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? "outline" : "destructive"}
            className="text-[10px] font-black tracking-tight uppercase"
          >
            {row.original.isActive ? "Đang bán" : "Ngừng bán"}
          </Badge>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row.original.id);
              }}
              aria-label="Chỉnh sửa"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Button
                  variant="ghost"
                  className="h-8 w-8 rounded-lg p-0 transition-opacity hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 font-bold">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/products/${row.original.id}/edit`}
                    className="flex cursor-pointer items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit2 className="h-4 w-4 shrink-0" /> Chỉnh sửa
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({
                      id: row.original.id,
                      name: row.original.name,
                    });
                  }}
                  className="cursor-pointer gap-2"
                >
                  <Trash2 />
                  <span>Xóa</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ];

    return selectMode ? [checkboxColumn, ...baseColumns] : baseColumns;
  }, [selectMode, selectedIds, products, handleEdit]);

  return (
    <>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sản phẩm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa sản phẩm <strong>&quot;{deleteTarget?.name}&quot;</strong>? Hành
              động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={bulkDeleteConfirm}
        onOpenChange={(open) => !open && !isDeleting && setBulkDeleteConfirm(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sản phẩm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa <strong>{selectedIds.size} sản phẩm</strong>? Hành động này không
              thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => !isDeleting && setBulkDeleteConfirm(false)}
            >
              Hủy
            </Button>
            {/* Plain Button (not AlertDialogAction) keeps dialog open during async delete */}
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleBulkDeleteConfirm}
              className="gap-2"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Xóa
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Sản phẩm
            </h1>
            <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
              Quản lý danh sách sản phẩm, biến thể và tồn kho.
            </p>
          </div>
          <Button
            asChild
            className="shadow-primary/20 h-11 gap-2 rounded-xl px-6 font-black shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Link href="/products/new">
              <Plus className="h-5 w-5" />
              Thêm sản phẩm
            </Link>
          </Button>
        </div>

        {updated && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-bold text-emerald-700"
          >
            Cập nhật thành công
          </div>
        )}

        {bulkError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-700"
          >
            {bulkError}
          </div>
        )}

        <Card className="gap-0 py-0 overflow-hidden border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-100 bg-white p-6 md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-950">
            <div className="flex w-full flex-col gap-2 md:max-w-md">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm sản phẩm theo tên, mã SKU..."
                  defaultValue={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="h-10 border-none bg-slate-50/50 pl-10 ring-1 ring-slate-200 dark:bg-slate-900/50 dark:ring-slate-800"
                />
              </div>
              {search && (
                <div className="text-xs font-medium text-slate-500">
                  Từ khóa: <span className="font-bold">{search}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectMode ? (
                <>
                  <Badge variant="secondary" className="font-bold">
                    {selectedIds.size} đã chọn
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={selectedIds.size === 0 || isDeleting}
                    onClick={() => setBulkDeleteConfirm(true)}
                    className="gap-2"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Xóa {selectedIds.size} sản phẩm
                  </Button>
                  <Button variant="ghost" size="sm" onClick={exitSelectMode}>
                    Hủy
                  </Button>
                </>
              ) : (
                <>
                  <Select
                    value={stockStatus}
                    onValueChange={(val) => updateParams({ stockStatus: val })}
                  >
                    <SelectTrigger
                      className="h-10 w-full border-none bg-slate-50/50 ring-1 ring-slate-200 md:w-[180px] dark:bg-slate-900/50 dark:ring-slate-800"
                      aria-label="Lọc tồn kho thấp, hết hàng"
                    >
                      <SelectValue placeholder="Lọc tồn kho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="low_stock">Sắp hết</SelectItem>
                      <SelectItem value="out_of_stock">Hết hàng</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectMode(true);
                      setBulkError(null);
                    }}
                    className="gap-2 font-bold"
                  >
                    <CheckSquare className="h-4 w-4" />
                    Chọn
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={products}
              isLoading={isLoading}
              isFetching={isFetching}
              pageCount={metadata?.totalPages || 1}
              pagination={{
                pageIndex: page - 1,
                pageSize: limit,
              }}
              onRowClick={selectMode ? undefined : (row) => handleEdit(row.original.id)}
              onPaginationChange={(newPagination) => {
                if (selectMode) setSelectedIds(new Set());
                updateParams({
                  page: newPagination.pageIndex + 1,
                  limit: newPagination.pageSize,
                });
              }}
              emptyMessage="Không tìm thấy sản phẩm nào."
              headerClassName="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
