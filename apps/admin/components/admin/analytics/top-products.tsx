import type { AnalyticsTopProduct } from "@workspace/database/types/admin";
import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent } from "@workspace/ui/components/card";
import { ShoppingCart, TrendingDown, TrendingUp } from "lucide-react";

interface TopProductsProps {
  products: AnalyticsTopProduct[];
}

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export function TopProducts({ products }: TopProductsProps) {
  const maxRevenue = products[0]?.revenue ?? 0;
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <span className="text-3xl">📦</span>
        <p className="text-sm font-semibold text-slate-700">Chưa có dữ liệu bán hàng</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Thống kê sản phẩm bán chạy được tính từ các đơn hàng đã hoàn thành. Khi có đơn hàng, dữ
          liệu sẽ hiển thị tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top 3 highlight cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {products.slice(0, 3).map((product, idx) => {
          const sharePct = totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0;
          const widthPct = maxRevenue > 0 ? (product.revenue / maxRevenue) * 100 : 0;
          const growthPositive = (product.growth ?? 0) >= 0;
          return (
            <Card key={product.name} className="border-none shadow-sm ring-1 ring-slate-200">
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{RANK_MEDALS[idx]}</span>
                  {product.growth != null && (
                    <span
                      className={`flex items-center gap-1 text-xs font-bold tabular-nums ${growthPositive ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {growthPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {growthPositive ? "+" : ""}
                      {product.growth}%
                    </span>
                  )}
                </div>
                <h3 className="line-clamp-2 text-sm font-black text-slate-900" title={product.name}>
                  {product.name}
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-slate-500">
                      <ShoppingCart className="h-3 w-3" />
                      Đơn hàng
                    </span>
                    <span className="font-bold text-slate-800">
                      {product.sales.toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Doanh thu</span>
                    <span className="font-black text-primary tabular-nums">
                      {formatCurrency(product.revenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Tỷ trọng</span>
                    <span className="font-bold text-slate-700">{sharePct.toFixed(1)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-violet-100">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rank 4+ compact list in a card */}
      {products.length > 3 && (
        <Card className="border-none shadow-sm ring-1 ring-slate-200">
          <CardContent className="py-0">
            <div className="flex flex-col divide-y divide-slate-100">
              {products.slice(3).map((product, idx) => {
                const rank = idx + 4;
                const sharePct = totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0;
                const widthPct = maxRevenue > 0 ? (product.revenue / maxRevenue) * 100 : 0;
                const growthPositive = (product.growth ?? 0) >= 0;
                return (
                  <div key={product.name} className="flex items-center gap-4 py-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-slate-100 text-xs font-black text-slate-500">
                      {rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800"
                          title={product.name}
                        >
                          {product.name}
                        </span>
                        {product.growth != null && (
                          <span
                            className={`flex shrink-0 items-center gap-0.5 text-xs font-bold tabular-nums ${growthPositive ? "text-emerald-600" : "text-red-500"}`}
                          >
                            {growthPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {growthPositive ? "+" : ""}
                            {product.growth}%
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-violet-100">
                          <div
                            className="h-full rounded-full bg-violet-400"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">
                          {sharePct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <span className="text-sm font-black tabular-nums text-primary">
                        {formatCurrency(product.revenue)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <ShoppingCart className="h-3 w-3" />
                        {product.sales.toLocaleString("vi-VN")} đơn
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
