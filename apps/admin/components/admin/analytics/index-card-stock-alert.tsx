"use client";

import type { AnalyticsInventory } from "@workspace/database/types/admin";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Card } from "@workspace/ui/components/card";
import { AlertTriangle, Archive, Box, ChevronRight, Package } from "lucide-react";
import Link from "next/link";

interface IndexCardStockAlertProps {
  data?: AnalyticsInventory;
  isLoading?: boolean;
}

export function IndexCardStockAlert({ data, isLoading }: IndexCardStockAlertProps) {
  const hasAlerts = (data?.outOfStockCount ?? 0) + (data?.lowStockCount ?? 0) > 0;
  const isHealthy = !isLoading && !!data && !hasAlerts;

  return (
    <Link href={ADMIN_ROUTES.ANALYTICS_INVENTORY} className="group">
      <Card className="flex h-full cursor-pointer flex-col gap-4 border border-border p-5 shadow-none transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
              isHealthy ? "bg-emerald-100" : "bg-amber-100"
            }`}
          >
            <AlertTriangle
              className={`h-5 w-5 ${isHealthy ? "text-emerald-600" : "text-amber-600"}`}
              strokeWidth={2}
            />
          </div>
          <ChevronRight
            className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground/70"
            strokeWidth={2}
          />
        </div>
        <div className="space-y-1.5">
          <div className="text-sm font-bold leading-tight">Thống kê tồn kho</div>
          <div className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            Giá trị và cảnh báo tồn kho
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <div className="h-5 w-full animate-pulse rounded bg-muted" />
            <div className="h-5 w-full animate-pulse rounded bg-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="mt-1 h-14 animate-pulse rounded bg-muted" />
          </div>
        ) : data ? (
          <div className="flex flex-col gap-3">
            {/* Value stats */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Archive className="h-3 w-3" />
                  Giá trị vốn
                </div>
                <span className="text-xs font-bold tabular-nums text-slate-800">
                  {formatCurrency(data.totalCostValue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Box className="h-3 w-3" />
                  Giá trị bán
                </div>
                <span className="text-xs font-bold tabular-nums text-slate-800">
                  {formatCurrency(data.totalRetailValue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Package className="h-3 w-3" />
                  Tổng SL tồn
                </div>
                <span className="text-xs font-bold tabular-nums text-slate-800">
                  {data.totalUnits.toLocaleString("vi-VN")}
                </span>
              </div>
            </div>

            {/* Stock alert section */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-red-50 px-3 py-2">
                <div
                  className={`text-lg font-black leading-none tabular-nums ${data.outOfStockCount > 0 ? "text-red-600" : "text-slate-400"}`}
                >
                  {data.outOfStockCount}
                </div>
                <div className="mt-1 text-xs font-medium text-red-700">Hết hàng</div>
              </div>
              <div className="rounded-lg bg-amber-50 px-3 py-2">
                <div
                  className={`text-lg font-black leading-none tabular-nums ${data.lowStockCount > 0 ? "text-amber-700" : "text-slate-400"}`}
                >
                  {data.lowStockCount}
                </div>
                <div className="mt-1 text-xs font-medium text-amber-800">Sắp hết</div>
              </div>
            </div>
          </div>
        ) : null}
      </Card>
    </Link>
  );
}
