"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { adminClient } from "@/services/admin.client";

export function DashboardTopProducts() {
  const { data } = useSuspenseQuery({
    queryKey: ["dashboard", "top-products"],
    queryFn: () => adminClient.getTopProducts(),
  });

  const topProducts = data?.topProducts;

  if (!topProducts) return null;

  return (
    <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
      <CardHeader>
        <CardTitle className="font-black">Sản phẩm bán chạy</CardTitle>
        <p className="text-muted-foreground text-sm font-medium">
          Top sản phẩm có doanh số tốt nhất
        </p>
      </CardHeader>
      <CardContent>
        {topProducts.length > 0 ? (
          <div className="space-y-6">
            {topProducts.map((product, index: number) => (
              <div key={product.id} className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-900 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                    {product.name}
                  </p>
                  <p className="text-xs font-medium text-slate-500 italic">
                    Đã bán: <span className="text-primary font-bold">{product.totalQuantity}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center font-medium text-slate-500 italic">
            Chưa có dữ liệu sản phẩm
          </div>
        )}
      </CardContent>
    </Card>
  );
}
