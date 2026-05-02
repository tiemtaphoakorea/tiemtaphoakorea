"use client";

import type { AnalyticsTopProduct } from "@workspace/database/types/admin";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Card } from "@workspace/ui/components/card";
import { ChevronRight, Package } from "lucide-react";
import Link from "next/link";

interface IndexCardTopProductsProps {
  data: AnalyticsTopProduct[] | undefined;
  isLoading: boolean;
}

export function IndexCardTopProducts({ data, isLoading }: IndexCardTopProductsProps) {
  const top3 = (data ?? []).slice(0, 3);
  const maxRevenue = top3[0]?.revenue ?? 0;
  const totalRevenue = top3.reduce((sum, p) => sum + p.revenue, 0);
  const isEmpty = !isLoading && top3.length === 0;

  return (
    <Link href={ADMIN_ROUTES.ANALYTICS_PRODUCTS} className="group">
      <Card className="flex h-full cursor-pointer flex-col gap-4 border border-border p-5 shadow-none transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-100">
            <Package className="h-5 w-5 text-violet-600" strokeWidth={2} />
          </div>
          <ChevronRight
            className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground/70"
            strokeWidth={2}
          />
        </div>
        <div className="space-y-1.5">
          <div className="text-[15px] font-bold leading-tight">Sản phẩm bán chạy</div>
          <div className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
            Top 3 sản phẩm bán chạy nhất
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="grid h-32 place-items-center text-xs text-muted-foreground">
            Chưa có sản phẩm bán chạy
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {top3.map((p, idx) => {
              const widthPct = maxRevenue > 0 ? (p.revenue / maxRevenue) * 100 : 0;
              const sharePct = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
              return (
                <li key={p.name} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded bg-violet-100 text-[10px] font-bold text-violet-700">
                      {idx + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium" title={p.name}>
                      {p.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {sharePct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-violet-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/70">
                      {formatCurrency(p.revenue)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </Link>
  );
}
