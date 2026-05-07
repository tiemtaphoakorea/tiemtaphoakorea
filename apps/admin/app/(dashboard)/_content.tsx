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
import { format } from "date-fns";
import { AlertTriangle, Bell, Box, ShoppingCart, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { BarChartMini, type BarPoint } from "@/components/admin/shared/bar-chart-mini";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
  thumbLabelFromName,
  thumbToneFromId,
} from "@/components/admin/shared/data-state";
import { formatVnd } from "@/components/admin/shared/format-vnd";
import { MetricStatBar } from "@/components/admin/shared/metric-stat-bar";
import { ProductThumb } from "@/components/admin/shared/product-thumb";
import { StatusBadge, type StatusType, TonePill } from "@/components/admin/shared/status-badge";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Build inclusive date range YYYY-MM-DD strings ending at `endDate`, spanning `days` days. */
function buildRange(endDate: Date, days: number): { startDate: string; endDate: string } {
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const start = new Date(end.getTime() - (days - 1) * DAY_MS);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

/** Map dailyData rows by date key for O(1) lookup. */
function indexByDate<T extends { date: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((r) => [r.date.slice(0, 10), r]));
}

/** Project a 7-day window into BarPoint[] using the indexed daily rows. */
function projectWeekly(
  endDate: Date,
  byDate: Map<string, { revenue: number; orderCount: number }>,
  field: "revenue" | "orderCount",
): BarPoint[] {
  const points: BarPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(endDate.getTime() - i * DAY_MS);
    day.setHours(0, 0, 0, 0);
    const key = day.toISOString().slice(0, 10);
    const row = byDate.get(key);
    points.push({
      l: WEEKDAY_LABELS[day.getDay()] ?? "?",
      v: row ? Number(row[field]) : 0,
    });
  }
  return points;
}

function pctDelta(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? null : 0;
  return Math.round(((current - previous) / previous) * 100);
}

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

  const today = new Date();
  const currentRange = buildRange(today, 7);
  const previousRange = buildRange(new Date(today.getTime() - 7 * DAY_MS), 7);

  const dailyStatsQuery = useQuery({
    queryKey: queryKeys.admin.finance.daily(currentRange),
    queryFn: async () => await adminClient.getDailyFinancialStats(currentRange),
    staleTime: 60_000,
  });

  const previousStatsQuery = useQuery({
    queryKey: queryKeys.admin.finance.daily(previousRange),
    queryFn: async () => await adminClient.getDailyFinancialStats(previousRange),
    staleTime: 60_000,
  });

  const dailyByDate = indexByDate(dailyStatsQuery.data?.dailyData ?? []);
  const revenueData = projectWeekly(today, dailyByDate, "revenue");
  const ordersData = projectWeekly(today, dailyByDate, "orderCount");

  const currentRevenue = dailyStatsQuery.data?.summary.revenue ?? 0;
  const previousRevenue = previousStatsQuery.data?.summary.revenue ?? 0;
  const revenueDelta = pctDelta(currentRevenue, previousRevenue);

  const k = kpisQuery.data;

  return (
    <div className="flex flex-col gap-4">
      {/* KPI grid */}
      {kpisQuery.isLoading ? (
        <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
          <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card px-4 py-5 sm:px-6">
                <Skeleton className="mb-3 h-3 w-24" />
                <Skeleton className="mt-3 h-7 w-32" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <MetricStatBar
          items={[
            {
              label: "Doanh thu hôm nay",
              value: k ? formatVnd(k.todayRevenue) : "—",
              icon: <TrendingUp className="h-3.5 w-3.5" />,
              iconClassName: "bg-primary/10 text-primary",
              trend: {
                text: k ? `${k.todayOrdersCount} đơn` : "—",
                className: "text-muted-foreground",
              },
            },
            {
              label: "Đơn chờ xử lý",
              value: k?.pendingOrdersCount ?? "—",
              icon: <ShoppingCart className="h-3.5 w-3.5" />,
              iconClassName: "bg-amber-500/10 text-amber-600",
              trend: { text: "Cần xác nhận", className: "text-muted-foreground" },
            },
            {
              label: "Sản phẩm sắp hết",
              value: k?.lowStockCount ?? "—",
              icon: <AlertTriangle className="h-3.5 w-3.5" />,
              iconClassName: "bg-red-500/10 text-red-500",
              trend: { text: k ? `${k.outOfStockCount} đã hết` : "—", className: "text-red-600" },
            },
            {
              label: "Khách hàng mới",
              value: k?.todayCustomersCount ?? "—",
              icon: <Users className="h-3.5 w-3.5" />,
              iconClassName: "bg-emerald-500/10 text-emerald-600",
              trend: { text: "Hôm nay", className: "text-muted-foreground" },
            },
          ]}
        />
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
        <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <TrendingUp className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
              Doanh thu 7 ngày
            </h3>
            {revenueDelta === null ? (
              <TonePill tone="gray">—</TonePill>
            ) : (
              <TonePill tone={revenueDelta >= 0 ? "green" : "red"}>
                {revenueDelta >= 0 ? "+" : ""}
                {revenueDelta}% tuần trước
              </TonePill>
            )}
          </div>
          {dailyStatsQuery.isLoading ? (
            <Skeleton className="m-4.5 h-30 rounded" />
          ) : (
            <BarChartMini data={revenueData} />
          )}
        </Card>
        <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <ShoppingCart className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
              Đơn hàng 7 ngày
            </h3>
            <TonePill tone="blue">{k ? `${k.todayOrdersCount} hôm nay` : "—"}</TonePill>
          </div>
          {dailyStatsQuery.isLoading ? (
            <Skeleton className="m-4.5 h-30 rounded" />
          ) : (
            <BarChartMini
              data={ordersData}
              highlightClass="bg-amber-500"
              baseClass="bg-amber-200"
            />
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Top products */}
        <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <Box className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
              Sản phẩm bán chạy
            </h3>
            <Button asChild variant="outline" size="sm" className="h-7 rounded-md text-xs">
              <Link href={ADMIN_ROUTES.PRODUCTS}>Xem tất cả</Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Sản phẩm", "Đã bán"].map((h, i) => (
                    <TableHead key={i}>{h}</TableHead>
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
                        <span className="text-sm font-semibold leading-tight">
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
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <Bell className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
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
            <div className="px-5 py-10 text-center text-sm text-red-600">Lỗi tải dữ liệu</div>
          )}
          {!recentOrdersQuery.isLoading && recentOrdersQuery.data?.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              Chưa có đơn hàng
            </div>
          )}
          <ul>
            {recentOrdersQuery.data?.slice(0, 6).map((o) => (
              <li
                key={o.id}
                className="flex items-start gap-3 border-b border-border px-5 py-2.5 last:border-b-0"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold">{o.orderNumber}</span>
                    <span className="text-xs text-muted-foreground/70">
                      {o.createdAt ? format(new Date(o.createdAt), "dd/MM/yyyy, HH:mm") : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-foreground">{o.customerName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold tabular-nums text-red-600">
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
