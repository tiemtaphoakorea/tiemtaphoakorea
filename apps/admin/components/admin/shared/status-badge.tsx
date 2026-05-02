import { Badge } from "@workspace/ui/components/badge";

/** Status types covering UI-only states + real backend payment/fulfillment statuses. */
export type StatusType =
  // Product / generic
  | "active"
  | "draft"
  | "outstock"
  | "inactive"
  // UI fulfillment aliases (kept for compat with mock screens)
  | "new"
  | "processing"
  | "delivering"
  | "done"
  // Backend fulfillment_status values
  | "pending"
  | "stock_out"
  | "completed"
  | "cancelled"
  // Backend payment_status values
  | "unpaid"
  | "partial"
  | "paid"
  // Debts
  | "overdue";

const STATUS_MAP: Record<StatusType, { tone: BadgeTone; label: string }> = {
  active: { tone: "green", label: "Đang bán" },
  draft: { tone: "gray", label: "Nháp" },
  outstock: { tone: "red", label: "Hết hàng" },
  inactive: { tone: "gray", label: "Ngừng hoạt động" },
  // UI aliases
  new: { tone: "indigo", label: "Mới" },
  processing: { tone: "amber", label: "Đang xử lý" },
  delivering: { tone: "blue", label: "Đang giao" },
  done: { tone: "green", label: "Hoàn thành" },
  // Backend fulfillment
  pending: { tone: "amber", label: "Chờ xử lý" },
  stock_out: { tone: "blue", label: "Đã xuất kho" },
  completed: { tone: "green", label: "Hoàn thành" },
  cancelled: { tone: "red", label: "Đã huỷ" },
  // Backend payment
  unpaid: { tone: "red", label: "Chưa TT" },
  partial: { tone: "amber", label: "TT một phần" },
  paid: { tone: "green", label: "Đã TT" },
  // Debts
  overdue: { tone: "red", label: "Quá hạn" },
};

export type BadgeTone = "green" | "red" | "amber" | "blue" | "gray" | "indigo";

const TONE_CLASSES: Record<BadgeTone, string> = {
  green: "bg-emerald-100 text-emerald-700 border-transparent",
  red: "bg-red-100 text-red-600 border-transparent",
  amber: "bg-amber-100 text-amber-700 border-transparent",
  blue: "bg-blue-100 text-blue-600 border-transparent",
  gray: "bg-muted text-muted-foreground border-border",
  indigo: "bg-primary/10 text-primary border-transparent",
};

const BASE = "rounded-full px-2 py-[3px] text-[11px] font-semibold leading-none";

/** Render a status pill from a known status type. */
export function StatusBadge({ type }: { type: StatusType }) {
  const meta = STATUS_MAP[type] ?? { tone: "gray" as BadgeTone, label: type };
  return (
    <Badge className={`${BASE} ${TONE_CLASSES[meta.tone]}`} variant="outline">
      {meta.label}
    </Badge>
  );
}

/** Render an arbitrary tone pill (e.g. category, role labels). */
export function TonePill({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return (
    <Badge className={`${BASE} ${TONE_CLASSES[tone]}`} variant="outline">
      {children}
    </Badge>
  );
}
