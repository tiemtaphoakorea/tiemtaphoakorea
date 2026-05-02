"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Card } from "@workspace/ui/components/card";
import { AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type AlertItem = {
  id: string;
  productName: string;
  variantName: string | null;
  onHand: number;
  status: "out" | "low";
};

export function IndexCardStockAlert() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.stockAlerts,
    queryFn: () => adminClient.getStockAlerts(),
    staleTime: 60_000,
  });

  const outOfStock = data?.outOfStock ?? [];
  const lowStock = [...(data?.lowStock ?? [])].sort((a, b) => a.onHand - b.onHand);
  const totalAlerts = outOfStock.length + lowStock.length;

  const items: AlertItem[] = [
    ...outOfStock.map((v) => ({
      id: v.id,
      productName: v.productName,
      variantName: v.name,
      onHand: v.onHand,
      status: "out" as const,
    })),
    ...lowStock.map((v) => ({
      id: v.id,
      productName: v.productName,
      variantName: v.name,
      onHand: v.onHand,
      status: "low" as const,
    })),
  ];
  const top2 = items.slice(0, 2);
  const remaining = Math.max(0, totalAlerts - top2.length);
  const isHealthy = !isLoading && totalAlerts === 0;

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
          <div className="text-[15px] font-bold leading-tight">Tồn kho cảnh báo</div>
          <div className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
            Sản phẩm sắp hết hoặc đã hết hàng
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <div className="h-7 w-32 animate-pulse rounded bg-muted" />
            <div className="h-5 animate-pulse rounded bg-muted" />
            <div className="h-5 animate-pulse rounded bg-muted" />
          </div>
        ) : isHealthy ? (
          <div className="flex flex-col gap-1">
            <span className="text-[20px] font-bold leading-none text-emerald-700">An toàn</span>
            <span className="text-xs text-muted-foreground">Không có SP nào cần xử lý</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-[20px] font-bold leading-none text-amber-700">
              {totalAlerts} SP cần xử lý
            </span>
            <ul className="flex flex-col gap-1.5">
              {top2.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-[12px] leading-tight">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      item.status === "out" ? "bg-red-500" : "bg-amber-500"
                    }`}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium" title={item.productName}>
                    {item.productName}
                    {item.variantName ? ` · ${item.variantName}` : ""}
                  </span>
                  <span
                    className={`shrink-0 text-[11px] font-semibold tabular-nums ${
                      item.status === "out" ? "text-red-600" : "text-amber-700"
                    }`}
                  >
                    {item.status === "out" ? "đã hết" : `còn ${item.onHand}`}
                  </span>
                </li>
              ))}
            </ul>
            {remaining > 0 ? (
              <span className="text-[11px] text-muted-foreground">+ {remaining} SP khác</span>
            ) : null}
          </div>
        )}
      </Card>
    </Link>
  );
}
