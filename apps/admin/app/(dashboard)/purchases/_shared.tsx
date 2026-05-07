import { PURCHASE_ORDER_STATUS, PURCHASE_ORDER_STATUS_LABEL } from "@workspace/shared/constants";
import { type BadgeTone, TonePill } from "@/components/admin/shared/status-badge";

export type PurchaseOrderRow = {
  id: string;
  code: string;
  status: string;
  supplierId: string | null;
  supplierName: string | null;
  totalQty: number;
  totalAmount: string;
  discountAmount: string;
  orderedAt: string | Date | null;
  expectedDate: string | Date | null;
  completedAt: string | Date | null;
  createdAt: string | Date | null;
  createdByName: string | null;
  note: string | null;
};

export type PurchaseOrderDetail = PurchaseOrderRow & {
  branchId: string | null;
  cancelledAt: string | Date | null;
  updatedAt: string | Date | null;
  createdBy: string | null;
  confirmedBy: string | null;
  items: Array<{
    id: string;
    variantId: string;
    orderedQty: number;
    receivedQty: number;
    unitCost: string;
    discount: string | null;
    lineTotal: string;
    note: string | null;
    productName: string | null;
    variantName: string | null;
    sku: string | null;
  }>;
};

const STATUS_TONE: Record<string, BadgeTone> = {
  [PURCHASE_ORDER_STATUS.DRAFT]: "gray",
  [PURCHASE_ORDER_STATUS.ORDERED]: "blue",
  [PURCHASE_ORDER_STATUS.PARTIAL]: "amber",
  [PURCHASE_ORDER_STATUS.RECEIVED]: "green",
  [PURCHASE_ORDER_STATUS.CANCELLED]: "red",
};

export const STATUS_OPTIONS = [
  { value: "All", label: "Tất cả" },
  { value: PURCHASE_ORDER_STATUS.ORDERED, label: "Chưa nhập" },
  { value: PURCHASE_ORDER_STATUS.PARTIAL, label: "Một phần" },
  { value: PURCHASE_ORDER_STATUS.RECEIVED, label: "Hoàn thành" },
];

export function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? ("gray" as BadgeTone);
  const label =
    PURCHASE_ORDER_STATUS_LABEL[status as keyof typeof PURCHASE_ORDER_STATUS_LABEL] ?? status;
  return <TonePill tone={tone}>{label}</TonePill>;
}
