import type { PurchaseOrderDetail } from "../../purchases/_shared";

export type ReceiptLinePrefill = {
  variantId: string;
  purchaseOrderItemId?: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: string;
  unitCost: string;
  discount: string;
  note: string;
};

function money(value: string | number | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return "0";
  return String(Math.round(n));
}

export function buildReceiptPrefillFromPurchaseOrder(purchaseOrder: PurchaseOrderDetail): {
  supplierId: string;
  purchaseOrderId: string;
  discountAmount: string;
  lines: ReceiptLinePrefill[];
} {
  return {
    supplierId: purchaseOrder.supplierId ?? "",
    purchaseOrderId: purchaseOrder.id,
    discountAmount: money(purchaseOrder.discountAmount),
    lines: purchaseOrder.items
      .map((item) => {
        const orderedQty = Number(item.orderedQty) || 0;
        const receivedQty = Number(item.receivedQty) || 0;
        const remainingQty = Math.max(orderedQty - receivedQty, 0);
        const lineDiscount = Number(item.discount ?? 0) || 0;
        const discount =
          orderedQty > 0 && remainingQty > 0
            ? money((lineDiscount * remainingQty) / orderedQty)
            : "0";

        return {
          variantId: item.variantId,
          purchaseOrderItemId: item.id,
          productName: item.productName ?? item.variantName ?? item.sku ?? "—",
          variantName: item.variantName ?? "",
          sku: item.sku ?? "",
          quantity: String(remainingQty),
          unitCost: money(item.unitCost),
          discount,
          note: item.note ?? "",
        };
      })
      .filter((line) => Number(line.quantity) > 0),
  };
}
