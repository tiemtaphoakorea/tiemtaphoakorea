"use client";

import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@workspace/shared/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

interface FinanceDayDrawerProps {
  date: string | null;
  onClose: () => void;
}

export function FinanceDayDrawer({ date, onClose }: FinanceDayDrawerProps) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.finance.dayOrders(date ?? ""),
    queryFn: () => adminClient.getDayOrders(date!),
    enabled: !!date,
  });

  const formattedDate = date
    ? new Date(date).toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  const orders = data?.orders ?? [];
  const totalAmount = orders.reduce((s, o) => s + Number(o.total ?? 0), 0);

  return (
    <Sheet open={!!date} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[640px]">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-lg font-black capitalize">{formattedDate}</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : !orders.length ? (
          <p className="py-8 text-center text-sm text-slate-500">Không có đơn hàng ngày này.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                {orders.length} đơn hàng
              </span>
              <span className="text-base font-black text-slate-900 dark:text-white">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    #{order.orderNumber}
                  </span>
                  <span className="text-xs text-slate-500">{order.customerName}</span>
                </div>
                <span className="text-sm font-black">
                  {formatCurrency(Number(order.total ?? 0))}
                </span>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
