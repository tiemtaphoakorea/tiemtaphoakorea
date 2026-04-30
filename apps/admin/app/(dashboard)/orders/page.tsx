"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminOrderListItem } from "@workspace/database/types/admin";
import type { FulfillmentStatusValue, PaymentStatusValue } from "@workspace/shared/constants";
import { PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency, formatDate } from "@workspace/shared/utils";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { DataTable } from "@workspace/ui/components/data-table";
import { Eye, Smartphone } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
// Components
import { OrderHeader } from "@/components/admin/orders/order-header";
import { OrderStats } from "@/components/admin/orders/order-stats";
import { OrderToolbar } from "@/components/admin/orders/order-toolbar";
import { FULFILLMENT_BADGE, PAYMENT_BADGE } from "@/lib/order-badges";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

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

  const urlSearchTerm = searchParams.get("search") || "";
  const paymentStatusFilter = searchParams.get("paymentStatus") || "All";
  const fulfillmentStatusFilter = searchParams.get("fulfillmentStatus") || "All";
  const debtOnly = searchParams.get("debtOnly") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(
    1,
    parseInt(searchParams.get("limit") || PAGINATION_DEFAULT.LIMIT.toString(), 10),
  );

  // Local search state with debounce so URL updates after user pauses typing.
  const [searchInput, setSearchInput] = useState(urlSearchTerm);
  const [debouncedSearch] = useDebounce(searchInput, 300);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  // Keep local input in sync if URL changes from elsewhere (e.g. back button).
  useEffect(() => {
    setSearchInput(urlSearchTerm);
  }, [urlSearchTerm]);

  // Push debounced search to URL.
  // biome-ignore lint/correctness/useExhaustiveDependencies: updateParams is recreated each render
  useEffect(() => {
    if (debouncedSearch === urlSearchTerm) return;
    updateParams({ search: debouncedSearch || null, page: 1 });
  }, [debouncedSearch, urlSearchTerm]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: these are reactive triggers to clear selection when the result set changes
  useEffect(() => {
    setSelectedIds([]);
  }, [page, paymentStatusFilter, fulfillmentStatusFilter, debtOnly, debouncedSearch]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.orders.list(
      debouncedSearch,
      paymentStatusFilter,
      fulfillmentStatusFilter,
      debtOnly,
      page,
      limit,
    ),
    queryFn: () =>
      adminClient.getOrders({
        search: debouncedSearch,
        paymentStatus:
          paymentStatusFilter !== "All" ? (paymentStatusFilter as PaymentStatusValue) : undefined,
        fulfillmentStatus:
          fulfillmentStatusFilter !== "All"
            ? (fulfillmentStatusFilter as FulfillmentStatusValue)
            : undefined,
        debtOnly: debtOnly || undefined,
        page,
        limit,
      }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const orders = (data?.data as AdminOrderListItem[]) || [];
  const metadata = data?.metadata;

  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(checked ? orders.map((o) => o.id) : []);
    },
    [orders],
  );

  const updateParams = (newParams: Record<string, string | number | boolean | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "" || value === false) {
        params.delete(key);
      } else {
        params.set(key, value.toString());
      }
    });

    // Reset to page 1 if filters change
    if (
      (newParams.search !== undefined ||
        newParams.paymentStatus !== undefined ||
        newParams.fulfillmentStatus !== undefined ||
        newParams.debtOnly !== undefined) &&
      newParams.page === undefined
    ) {
      params.set("page", "1");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (val: string) => {
    setSearchInput(val);
  };

  const handlePaymentStatusChange = (val: string) => {
    updateParams({ paymentStatus: val === "All" ? null : val });
  };

  const handleFulfillmentStatusChange = (val: string) => {
    updateParams({ fulfillmentStatus: val === "All" ? null : val });
  };

  const handleDebtOnlyToggle = () => {
    updateParams({ debtOnly: !debtOnly });
  };

  const { data: statsContent } = useQuery({
    queryKey: queryKeys.orders.stats,
    queryFn: () => adminClient.getOrderStats(),
    staleTime: 1000 * 60 * 5,
  });

  const stats = useMemo(() => {
    return (
      statsContent || {
        total: metadata?.total || 0,
        pending: undefined,
        completed: undefined,
        totalRevenue: orders.reduce((acc, curr) => acc + Number(curr.total || 0), 0),
      }
    );
  }, [statsContent, orders, metadata]);

  const columns = useMemo<ColumnDef<AdminOrderListItem>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <input
            type="checkbox"
            checked={orders.length > 0 && orders.every((o) => selectedIds.includes(o.id))}
            ref={(el) => {
              if (el) {
                const some = orders.some((o) => selectedIds.includes(o.id));
                const all = orders.length > 0 && orders.every((o) => selectedIds.includes(o.id));
                el.indeterminate = some && !all;
              }
            }}
            onChange={(e) => toggleSelectAll(e.target.checked)}
            aria-label="Chọn tất cả"
            className="h-4 w-4 cursor-pointer accent-primary"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedIds.includes(row.original.id)}
            onChange={() => toggleSelect(row.original.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Chọn đơn ${row.original.orderNumber}`}
            className="h-4 w-4 cursor-pointer accent-primary"
          />
        ),
      },
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
        id: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const payment = row.original.paymentStatus as PaymentStatusValue;
          const fulfillment = row.original.fulfillmentStatus as FulfillmentStatusValue;
          const paymentCfg = PAYMENT_BADGE[payment];
          const fulfillmentCfg = FULFILLMENT_BADGE[fulfillment];
          return (
            <div className="flex flex-col gap-1">
              <Badge
                className={`${paymentCfg?.className || ""} pointer-events-none w-fit border px-2 py-0.5 text-[10px] font-black tracking-tight uppercase shadow-none select-none`}
              >
                {paymentCfg?.label || payment}
              </Badge>
              <Badge
                className={`${fulfillmentCfg?.className || ""} pointer-events-none w-fit border px-2 py-0.5 text-[10px] font-black tracking-tight uppercase shadow-none select-none`}
              >
                {fulfillmentCfg?.label || fulfillment}
              </Badge>
            </div>
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
    ],
    [orders, selectedIds, toggleSelect, toggleSelectAll],
  );

  const selectedOrders = orders.filter((o) => selectedIds.includes(o.id));

  return (
    <div className="flex flex-col gap-8">
      <OrderHeader />
      <OrderStats stats={stats} />

      {/* Main Content Area */}
      <Card className="gap-0 py-0 overflow-hidden border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
        <CardHeader className="border-b border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
          <OrderToolbar
            searchTerm={searchInput}
            onSearchChange={handleSearch}
            paymentStatus={paymentStatusFilter}
            onPaymentStatusChange={handlePaymentStatusChange}
            fulfillmentStatus={fulfillmentStatusFilter}
            onFulfillmentStatusChange={handleFulfillmentStatusChange}
            debtOnly={debtOnly}
            onDebtOnlyToggle={handleDebtOnlyToggle}
            paymentBadge={PAYMENT_BADGE}
            fulfillmentBadge={FULFILLMENT_BADGE}
            selectedOrders={selectedOrders}
            onQuickPaymentSuccess={() => setSelectedIds([])}
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
