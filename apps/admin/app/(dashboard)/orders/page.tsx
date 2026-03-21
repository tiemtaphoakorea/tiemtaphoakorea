"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminOrderListItem } from "@workspace/database/types/admin";
import { PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency, formatDate } from "@workspace/shared/utils";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { DataTable } from "@workspace/ui/components/data-table";
import { CheckCircle2, Clock, Eye, ShoppingBag, Smartphone, Truck, XCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
// Components
import { OrderHeader } from "@/components/admin/orders/order-header";
import { OrderStats } from "@/components/admin/orders/order-stats";
import { OrderToolbar } from "@/components/admin/orders/order-toolbar";
import { adminClient } from "@/services/admin.client";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: {
    label: "Chờ xử lý",
    color: "bg-amber-50 text-amber-600 border-amber-100",
    icon: Clock,
  },
  paid: {
    label: "Đã thanh toán",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    icon: CheckCircle2,
  },
  preparing: {
    label: "Đang đóng gói",
    color: "bg-blue-50 text-blue-600 border-blue-100",
    icon: ShoppingBag,
  },
  shipping: {
    label: "Đang giao",
    color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    icon: Truck,
  },
  delivered: {
    label: "Đã giao",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-50 text-red-600 border-red-100",
    icon: XCircle,
  },
};

export default function AdminOrders() {
  return (
    <Suspense fallback={<div />}>
      <AdminOrdersContent />
    </Suspense>
  );
}

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const searchTerm = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "All";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(
    1,
    parseInt(searchParams.get("limit") || PAGINATION_DEFAULT.LIMIT.toString(), 10),
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["orders", searchTerm, statusFilter, page, limit],
    queryFn: () =>
      adminClient.getOrders({
        search: searchTerm,
        status: statusFilter !== "All" ? statusFilter : undefined,
        page,
        limit,
      }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const orders = (data?.data as AdminOrderListItem[]) || [];
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

    // Reset to page 1 if filters change
    if (
      (newParams.search !== undefined || newParams.status !== undefined) &&
      newParams.page === undefined
    ) {
      params.set("page", "1");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (val: string) => {
    updateParams({ search: val });
  };

  const handleStatusChange = (val: string) => {
    updateParams({ status: val });
  };

  const { data: statsContent } = useQuery({
    queryKey: ["orders", "stats"],
    queryFn: () => adminClient.getOrderStats(),
    staleTime: 1000 * 60 * 5,
  });

  const stats = useMemo(() => {
    return (
      statsContent || {
        total: metadata?.total || 0,
        pending: 0,
        completed: 0,
        totalRevenue: orders.reduce((acc, curr) => acc + Number(curr.total || 0), 0),
      }
    );
  }, [statsContent, orders, metadata]);

  const columns: ColumnDef<AdminOrderListItem>[] = [
    {
      accessorKey: "orderNumber",
      header: "Mã đơn",
      cell: ({ row }) => (
        <span className="font-black text-slate-900 dark:text-white">
          #{row.original.orderNumber}
        </span>
      ),
    },
    {
      accessorKey: "customer",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-white">
            {row.original.customer?.fullName || "---"}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
            <Smartphone className="h-3 w-3" /> {row.original.customer?.phone || "---"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.original.status || "pending";
        const config = STATUS_CONFIG[status];
        const StatusIcon = config?.icon;
        return (
          <Badge
            className={`${config?.color || ""} pointer-events-none flex w-fit items-center gap-1 border px-2 py-0.5 text-[10px] font-black tracking-tight uppercase shadow-none select-none`}
          >
            {StatusIcon && <StatusIcon className="h-3 w-3" />}
            {config?.label || status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "total",
      header: () => <div className="text-right">Tổng tiền</div>,
      cell: ({ row }) => (
        <div className="text-right font-black text-slate-900 dark:text-white">
          {formatCurrency(row.original.total)}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => <div className="text-center">Ngày tạo</div>,
      cell: ({ row }) => (
        <div className="text-center font-mono text-sm font-medium text-slate-500">
          {formatDate(row.original.createdAt)}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary hover:bg-primary/5 gap-2 px-3 font-bold"
          asChild
        >
          <Link href={ADMIN_ROUTES.ORDER_DETAIL(row.original.id)}>
            <Eye className="h-4 w-4" />
            <span>Xem chi tiết</span>
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <OrderHeader />
      <OrderStats stats={stats} />

      {/* Main Content Area */}
      <Card className="gap-0 py-0 overflow-hidden border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
        <CardHeader className="border-b border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
          <OrderToolbar
            searchTerm={searchTerm}
            onSearchChange={handleSearch}
            statusFilter={statusFilter}
            onStatusChange={handleStatusChange}
            statusConfig={STATUS_CONFIG}
          />
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={orders}
            isLoading={isLoading}
            isFetching={isFetching}
            pageCount={metadata?.totalPages || 1}
            pagination={{
              pageIndex: page - 1,
              pageSize: limit,
            }}
            onPaginationChange={(newPagination) => {
              updateParams({
                page: newPagination.pageIndex + 1,
                limit: newPagination.pageSize,
              });
            }}
            emptyMessage="Không tìm thấy đơn hàng nào."
          />
        </CardContent>
      </Card>
    </div>
  );
}
