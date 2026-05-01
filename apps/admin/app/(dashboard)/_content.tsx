"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  DashboardKPIs,
  DashboardRecentOrder,
  DashboardTopProduct,
} from "@workspace/database/types/admin";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { AlertTriangle, Bell, Box, ShoppingCart, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { BarChartMini } from "@/components/admin/shared/bar-chart-mini";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
  thumbLabelFromName,
  thumbToneFromId,
} from "@/components/admin/shared/data-state";
import { formatVnd } from "@/components/admin/shared/mock-data";
import { ProductThumb } from "@/components/admin/shared/product-thumb";
import { StatCard } from "@/components/admin/shared/stat-card";
import { StatusBadge, type StatusType, TonePill } from "@/components/admin/shared/status-badge";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

// 7-day series — kept as static placeholder until backend exposes time-series endpoint.
const REVENUE_DATA = [
  { l: "T2", v: 42 },
  { l: "T3", v: 68 },
  { l: "T4", v: 55 },
  { l: "T5", v: 80 },
  { l: "T6", v: 72 },
  { l: "T7", v: 95 },
  { l: "CN", v: 110 },
];
const ORDERS_DATA = [
  { l: "T2", v: 18 },
  { l: "T3", v: 31 },
  { l: "T4", v: 24 },
  { l: "T5", v: 37 },
  { l: "T6", v: 29 },
  { l: "T7", v: 44 },
  { l: "CN", v: 52 },
];

/** Convert backend fulfillment_status to UI StatusBadge type. */
const orderStatusType = (status: string): StatusType => {
  switch (status) {
    case "pending":
      return "pending";
    case "stock_out":
      return "stock_out";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
};

export default function AdminDashboard() {
  const kpisQuery = useQuery({
    queryKey: queryKeys.dashboard.kpi,
    queryFn: async () => (await adminClient.getDashboardKPIs()).kpiStats as DashboardKPIs,
    staleTime: 60_000,
  });

  const topProductsQuery = useQuery({
    queryKey: queryKeys.dashboard.topProducts,
    queryFn: async () => (await adminClient.getTopProducts()).topProducts as DashboardTopProduct[],
    staleTime: 60_000,
  });

  const recentOrdersQuery = useQuery({
    queryKey: queryKeys.dashboard.recentOrders,
    queryFn: async () =>
      (await adminClient.getRecentOrders()).recentOrders as DashboardRecentOrder[],
    staleTime: 60_000,
  });

  const k = kpisQuery.data;

  return (
    <div className="flex flex-col gap-4">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 max-sm:gap-0 max-sm:overflow-hidden max-sm:rounded-[10px] max-sm:border max-sm:border-border [&>*:nth-child(2n)]:max-sm:border-r-0 [&>*:nth-last-child(-n+2)]:max-sm:border-b-0 lg:grid-cols-4">
        {kpisQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              className="border border-border p-4 shadow-none max-sm:rounded-none max-sm:border-0 max-sm:border-r max-sm:border-b max-sm:border-border max-sm:ring-0"
            >
              <Skeleton className="mb-3 h-3 w-24" />
              <Skeleton className="h-7 w-32" />
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="Doanh thu hôm nay"
              value={k ? formatVnd(k.todayRevenue) : "—"}
              delta={k ? `${k.todayOrdersCount} đơn` : "—"}
              icon={TrendingUp}
              tone="primary"
            />
            <StatCard
              label="Đơn chờ xử lý"
              value={k?.pendingOrdersCount ?? "—"}
              delta="Cần xác nhận"
              direction="up"
              icon={ShoppingCart}
              tone="amber"
            />
            <StatCard
              label="Sản phẩm sắp hết"
              value={k?.lowStockCount ?? "—"}
              delta={k ? `${k.outOfStockCount} đã hết` : "—"}
              direction="down"
              icon={AlertTriangle}
              tone="danger"
            />
            <StatCard
              label="Khách hàng mới"
              value={k?.todayCustomersCount ?? "—"}
              delta="Hôm nay"
              direction="up"
              icon={Users}
              tone="mint"
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
        <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
          <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <TrendingUp className="h-[15px] w-[15px] text-primary" strokeWidth={2} />
              Doanh thu 7 ngày
            </h3>
            <TonePill tone="green">+18% tuần trước</TonePill>
          </div>
          <BarChartMini data={REVENUE_DATA} />
        </Card>
        <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
          <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <ShoppingCart className="h-[15px] w-[15px] text-primary" strokeWidth={2} />
              Đơn hàng 7 ngày
            </h3>
            <TonePill tone="blue">{k ? `${k.todayOrdersCount} hôm nay` : "—"}</TonePill>
          </div>
          <BarChartMini data={ORDERS_DATA} highlightClass="bg-amber-500" baseClass="bg-amber-200" />
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Top products */}
        <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
          <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <Box className="h-[15px] w-[15px] text-primary" strokeWidth={2} />
              Sản phẩm bán chạy
            </h3>
            <Button asChild variant="outline" size="sm" className="h-7 rounded-md text-xs">
              <Link href={ADMIN_ROUTES.PRODUCTS}>Xem tất cả</Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  {["Sản phẩm", "Đã bán"].map((h, i) => (
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
                {topProductsQuery.isLoading && <TableLoadingRows cols={2} rows={5} />}
                {topProductsQuery.error && (
                  <TableErrorRow cols={2} message={String(topProductsQuery.error)} />
                )}
                {!topProductsQuery.isLoading && topProductsQuery.data?.length === 0 && (
                  <TableEmptyRow cols={2} message="Chưa có dữ liệu sản phẩm bán chạy" />
                )}
                {topProductsQuery.data?.slice(0, 5).map((p) => (
                  <TableRow key={p.id} className="cursor-pointer">
                    <TableCell className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <ProductThumb
                          label={thumbLabelFromName(p.name)}
                          tone={thumbToneFromId(p.id)}
                        />
                        <span className="text-[13px] font-semibold leading-tight">
                          {p.name.length > 38 ? `${p.name.slice(0, 38)}…` : p.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 font-semibold tabular-nums">
                      {p.totalQuantity.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Recent orders / activity */}
        <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
          <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <Bell className="h-[15px] w-[15px] text-primary" strokeWidth={2} />
              Đơn hàng gần đây
            </h3>
            <Button asChild variant="outline" size="sm" className="h-7 rounded-md text-xs">
              <Link href={ADMIN_ROUTES.ORDERS}>Xem tất cả</Link>
            </Button>
          </div>
          {recentOrdersQuery.isLoading && (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          )}
          {recentOrdersQuery.error && (
            <div className="px-[18px] py-10 text-center text-sm text-red-600">Lỗi tải dữ liệu</div>
          )}
          {!recentOrdersQuery.isLoading && recentOrdersQuery.data?.length === 0 && (
            <div className="px-[18px] py-10 text-center text-sm text-muted-foreground">
              Chưa có đơn hàng
            </div>
          )}
          <ul>
            {recentOrdersQuery.data?.slice(0, 6).map((o) => (
              <li
                key={o.id}
                className="flex items-start gap-3 border-b border-border px-[18px] py-2.5 last:border-b-0"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold">{o.orderNumber}</span>
                    <span className="text-[11px] text-muted-foreground/70">
                      {new Date(o.createdAt).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-foreground">{o.customerName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold tabular-nums text-red-600">
                        {formatVnd(o.total)}
                      </span>
                      <StatusBadge type={orderStatusType(o.status)} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
