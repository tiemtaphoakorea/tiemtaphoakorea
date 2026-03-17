import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function OrderSuccessView() {
  return (
    <div className="animate-in fade-in zoom-in-95 flex h-[60vh] flex-col items-center justify-center gap-6 duration-300">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <CheckCircle2 className="h-12 w-12" />
      </div>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Tạo đơn hàng thành công!
        </h1>
        <p className="font-medium text-slate-500">
          Đơn hàng mới đã được khởi tạo và đang chờ xử lý.
        </p>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" asChild className="h-12 px-8 font-bold">
          <Link href="/admin/orders">Về danh sách</Link>
        </Button>
        <Button
          asChild
          className="h-12 bg-emerald-600 px-8 font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"
        >
          <Link href="/admin/orders">Xem chi tiết đơn</Link>
        </Button>
      </div>
    </div>
  );
}
