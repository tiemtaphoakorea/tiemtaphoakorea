"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RECEIPT_STATUS } from "@workspace/shared/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { ChevronLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { PaymentDialog } from "../_payment-dialog";
import {
  formatDate,
  formatMoney,
  methodLabel,
  PaymentStatusPill,
  type PayoutRow,
  type ReceiptDetail,
  StatusPill,
} from "../_shared";

export default function ReceiptDetailContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const queryClient = useQueryClient();
  const [paymentOpen, setPaymentOpen] = useState(false);
  type ConfirmState =
    | { type: "complete" }
    | { type: "cancel" }
    | { type: "deletePayout"; id: string }
    | null;
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const detailQuery = useQuery({
    queryKey: queryKeys.admin.receipts.detail(id),
    queryFn: async () => {
      const res = await adminClient.getReceipt(id);
      return (res as unknown as { receipt: ReceiptDetail }).receipt;
    },
    enabled: !!id,
  });

  const paymentsQuery = useQuery({
    queryKey: queryKeys.admin.payouts.list({ receiptId: id }),
    queryFn: async () => {
      const res = await adminClient.getPayouts({ receiptId: id });
      return (res as unknown as { data: PayoutRow[] }).data ?? [];
    },
    enabled: !!id,
  });

  const profileQuery = useQuery({
    queryKey: queryKeys.admin.profile,
    queryFn: async () => {
      const data = await adminClient.getProfile();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.profile;
    },
    staleTime: 5 * 60 * 1000,
  });

  const detail = detailQuery.data;
  const payments: PayoutRow[] = paymentsQuery.data ?? [];
  const userRole: string = profileQuery.data?.role ?? "staff";
  const canManage = userRole === "owner" || userRole === "manager";

  const completeMutation = useMutation({
    mutationFn: async () => adminClient.completeReceipt(id),
    onSuccess: () => {
      toast.success("Đã hoàn tất phiếu nhập");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.receipts.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.receipts.all });
    },
    onError: (err: unknown) => {
      toast.error((err as Error)?.message || "Không thể hoàn tất phiếu nhập");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => adminClient.cancelReceipt(id),
    onSuccess: () => {
      toast.success("Đã huỷ phiếu nhập");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.receipts.all });
      router.push("/receipts");
    },
    onError: (err: unknown) => {
      toast.error((err as Error)?.message || "Không thể huỷ phiếu nhập");
    },
  });

  const deletePayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => adminClient.deletePayout(payoutId),
    onSuccess: () => {
      toast.success("Đã xoá phiếu chi");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.receipts.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.payouts.all });
    },
    onError: (err: unknown) => {
      toast.error((err as Error)?.message || "Không thể xoá phiếu chi");
    },
  });

  const isPending =
    completeMutation.isPending || cancelMutation.isPending || deletePayoutMutation.isPending;

  const isDraft = detail?.status === RECEIPT_STATUS.DRAFT;
  const isCancelled = detail?.status === RECEIPT_STATUS.CANCELLED;
  const paidAmount = Number(detail?.paidAmount ?? 0);
  const debtAmount = Number(detail?.debtAmount ?? 0);
  const canCancel = !isCancelled && paidAmount === 0;
  const canPay = canManage && !isCancelled && debtAmount > 0 && !!detail?.supplierId;

  function handleComplete() {
    setConfirmState({ type: "complete" });
  }
  function handleCancel() {
    setConfirmState({ type: "cancel" });
  }
  function handleDeletePayout(payoutId: string) {
    setConfirmState({ type: "deletePayout", id: payoutId });
  }
  function handleConfirm() {
    if (!confirmState) return;
    if (confirmState.type === "complete") completeMutation.mutate();
    else if (confirmState.type === "cancel") cancelMutation.mutate();
    else if (confirmState.type === "deletePayout") deletePayoutMutation.mutate(confirmState.id);
    setConfirmState(null);
  }
  function handlePaymentDone() {
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.receipts.detail(id) });
    queryClient.invalidateQueries({
      queryKey: queryKeys.admin.payouts.list({ receiptId: id }),
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.payouts.all });
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
            <Link href="/receipts">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="font-mono text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              {detail?.code ?? "Đang tải..."}
            </h1>
            {detail && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <StatusPill status={detail.status} />
                {detail.paymentStatus && <PaymentStatusPill status={detail.paymentStatus} />}
              </div>
            )}
            <p className="mt-1.5 text-xs font-medium text-slate-500 sm:text-sm">
              Phiếu nhập hàng
              {detail?.supplierName ? ` · ${detail.supplierName}` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end md:gap-2.5">
          {canManage && isDraft && detail && (
            <>
              {canCancel && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  Huỷ phiếu
                </Button>
              )}
              <Button type="button" onClick={handleComplete} disabled={isPending}>
                {completeMutation.isPending ? "Đang xử lý..." : "Hoàn tất"}
              </Button>
            </>
          )}
        </div>
      </div>

      {detailQuery.isLoading && (
        <Card className="flex items-center justify-center border border-border py-16 text-sm text-muted-foreground shadow-none">
          Đang tải...
        </Card>
      )}
      {detailQuery.error && (
        <Card className="flex items-center justify-center border border-border py-16 text-sm text-red-600 shadow-none">
          {String(detailQuery.error)}
        </Card>
      )}

      {detail && (
        <>
          <Card className="grid grid-cols-2 gap-x-4 gap-y-3.5 border border-border bg-card p-5 shadow-none sm:grid-cols-3 lg:grid-cols-4">
            <InfoRow label="Nhà cung cấp">
              <span className="font-medium">{detail.supplierName ?? "—"}</span>
            </InfoRow>
            <InfoRow label="Ngày lập phiếu">{formatDate(detail.invoiceDate)}</InfoRow>
            <InfoRow label="Mã HĐ NCC">{detail.invoiceRef ?? "—"}</InfoRow>
            <InfoRow label="Ngày nhận">{formatDate(detail.receivedAt)}</InfoRow>
            <InfoRow label="Người tạo">{detail.createdByName ?? "—"}</InfoRow>
            <InfoRow label="Ngày tạo">{formatDate(detail.createdAt)}</InfoRow>
            {detail.note && (
              <InfoRow label="Ghi chú" className="col-span-2 sm:col-span-3 lg:col-span-4">
                <span className="text-foreground">{detail.note}</span>
              </InfoRow>
            )}
          </Card>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Hàng hoá
            </h3>
            <Card className="overflow-hidden border border-border p-0 shadow-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Sản phẩm", "SKU", "SL", "Đơn giá", "CK", "Thành tiền"].map((h, i) => (
                      <TableHead key={i} className="text-xs">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.items.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-4 text-center text-xs text-muted-foreground"
                      >
                        Không có hàng hoá
                      </TableCell>
                    </TableRow>
                  )}
                  {detail.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="px-4 py-2 text-xs">
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium">{item.productName ?? "—"}</span>
                          {item.variantName && (
                            <span className="text-muted-foreground">{item.variantName}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2 font-mono text-xs text-muted-foreground">
                        {item.sku ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2 tabular-nums text-xs">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="px-4 py-2 tabular-nums text-xs">
                        {formatMoney(item.unitCost)}
                      </TableCell>
                      <TableCell className="px-4 py-2 tabular-nums text-xs">
                        {formatMoney(item.discount)}
                      </TableCell>
                      <TableCell className="px-4 py-2 tabular-nums text-xs font-medium">
                        {formatMoney(item.lineTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Thanh toán
            </h3>
            <Card className="flex flex-col gap-3 border border-border p-4 shadow-none">
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="flex flex-col gap-0.5 rounded-lg bg-muted/40 px-3 py-2">
                  <span className="text-muted-foreground">Tiền cần trả</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatMoney(detail.payableAmount)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 rounded-lg bg-emerald-50 px-3 py-2">
                  <span className="text-muted-foreground">Đã trả</span>
                  <span className="text-sm font-semibold tabular-nums text-emerald-700">
                    {formatMoney(detail.paidAmount)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 rounded-lg bg-red-50 px-3 py-2">
                  <span className="text-muted-foreground">Còn phải trả</span>
                  <span className="text-sm font-semibold tabular-nums text-red-600">
                    {formatMoney(detail.debtAmount)}
                  </span>
                </div>
              </div>

              {payments.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã PCH</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Phương thức</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono">{p.code}</TableCell>
                          <TableCell>{formatDate(p.paidAt)}</TableCell>
                          <TableCell>{methodLabel(p.method)}</TableCell>
                          <TableCell className="tabular-nums font-medium">
                            {formatMoney(p.amount)}
                          </TableCell>
                          <TableCell>
                            {canManage && isDraft && (
                              <Button
                                type="button"
                                variant="ghost-destructive"
                                size="icon-xs"
                                onClick={() => handleDeletePayout(p.id)}
                                disabled={isPending}
                                aria-label="Xoá phiếu chi"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {canPay && (
                <Button
                  type="button"
                  variant="outline"
                  className="self-start"
                  onClick={() => setPaymentOpen(true)}
                  disabled={isPending}
                >
                  Thanh toán
                </Button>
              )}
            </Card>
          </div>

          <PaymentDialog
            open={paymentOpen}
            receiptId={detail.id}
            supplierId={detail.supplierId ?? ""}
            maxAmount={debtAmount}
            onClose={() => setPaymentOpen(false)}
            onPaid={handlePaymentDone}
          />

          <AlertDialog
            open={!!confirmState}
            onOpenChange={(open) => {
              if (!open) setConfirmState(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {confirmState?.type === "complete" && "Hoàn tất phiếu nhập"}
                  {confirmState?.type === "cancel" && "Huỷ phiếu nhập"}
                  {confirmState?.type === "deletePayout" && "Xoá phiếu chi"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {confirmState?.type === "complete" &&
                    "Tồn kho sẽ được cập nhật sau khi hoàn tất. Không thể hoàn tác."}
                  {confirmState?.type === "cancel" && "Bạn có chắc muốn huỷ phiếu nhập này?"}
                  {confirmState?.type === "deletePayout" && "Bạn có chắc muốn xoá phiếu chi này?"}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirm}>Xác nhận</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

function InfoRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["flex flex-col gap-0.5", className].filter(Boolean).join(" ")}>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="text-sm">{children}</div>
    </div>
  );
}
