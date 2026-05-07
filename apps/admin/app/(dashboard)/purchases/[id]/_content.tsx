"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PURCHASE_ORDER_STATUS, ROLE } from "@workspace/shared/constants";
import { formatCurrency } from "@workspace/shared/utils";
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
import { format } from "date-fns";
import { ChevronLeft, PackagePlus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { type PurchaseOrderDetail, StatusPill } from "../_shared";

const fmtDate = (d: string | Date | null) => (d ? format(new Date(d), "dd/MM/yyyy, HH:mm") : "—");

const CAN_MANAGE_ROLES = [ROLE.OWNER, ROLE.MANAGER] as const;

export default function PurchaseDetailContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: queryKeys.admin.profile,
    queryFn: async () => {
      const data = await adminClient.getProfile();
      return (data as unknown as { profile: { role: string } })?.profile ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const detailQuery = useQuery({
    queryKey: queryKeys.admin.purchases.detail(id),
    queryFn: async () => {
      const res = await adminClient.getPurchase(id);
      return (res as unknown as { purchaseOrder: PurchaseOrderDetail }).purchaseOrder;
    },
    enabled: !!id,
  });

  const detail = detailQuery.data;
  const userRole = profileQuery.data?.role ?? "";
  const canManage = (CAN_MANAGE_ROLES as readonly string[]).includes(userRole);

  const confirmMutation = useMutation({
    mutationFn: async () => await adminClient.confirmPurchase(id),
    onSuccess: () => {
      toast.success("Đã xác nhận đơn nhập — trạng thái chuyển sang Đã đặt");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.purchases.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.purchases.all });
    },
    onError: (err: unknown) => {
      toast.error((err as Error)?.message || "Không thể xác nhận đơn nhập");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => await adminClient.cancelPurchase(id),
    onSuccess: () => {
      toast.success("Đã huỷ đơn nhập");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.purchases.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.purchases.all });
    },
    onError: (err: unknown) => {
      toast.error((err as Error)?.message || "Không thể huỷ đơn nhập");
    },
  });

  const [cancelOpen, setCancelOpen] = useState(false);
  const isPending = confirmMutation.isPending || cancelMutation.isPending;
  const isDraft = detail?.status === PURCHASE_ORDER_STATUS.DRAFT;
  const isReceived = detail?.status === PURCHASE_ORDER_STATUS.RECEIVED;
  const isCancelled = detail?.status === PURCHASE_ORDER_STATUS.CANCELLED;
  const canConfirm = canManage && isDraft;
  const canCancel = canManage && !isReceived && !isCancelled;
  const canCreateReceipt =
    canManage &&
    detail &&
    detail.status !== PURCHASE_ORDER_STATUS.DRAFT &&
    detail.status !== PURCHASE_ORDER_STATUS.RECEIVED &&
    detail.status !== PURCHASE_ORDER_STATUS.CANCELLED;

  function handleCancel() {
    setCancelOpen(true);
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
            <Link href="/purchases">
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
              </div>
            )}
            <p className="mt-1.5 text-xs font-medium text-slate-500 sm:text-sm">
              Đơn đặt hàng nhập
              {detail?.supplierName ? ` · ${detail.supplierName}` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end md:gap-2.5">
          {canCancel && detail && (
            <Button type="button" variant="destructive" onClick={handleCancel} disabled={isPending}>
              Huỷ đơn
            </Button>
          )}
          {canConfirm && (
            <Button type="button" onClick={() => confirmMutation.mutate()} disabled={isPending}>
              {confirmMutation.isPending ? "Đang xác nhận..." : "Xác nhận đơn"}
            </Button>
          )}
          {canCreateReceipt && (
            <Button
              type="button"
              variant="default"
              className="gap-1.5"
              onClick={() => router.push(`/receipts/new?purchaseOrderId=${id}`)}
            >
              <PackagePlus className="h-4 w-4" strokeWidth={2} />
              Tạo phiếu nhập
            </Button>
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
            <DetailRow label="Nhà cung cấp">
              {detail.supplierName ?? <span className="text-muted-foreground">—</span>}
            </DetailRow>
            <DetailRow label="Tổng SL">
              <span className="tabular-nums font-medium">{detail.totalQty}</span>
            </DetailRow>
            <DetailRow label="Giá trị đơn">
              <span className="tabular-nums font-medium">{formatCurrency(detail.totalAmount)}</span>
            </DetailRow>
            <DetailRow label="Giảm giá">
              <span className="tabular-nums">
                {Number(detail.discountAmount) > 0 ? formatCurrency(detail.discountAmount) : "—"}
              </span>
            </DetailRow>
            <DetailRow label="Ngày tạo">{fmtDate(detail.createdAt)}</DetailRow>
            <DetailRow label="Ngày đặt">{fmtDate(detail.orderedAt)}</DetailRow>
            <DetailRow label="Ngày dự kiến">{fmtDate(detail.expectedDate)}</DetailRow>
            {detail.completedAt && (
              <DetailRow label="Ngày hoàn thành">{fmtDate(detail.completedAt)}</DetailRow>
            )}
            {detail.cancelledAt && (
              <DetailRow label="Ngày huỷ">{fmtDate(detail.cancelledAt)}</DetailRow>
            )}
            {detail.note && (
              <DetailRow label="Ghi chú" className="col-span-2 sm:col-span-3 lg:col-span-4">
                <span className="text-sm text-foreground">{detail.note}</span>
              </DetailRow>
            )}
          </Card>

          <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Huỷ đơn nhập</AlertDialogTitle>
                <AlertDialogDescription>
                  Hành động này không thể hoàn tác. Bạn có chắc muốn huỷ đơn nhập này?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Không</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => cancelMutation.mutate()}
                >
                  Huỷ đơn
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {detail.items.length > 0 && (
            <Card className="overflow-hidden border border-border p-0 shadow-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="w-20">Đặt</TableHead>
                    <TableHead className="w-20">Đã nhận</TableHead>
                    <TableHead className="w-32">Đơn giá</TableHead>
                    <TableHead className="w-32 text-right">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-2.5">
                        <div className="flex flex-col leading-tight">
                          <span className="text-sm font-medium">{item.productName ?? "—"}</span>
                          {item.variantName && (
                            <span className="text-xs text-muted-foreground">
                              {item.variantName}
                            </span>
                          )}
                          {item.sku && (
                            <span className="font-mono text-xs text-muted-foreground/70">
                              {item.sku}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">{item.orderedQty}</TableCell>
                      <TableCell className="tabular-nums text-sm">{item.receivedQty}</TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {formatCurrency(item.unitCost)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium">
                        {formatCurrency(item.lineTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function DetailRow({
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
