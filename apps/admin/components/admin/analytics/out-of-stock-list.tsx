import { ArrowUpRight, PackageX } from "lucide-react";
import Link from "next/link";
import type { StockAlertVariant } from "@/services/admin.client";

interface OutOfStockListProps {
  items: StockAlertVariant[];
}

export function OutOfStockList({ items }: OutOfStockListProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PackageX className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-black tracking-wider text-slate-700 uppercase">Hết hàng</h3>
        </div>
        <Link
          href="/products?filter=out_of_stock"
          className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900"
        >
          Xem tất cả <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Không có sản phẩm hết hàng</p>
      ) : (
        <div className="flex flex-col divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{item.productName}</p>
                <p className="text-xs text-slate-500">
                  {item.name}
                  {item.sku ? ` · ${item.sku}` : ""}
                </p>
              </div>
              <span className="ml-4 shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-black text-red-600">
                Hết hàng
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
