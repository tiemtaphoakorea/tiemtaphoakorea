import { describe, expect, it } from "vitest";
import type { PurchaseOrderDetail } from "../../../apps/admin/app/(dashboard)/purchases/_shared";
import { buildReceiptPrefillFromPurchaseOrder } from "../../../apps/admin/app/(dashboard)/receipts/new/purchase-prefill";

function purchase(overrides: Partial<PurchaseOrderDetail> = {}): PurchaseOrderDetail {
  return {
    id: "po-1",
    code: "OSN-001",
    status: "ordered",
    supplierId: "supplier-1",
    supplierName: "NCC A",
    branchId: null,
    totalQty: 12,
    totalAmount: "1200000",
    discountAmount: "100000",
    orderedAt: null,
    expectedDate: null,
    completedAt: null,
    cancelledAt: null,
    createdAt: null,
    updatedAt: null,
    createdBy: null,
    createdByName: null,
    confirmedBy: null,
    note: null,
    items: [],
    ...overrides,
  };
}

describe("buildReceiptPrefillFromPurchaseOrder", () => {
  it("prefills supplier, purchase order id, and remaining receipt lines", () => {
    const result = buildReceiptPrefillFromPurchaseOrder(
      purchase({
        items: [
          {
            id: "poi-1",
            variantId: "variant-1",
            orderedQty: 10,
            receivedQty: 4,
            unitCost: "50000.00",
            discount: "10000.00",
            lineTotal: "490000.00",
            note: "fragile",
            productName: "Áo",
            variantName: "Đen / M",
            sku: "SKU-1",
          },
          {
            id: "poi-2",
            variantId: "variant-2",
            orderedQty: 2,
            receivedQty: 2,
            unitCost: "70000.00",
            discount: "0.00",
            lineTotal: "140000.00",
            note: null,
            productName: "Quần",
            variantName: "Xanh",
            sku: "SKU-2",
          },
        ],
      }),
    );

    expect(result.supplierId).toBe("supplier-1");
    expect(result.purchaseOrderId).toBe("po-1");
    expect(result.discountAmount).toBe("100000");
    expect(result.lines).toEqual([
      {
        variantId: "variant-1",
        purchaseOrderItemId: "poi-1",
        productName: "Áo",
        variantName: "Đen / M",
        sku: "SKU-1",
        quantity: "6",
        unitCost: "50000",
        discount: "6000",
        note: "fragile",
      },
    ]);
  });
});
