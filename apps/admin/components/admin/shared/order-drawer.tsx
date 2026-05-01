"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { thumbLabelFromName, thumbToneFromId } from "./data-state";
import { formatVnd } from "./mock-data";
import { ProductThumb } from "./product-thumb";
import { StatusBadge, type StatusType } from "./status-badge";

type OrderDrawerProps = {
  /** When set, the drawer fetches and displays this order. null/undefined = closed. */
  orderId: string | null | undefined;
  onClose: () => void;
};

const SECTION_LABEL = "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

const fmtDate = (d: Date | string | null): string => {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Drawer showing order detail: meta, items, timeline, status actions. */
export function OrderDrawer({ orderId, onClose }: OrderDrawerProps) {
  const open = !!orderId;
  const queryClient = useQueryClient();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const orderQuery = useQuery({
    queryKey: orderId ? queryKeys.order(orderId) : ["order", "none"],
    queryFn: async () => {
      if (!orderId) return null;
      const res = await adminClient.getOrder(orderId);
      return res.order;
    },
    enabled: open,
    staleTime: 15_000,
  });

  const order = orderQuery.data;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentOrders });
    if (orderId) queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
  };

  const stockOutMutation = useMutation({
    mutationFn: () => adminClient.stockOutOrder(order!.id),
    onSuccess: () => {
      toast.success("Đã xuất kho");
      invalidate();
    },
    onError: (e) => toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`),
  });
  const completeMutation = useMutation({
    mutationFn: () => adminClient.completeOrder(order!.id),
    onSuccess: () => {
      toast.success("Đã hoàn thành đơn");
      invalidate();
    },
    onError: (e) => toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`),
  });
  const cancelMutation = useMutation({
    mutationFn: () => adminClient.cancelOrder(order!.id),
    onSuccess: () => {
      toast.success("Đã huỷ đơn");
      invalidate();
    },
    onError: (e) => toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`),
  });

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border px-[22px] py-4">
          <SheetTitle className="text-[15px] font-bold">
            Chi tiết đơn {order?.orderNumber ?? ""}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-[22px] py-[22px]">
          {orderQuery.isLoading && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          )}
          {orderQuery.error && (
            <div className="text-sm text-red-600">Lỗi tải đơn: {String(orderQuery.error)}</div>
          )}

          {order && (
            <>
              {/* Meta box */}
              <div className="flex flex-col gap-2 rounded-[10px] border border-border bg-muted/40 p-3.5">
                {[
                  ["Khách hàng", order.customer.fullName],
                  ["Mã KH", order.customer.customerCode],
                  ["Số điện thoại", order.customer.phone ?? "—"],
                  ["Địa chỉ giao", order.shippingAddress ?? order.customer.address ?? "—"],
                  ["Thời gian", fmtDate(order.createdAt)],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-muted-foreground">{l}</span>
                    <span className="max-w-[260px] text-right text-[13px] font-semibold text-foreground">
                      {v}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Thanh toán</span>
                  <StatusBadge type={order.paymentStatus as StatusType} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Trạng thái</span>
                  <StatusBadge type={order.fulfillmentStatus as StatusType} />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className={`${SECTION_LABEL} mb-2.5`}>Sản phẩm ({order.items.length} món)</div>
                {order.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center gap-2.5 border-b border-border py-2 last:border-b-0"
                  >
                    {it.variant?.images?.[0]?.imageUrl ? (
                      // biome-ignore lint/performance/noImgElement: order item image URL
                      <img
                        src={it.variant.images[0].imageUrl}
                        alt=""
                        className="h-[34px] w-[34px] shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <ProductThumb
                        label={thumbLabelFromName(it.productName ?? it.variantName ?? "?")}
                        tone={thumbToneFromId(it.id)}
                      />
                    )}
                    <div className="flex-1">
                      <div className="text-[13px] font-medium leading-tight">
                        {it.productName ?? "—"}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {it.variantName} · ×{it.quantity}
                      </div>
                    </div>
                    <div className="text-[13px] font-bold tabular-nums text-red-600">
                      {formatVnd(Number(it.unitPrice) * it.quantity)}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-[13px] font-semibold text-muted-foreground">Tổng cộng</span>
                  <span className="text-[17px] font-extrabold tabular-nums text-red-600">
                    {formatVnd(Number(order.total ?? 0))}
                  </span>
                </div>
                {Number(order.paidAmount ?? 0) > 0 && (
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground">Đã thanh toán</span>
                    <span className="text-[13px] font-semibold tabular-nums text-emerald-700">
                      {formatVnd(Number(order.paidAmount ?? 0))}
                    </span>
                  </div>
                )}
              </div>

              {/* Status history (timeline) */}
              {order.statusHistory.length > 0 && (
                <div>
                  <div className={`${SECTION_LABEL} mb-3`}>Lịch sử trạng thái</div>
                  <ol className="relative">
                    {order.statusHistory.map((h, i, arr) => (
                      <li key={h.id} className="relative flex gap-2.5 pb-3.5">
                        {i < arr.length - 1 && (
                          <span className="absolute left-[10px] top-[22px] bottom-0 w-px bg-border" />
                        )}
                        <span className="z-10 grid h-[22px] w-[22px] place-items-center rounded-full border-2 border-primary bg-primary/10 text-primary">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        <div>
                          <b className="text-[13px] font-semibold text-foreground">
                            {h.fulfillmentStatus} · {h.paymentStatus}
                          </b>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">
                            {fmtDate(h.createdAt)}
                            {h.creator?.fullName ? ` · ${h.creator.fullName}` : ""}
                          </span>
                          {h.note && (
                            <span className="mt-0.5 block text-[11px] italic text-muted-foreground">
                              {h.note}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-[22px] py-3.5">
          {order && order.fulfillmentStatus === "pending" && (
            <Button
              size="sm"
              disabled={stockOutMutation.isPending}
              onClick={() => stockOutMutation.mutate()}
            >
              Xuất kho
            </Button>
          )}
          {order && order.fulfillmentStatus === "stock_out" && (
            <Button
              size="sm"
              disabled={completeMutation.isPending}
              onClick={() => completeMutation.mutate()}
            >
              Hoàn thành
            </Button>
          )}
          {order &&
            order.fulfillmentStatus !== "completed" &&
            order.fulfillmentStatus !== "cancelled" && (
              <Button
                size="sm"
                variant="outline"
                disabled={cancelMutation.isPending}
                className="border-red-200 bg-red-100 text-red-600 hover:bg-red-200"
                onClick={() => setShowCancelConfirm(true)}
              >
                Huỷ đơn
              </Button>
            )}
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </SheetContent>
      <ConfirmDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title="Huỷ đơn này?"
        confirmLabel="Huỷ đơn"
        onConfirm={() => {
          cancelMutation.mutate();
          setShowCancelConfirm(false);
        }}
      />
    </Sheet>
  );
}
