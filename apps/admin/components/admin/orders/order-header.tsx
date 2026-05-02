import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import { Download, Plus } from "lucide-react";
import Link from "next/link";

export function OrderHeader() {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Quản lý đơn hàng</h1>
        <p className="mt-1 font-medium text-slate-500">
          Xử lý quy trình bán hàng, vận chuyển và thanh toán.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="h-11 gap-2 rounded-xl border-slate-200 px-6 font-black"
        >
          <Download className="h-5 w-5" />
          Xuất Excel
        </Button>
        <Button
          asChild
          className="shadow-primary/20 h-11 gap-2 rounded-xl px-6 font-black shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Link href={ADMIN_ROUTES.ORDERS_NEW}>
            <Plus className="h-5 w-5" />
            Tạo đơn hàng
          </Link>
        </Button>
      </div>
    </div>
  );
}
