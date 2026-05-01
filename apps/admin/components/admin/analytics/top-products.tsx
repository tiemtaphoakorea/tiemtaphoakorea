import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface TopProductsProps {
  products: any[];
}

export function TopProducts({ products }: TopProductsProps) {
  return (
    <Card className="border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-black">Sản phẩm bán chạy</CardTitle>
          <CardDescription className="font-medium">
            Những sản phẩm mang lại doanh thu cao nhất trong năm.
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          className="h-9 gap-1.5 text-xs font-bold uppercase hover:bg-slate-100"
          asChild
        >
          <Link href={ADMIN_ROUTES.PRODUCTS}>
            Xem tất cả <ArrowUpRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="py-0">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {products.map((product: any, idx: number) => (
            <div
              key={product.name ?? idx}
              className="group flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
            >
              <div className="flex items-start justify-between">
                <div className="text-primary flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-white font-black shadow-sm">
                  {idx + 1}
                </div>
                <Badge
                  className={`${product.growth > 0 ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-red-100 bg-red-50 text-red-600"} text-[10px] font-black tracking-tight uppercase`}
                >
                  {product.growth > 0 ? "+" : ""}
                  {product.growth}%
                </Badge>
              </div>
              <div>
                <h3 className="line-clamp-1 font-black text-slate-900">{product.name}</h3>
                <div className="mt-2 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-bold tracking-tight text-slate-500 uppercase">
                    <span>Đơn hàng</span>
                    <span className="text-slate-900">{product.sales}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold tracking-tight text-slate-500 uppercase">
                    <span>Doanh thu</span>
                    <span className="text-primary">{formatCurrency(product.revenue)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
