"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit2, Image as ImageIcon, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGINATION_DEFAULT } from "@/lib/pagination";
import { formatCurrency } from "@/lib/utils";
import { adminClient } from "@/services/admin.client";
import type { ProductListItem } from "@/types/admin";

export default function AdminProducts() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

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

  const handleEdit = (id: string) => {
    router.push(`/products/${id}/edit`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa sản phẩm "${name}"? Hành động này không thể hoàn tác.`)) {
      try {
        await adminClient.deleteProduct(id);
        // React Query's invalidate would be better here, but router.refresh() or local refetch also works
        // For simplicity with server component state sync, we'll just refresh or re-fetch
        router.refresh();
      } catch (error) {
        alert("Xóa sản phẩm thất bại");
        console.error(error);
      }
    }
  };

  const columns: ColumnDef<ProductListItem>[] = [
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
        <Link href={`/products/${row.original.id}/edit`} className="flex flex-col">
          <span className="font-bold text-slate-700 dark:text-slate-200">{row.original.name}</span>
          <code className="font-mono text-xs text-slate-400">/{row.original.slug}</code>
          {row.original.skus && (
            <span className="font-mono text-xs text-slate-500">SKU: {row.original.skus}</span>
          )}
        </Link>
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
            onClick={() => handleEdit(row.original.id)}
            aria-label="Chỉnh sửa"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
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
                >
                  <Edit2 className="h-4 w-4 shrink-0" /> Chỉnh sửa
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => handleDelete(row.original.id, row.original.name)}
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

  return (
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
            <Select value={stockStatus} onValueChange={(val) => updateParams({ stockStatus: val })}>
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
            onRowClick={(row) => handleEdit(row.original.id)}
            onPaginationChange={(newPagination) => {
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
  );
}
