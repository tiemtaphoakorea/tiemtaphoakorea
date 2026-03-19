"use client";

import { PAGINATION_DEFAULT } from "@repo/shared/pagination";
import { formatCurrency } from "@repo/shared/utils";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader } from "@repo/ui/components/card";
import { DataTable } from "@repo/ui/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { useToast } from "@repo/ui/components/use-toast";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Plus, Search, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ExpenseAddSheet } from "@/components/admin/expense-add-sheet";
import { adminClient } from "@/services/admin.client";

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div />}>
      <ExpensesPageContent />
    </Suspense>
  );
}

function ExpensesPageContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  const type = (searchParams.get("type") as "fixed" | "variable" | null) || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(
    1,
    parseInt(searchParams.get("limit") || String(PAGINATION_DEFAULT.LIMIT), 10),
  );

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "expenses", type, page, limit],
    queryFn: () =>
      adminClient.getExpenses({
        type: type || undefined,
        page,
        limit,
      }),
    placeholderData: keepPreviousData,
  });

  const expenses = data?.data || [];
  const metadata = data?.metadata;

  const updateParams = (newParams: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    if (newParams.type !== undefined && newParams.page === undefined) {
      params.set("page", "1");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => adminClient.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "finance"] });
      setIsAddSheetOpen(false);
      toast({ title: "Thành công", description: "Đã thêm chi phí thành công" });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể thêm chi phí. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminClient.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "finance"] });
      toast({ title: "Thành công", description: "Đã xóa chi phí" });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa chi phí.",
        variant: "destructive",
      });
    },
  });

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Ngày ghi nhận",
        cell: ({ row }) => (
          <span className="font-medium text-slate-500">
            {new Date(row.original.date).toLocaleDateString("vi-VN")}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "Nội dung chi phí",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="line-clamp-1 font-bold text-slate-900 dark:text-white">
              {row.original.description}
            </span>
            <span className="text-muted-foreground text-[10px] font-medium tracking-tight uppercase">
              Người tạo: {row.original.creator?.fullName || "Admin"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Loại",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={`rounded-md text-[10px] font-bold uppercase ${
              row.original.type === "fixed"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
            }`}
          >
            {row.original.type === "fixed" ? "Cố định" : "Biến đổi"}
          </Badge>
        ),
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Số tiền</div>,
        cell: ({ row }) => (
          <div className="text-right font-black text-slate-900 dark:text-white">
            {formatCurrency(parseFloat(row.original.amount))}
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 rounded-lg p-0 group-hover:bg-white dark:group-hover:bg-slate-800"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl p-2">
                <DropdownMenuItem
                  className="cursor-pointer rounded-lg font-bold text-red-500 focus:text-red-500"
                  onClick={() => {
                    if (confirm("Bạn có chắc chắn muốn xóa chi phí này?")) {
                      deleteMutation.mutate(row.original.id);
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Xóa chi phí
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [deleteMutation],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Quản lý chi phí</h1>
          <p className="text-muted-foreground font-medium">
            Theo dõi các khoản chi phí vận hành của cửa hàng.
          </p>
        </div>

        <Button
          onClick={() => setIsAddSheetOpen(true)}
          className="shadow-primary/20 h-11 gap-2 rounded-xl font-black shadow-lg"
        >
          <Plus className="h-5 w-5" />
          Ghi nhận chi phí
        </Button>
      </div>

      <Card className="gap-0 py-0 overflow-hidden border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="border-b border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <Button
                variant={type === "" ? "default" : "outline"}
                size="sm"
                onClick={() => updateParams({ type: "" })}
                className="rounded-lg font-bold"
              >
                Tất cả
              </Button>
              <Button
                variant={type === "fixed" ? "default" : "outline"}
                size="sm"
                onClick={() => updateParams({ type: "fixed" })}
                className="rounded-lg font-bold"
              >
                Cố định
              </Button>
              <Button
                variant={type === "variable" ? "default" : "outline"}
                size="sm"
                onClick={() => updateParams({ type: "variable" })}
                className="rounded-lg font-bold"
              >
                Biến đổi
              </Button>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm nội dung chi..."
                className="h-10 rounded-xl border-slate-200 pl-9 dark:border-slate-800"
                readOnly
                aria-label="Tìm kiếm (xử lý ở backend khi có API)"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={expenses}
            isLoading={isLoading}
            pageCount={metadata?.totalPages ?? 1}
            pagination={{
              pageIndex: page - 1,
              pageSize: limit,
            }}
            onPaginationChange={(p) =>
              updateParams({
                page: p.pageIndex + 1,
                limit: p.pageSize,
              })
            }
            emptyMessage="Chưa có khoản chi phí nào được ghi nhận."
          />
        </CardContent>
      </Card>

      <ExpenseAddSheet
        isOpen={isAddSheetOpen}
        onOpenChange={setIsAddSheetOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
