import { SUPPLIER_ORDER_STATUS, SUPPLIER_ORDER_STATUS_ALL } from "@workspace/shared/constants";
import { type BadgeTone, TonePill } from "@/components/admin/shared/status-badge";

export type SupplierOrderRow = {
  id: string;
  status: string;
  quantity: number;
  createdAt: string | Date | null;
  expectedDate: string | Date | null;
  note?: string | null;
  item: {
    productName?: string;
    variantName?: string;
    sku?: string;
  };
};

export const STATUS_META: Record<string, { tone: BadgeTone; label: string }> = {
  [SUPPLIER_ORDER_STATUS.PENDING]: { tone: "amber", label: "Chờ đặt" },
  [SUPPLIER_ORDER_STATUS.ORDERED]: { tone: "blue", label: "Đã đặt" },
  [SUPPLIER_ORDER_STATUS.RECEIVED]: { tone: "green", label: "Đã nhận" },
  [SUPPLIER_ORDER_STATUS.CANCELLED]: { tone: "red", label: "Đã huỷ" },
};

export const STATUS_OPTIONS = [
  { value: SUPPLIER_ORDER_STATUS_ALL, label: "Tất cả trạng thái" },
  { value: SUPPLIER_ORDER_STATUS.PENDING, label: "Chờ đặt" },
  { value: SUPPLIER_ORDER_STATUS.ORDERED, label: "Đã đặt" },
  { value: SUPPLIER_ORDER_STATUS.RECEIVED, label: "Đã nhận" },
  { value: SUPPLIER_ORDER_STATUS.CANCELLED, label: "Đã huỷ" },
];

import { format } from "date-fns";

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "dd/MM/yyyy, HH:mm");
}

export function toDateInputValue(value: string | Date | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { tone: "gray" as BadgeTone, label: status };
  return <TonePill tone={meta.tone}>{meta.label}</TonePill>;
}
