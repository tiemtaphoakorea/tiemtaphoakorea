"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SUPPLIER_ORDER_STATUS } from "@workspace/shared/constants";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { formatDate, StatusPill, toDateInputValue } from "./_shared";

type SupplierOrderDetail = {
  id: string;
  status: string;
  quantity: number;
  createdAt: string | Date | null;
  orderedAt: string | Date | null;
  receivedAt: string | Date | null;
  expectedDate: string | Date | null;
  actualCostPrice: string | null;
  note: string | null;
  item: { productName?: string; variantName?: string; sku?: string };
};

const TERMINAL_STATUSES: string[] = [
  SUPPLIER_ORDER_STATUS.RECEIVED,
  SUPPLIER_ORDER_STATUS.CANCELLED,
];

export function SupplierOrderDetailDialog({
  id,
  onClose,
  onChanged,
}: {
  id: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const open = !!id;
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: queryKeys.admin.supplierOrders.detail(id ?? ""),
    queryFn: async () => {
      const res = await adminClient.getSupplierOrderDetail(id as string);
      return res.supplierOrder as SupplierOrderDetail;
    },
    enabled: open,
  });

  const detail = detailQuery.data;

  const [note, setNote] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [actualCostPrice, setActualCostPrice] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (detail) {
      setNote(detail.note ?? "");
      setExpectedDate(toDateInputValue(detail.expectedDate));
      setActualCostPrice(detail.actualCostPrice ?? "");
    }
  }, [detail]);

  const isTerminal = !!detail && TERMINAL_STATUSES.includes(detail.status);

  const updateMutation = useMutation({
    mutationFn: async (vars: { status: string; successMessage: string }) => {
      await adminClient.updateSupplierOrderStatus(id as string, {
        status: vars.status,
        note: note || undefined,
        expectedDate: expectedDate || undefined,
        actualCostPrice: actualCostPrice || undefined,
      });
      return vars.successMessage;
    },
    onSuccess: (msg) => {
      toast.success(msg);
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.supplierOrders.detail(id ?? ""),
      });
      onChanged();
    },
    onError: (err: unknown) => {
      toast.error((err as Error)?.message || "Không thể cập nhật đơn nhập");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => await adminClient.deleteSupplierOrder(id as string),
    onSuccess: () => {
      toast.success("Đã xoá đơn nhập");
      onChanged();
      onClose();
    },
    onError: (err: unknown) => {
      toast.error((err as Error)?.message || "Không thể xoá đơn nhập");
    },
  });

  const isPending = updateMutation.isPending || deleteMutation.isPending;

  function handleSave() {
    if (!detail) return;
    updateMutation.mutate({ status: detail.status, successMessage: "Đã lưu thay đổi" });
  }

  function handleAdvance(nextStatus: string, msg: string) {
    updateMutation.mutate({ status: nextStatus, successMessage: msg });
  }

  function handleDelete() {
    setDeleteOpen(true);
  }

  return (
    <>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá đơn nhập</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá đơn nhập đã huỷ này? Hành động không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate()}
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-130">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn nhập hàng</DialogTitle>
            <DialogDescription>
              {detail?.item.productName ?? "Đang tải thông tin đơn..."}
              {detail?.item.sku ? ` · ${detail.item.sku}` : ""}
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading && (
            <div className="py-8 text-center text-sm text-muted-foreground">Đang tải...</div>
          )}
          {detailQuery.error && (
            <div className="py-8 text-center text-sm text-red-600">{String(detailQuery.error)}</div>
          )}

          {detail && (
            <div className="my-2 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3 text-xs">
                <DetailRow label="Trạng thái">
                  <StatusPill status={detail.status} />
                </DetailRow>
                <DetailRow label="Số lượng">
                  <span className="tabular-nums font-medium">{detail.quantity}</span>
                </DetailRow>
                <DetailRow label="Sản phẩm">
                  <span>{detail.item.productName ?? "—"}</span>
                </DetailRow>
                <DetailRow label="Phiên bản">
                  <span>{detail.item.variantName ?? "—"}</span>
                </DetailRow>
                <DetailRow label="Ngày tạo">{formatDate(detail.createdAt)}</DetailRow>
                <DetailRow label="Ngày đặt">{formatDate(detail.orderedAt)}</DetailRow>
                <DetailRow label="Ngày nhận">{formatDate(detail.receivedAt)}</DetailRow>
                <DetailRow label="Giá nhập thực tế">
                  {detail.actualCostPrice ? formatCurrency(detail.actualCostPrice) : "—"}
                </DetailRow>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Field>
                  <FieldLabel>Ngày dự kiến</FieldLabel>
                  <Input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    disabled={isTerminal}
                  />
                </Field>
                <Field>
                  <FieldLabel>Giá nhập thực tế (đ)</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={actualCostPrice}
                    onChange={(e) => setActualCostPrice(e.target.value)}
                    disabled={isTerminal}
                    placeholder="0"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel>Ghi chú</FieldLabel>
                <Textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={isTerminal}
                  placeholder="Ghi chú nội bộ"
                />
              </Field>
            </div>
          )}

          <DialogFooter className="flex-wrap">
            {detail?.status === SUPPLIER_ORDER_STATUS.PENDING && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAdvance(SUPPLIER_ORDER_STATUS.CANCELLED, "Đã huỷ đơn")}
                  disabled={isPending}
                >
                  Huỷ đơn
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    handleAdvance(SUPPLIER_ORDER_STATUS.ORDERED, "Đã chuyển sang Đã đặt")
                  }
                  disabled={isPending}
                >
                  Đánh dấu đã đặt
                </Button>
              </>
            )}
            {detail?.status === SUPPLIER_ORDER_STATUS.ORDERED && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAdvance(SUPPLIER_ORDER_STATUS.CANCELLED, "Đã huỷ đơn")}
                  disabled={isPending}
                >
                  Huỷ đơn
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    handleAdvance(SUPPLIER_ORDER_STATUS.RECEIVED, "Đã nhận hàng, kho đã cập nhật")
                  }
                  disabled={isPending}
                >
                  Đánh dấu đã nhận
                </Button>
              </>
            )}
            {detail?.status === SUPPLIER_ORDER_STATUS.CANCELLED && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={isPending}
                className="text-red-600 hover:text-red-700"
              >
                Xoá đơn
              </Button>
            )}
            {!isTerminal && detail && (
              <Button type="button" variant="ghost" onClick={handleSave} disabled={isPending}>
                Lưu thay đổi
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="text-xs">{children}</div>
    </div>
  );
}
