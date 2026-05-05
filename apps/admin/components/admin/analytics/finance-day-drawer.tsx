"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Skeleton } from "@workspace/ui/components/skeleton";
import Link from "next/link";
import { useEffect, useState } from "react";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

interface FinanceDayDrawerProps {
  date: string | null;
  onClose: () => void;
}

export function FinanceDayDrawer({ date, onClose }: FinanceDayDrawerProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={
          isDesktop
            ? "flex w-100 flex-col overflow-y-auto sm:max-w-100"
            : "max-h-[80vh] overflow-y-auto rounded-t-2xl"
        }
      >
        <SheetHeader>
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
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <span className="text-sm font-bold text-slate-600">{orders.length} đơn hàng</span>
              <span className="text-base font-black text-slate-900">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            {orders.map((order) => (
              <Link
                key={order.id}
                href={ADMIN_ROUTES.ORDER_DETAIL(order.id)}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition-colors hover:bg-muted"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-slate-900">#{order.orderNumber}</span>
                  <span className="text-xs text-slate-500">{order.customerName}</span>
                </div>
                <span className="text-sm font-black">
                  {formatCurrency(Number(order.total ?? 0))}
                </span>
              </Link>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
