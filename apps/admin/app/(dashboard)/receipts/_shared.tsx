"use client";

import {
  PAYMENT_METHOD,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS,
  type PaymentMethodValue,
  RECEIPT_STATUS,
  RECEIPT_STATUS_LABEL,
} from "@workspace/shared/constants";
import { type BadgeTone, TonePill } from "@/components/admin/shared/status-badge";

export type ReceiptRow = {
  id: string;
  code: string;
  status: string;
  supplierId: string | null;
  supplierName: string | null;
  purchaseOrderId: string | null;
  receivedAt: string | Date | null;
  totalQty: number | null;
  totalAmount: string | null;
  payableAmount: string | null;
  paidAmount: string | null;
  debtAmount: string | null;
  paymentStatus: string | null;
  createdAt: string | Date | null;
  createdByName: string | null;
  note: string | null;
};

export type ReceiptDetail = ReceiptRow & {
  invoiceDate: string | Date | null;
  invoiceRef: string | null;
  discountAmount: string | null;
  extraCost: string | null;
  items: ReceiptItem[];
};

export type ReceiptItem = {
  id: string;
  variantId: string;
  purchaseOrderItemId: string | null;
  quantity: number;
  unitCost: string;
  discount: string | null;
  lineTotal: string;
  note: string | null;
  productName: string | null;
  variantName: string | null;
  sku: string | null;
};

export type PayoutRow = {
  id: string;
  code: string;
  supplierId: string | null;
  supplierName: string | null;
  receiptId: string | null;
  receiptCode: string | null;
  amount: string;
  method: string;
  referenceCode: string | null;
  paidAt: string | Date | null;
  note: string | null;
  createdAt: string | Date | null;
  createdByName: string | null;
};

export const STATUS_OPTIONS = [
  { value: "All", label: "Tất cả" },
  { value: RECEIPT_STATUS.DRAFT, label: RECEIPT_STATUS_LABEL.draft },
  { value: RECEIPT_STATUS.COMPLETED, label: RECEIPT_STATUS_LABEL.completed },
  { value: RECEIPT_STATUS.CANCELLED, label: RECEIPT_STATUS_LABEL.cancelled },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: "All", label: "Tất cả PTTT" },
  { value: PAYMENT_METHOD.CASH, label: PAYMENT_METHOD_LABEL.cash },
  { value: PAYMENT_METHOD.BANK_TRANSFER, label: PAYMENT_METHOD_LABEL.bank_transfer },
  { value: PAYMENT_METHOD.CARD, label: PAYMENT_METHOD_LABEL.card },
];

export const PAYMENT_STATUS_FILTER_OPTIONS = [
  { value: "", label: "Tất cả thanh toán" },
  { value: PAYMENT_STATUS.UNPAID, label: "Chưa thanh toán" },
  { value: PAYMENT_STATUS.PARTIAL, label: "Thanh toán 1 phần" },
  { value: PAYMENT_STATUS.PAID, label: "Đã thanh toán" },
];

const STATUS_META: Record<string, { tone: BadgeTone; label: string }> = {
  [RECEIPT_STATUS.DRAFT]: { tone: "amber", label: RECEIPT_STATUS_LABEL.draft },
  [RECEIPT_STATUS.COMPLETED]: { tone: "green", label: RECEIPT_STATUS_LABEL.completed },
  [RECEIPT_STATUS.CANCELLED]: { tone: "red", label: RECEIPT_STATUS_LABEL.cancelled },
};

const PAYMENT_STATUS_META: Record<string, { tone: BadgeTone; label: string }> = {
  [PAYMENT_STATUS.UNPAID]: { tone: "red", label: "Chưa thanh toán" },
  [PAYMENT_STATUS.PARTIAL]: { tone: "amber", label: "Thanh toán một phần" },
  [PAYMENT_STATUS.PAID]: { tone: "green", label: "Đã thanh toán" },
};

export function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { tone: "gray" as BadgeTone, label: status };
  return <TonePill tone={meta.tone}>{meta.label}</TonePill>;
}

export function PaymentStatusPill({ status }: { status: string }) {
  const meta = PAYMENT_STATUS_META[status] ?? { tone: "gray" as BadgeTone, label: status };
  return <TonePill tone={meta.tone}>{meta.label}</TonePill>;
}

export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `${n.toLocaleString("vi-VN")}đ`;
}

import { format } from "date-fns";

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "dd/MM/yyyy, HH:mm");
}

export function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function methodLabel(method: string): string {
  return PAYMENT_METHOD_LABEL[method as PaymentMethodValue] ?? method;
}
