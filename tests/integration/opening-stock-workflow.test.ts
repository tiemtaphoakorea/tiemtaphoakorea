import { PAYMENT_METHOD, PAYMENT_STATUS, RECEIPT_STATUS } from "@workspace/shared/constants";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { inventoryMovements, openingStockEntries } from "@/db/schema/inventory";
import { orderItems, orders, payments } from "@/db/schema/orders";
import { productVariants } from "@/db/schema/products";
import { purchaseOrders } from "@/db/schema/purchases";
import { goodsReceipts, supplierPayments } from "@/db/schema/receipts";
import { suppliers } from "@/db/schema/suppliers";
import { getFinancialStats } from "@/services/finance.server";
import { completeGoodsReceipt, createGoodsReceipt } from "@/services/goods-receipt.server";
import { applyOpeningStockEntries } from "@/services/inventory.server";
import { completeOrder, createOrder, recordPayment, stockOut } from "@/services/order.server";
import {
  confirmPurchaseOrder,
  createPurchaseOrder,
  getPurchaseOrderById,
} from "@/services/purchase-order.server";
import { getProfitLossReport } from "@/services/report.server";
import {
  getCurrentStockReport,
  getInOutMovementReport,
  getLedgerReport,
} from "@/services/report-inventory.server";
import { createSupplierPayment } from "@/services/supplier-payment.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "../unit/services/fixtures";

const OPENING_DATE = new Date("2026-04-01T00:00:00Z");
const REPORT_DATE = new Date(2026, 3, 15, 10, 0, 0);
const PERIOD = { startDate: new Date(2026, 3, 15), endDate: new Date(2026, 3, 15) };

function money(value: string | null | undefined) {
  return Number(value ?? 0);
}

describe("opening stock business workflows", () => {
  let fx: OrderTestFixture;
  let supplierId: string | undefined;

  beforeEach(async () => {
    fx = await seedOrderTest();
    await db
      .update(productVariants)
      .set({ onHand: 0, reserved: 0, costPrice: "0" })
      .where(eq(productVariants.id, fx.variantId));
  });

  afterEach(async () => {
    if (supplierId) {
      await db.delete(supplierPayments).where(eq(supplierPayments.supplierId, supplierId));
      await db.delete(goodsReceipts).where(eq(goodsReceipts.supplierId, supplierId));
      await db.delete(purchaseOrders).where(eq(purchaseOrders.supplierId, supplierId));
      await db.delete(suppliers).where(eq(suppliers.id, supplierId));
    }
    await db.delete(openingStockEntries).where(eq(openingStockEntries.variantId, fx.variantId));
    await cleanOrderTest(fx);
  });

  it("flows from opening stock through sale, stock-out, payment, and reports", async () => {
    await applyOpeningStockEntries({
      entries: [
        {
          variantId: fx.variantId,
          quantity: 10,
          unitCost: 50_000,
          effectiveDate: OPENING_DATE,
        },
      ],
      userId: fx.userId,
    });

    const { order } = await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 2, customPrice: 120_000 }],
    });
    await stockOut({ orderId: order.id, userId: fx.userId });
    await recordPayment({
      orderId: order.id,
      userId: fx.userId,
      amount: 240_000,
      method: PAYMENT_METHOD.CASH,
    });
    await completeOrder({ orderId: order.id, userId: fx.userId });

    await db
      .update(orders)
      .set({
        createdAt: REPORT_DATE,
        stockOutAt: REPORT_DATE,
        completedAt: REPORT_DATE,
        paidAt: REPORT_DATE,
      })
      .where(eq(orders.id, order.id));
    await db.update(payments).set({ createdAt: REPORT_DATE }).where(eq(payments.orderId, order.id));
    await db
      .update(inventoryMovements)
      .set({ createdAt: REPORT_DATE })
      .where(eq(inventoryMovements.referenceId, order.id));

    const [finalOrder] = await db.select().from(orders).where(eq(orders.id, order.id));
    expect(finalOrder.paymentStatus).toBe(PAYMENT_STATUS.PAID);
    expect(money(finalOrder.totalCost)).toBe(100_000);
    expect(money(finalOrder.profit)).toBe(140_000);

    const [line] = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    expect(money(line.costPriceAtOrderTime)).toBe(50_000);

    const stock = await getCurrentStockReport({ search: fx.testId });
    expect(stock.data[0]).toMatchObject({ onHand: 8, costPrice: 50_000, stockValue: 400_000 });

    const ledger = await getLedgerReport({
      variantId: fx.variantId,
      startDate: OPENING_DATE,
      endDate: new Date(2026, 3, 16),
    });
    expect(ledger.kpi).toMatchObject({ openingBalance: 0, closingBalance: 8 });

    const movement = await getInOutMovementReport({ ...PERIOD, search: fx.testId });
    expect(movement.data[0]).toMatchObject({ opening: 10, qtyOut: 2, closing: 8 });

    const finance = await getFinancialStats(PERIOD);
    expect(finance).toMatchObject({ revenue: 240_000, cogs: 100_000, grossProfit: 140_000 });

    const pnl = await getProfitLossReport({ ...PERIOD, compare: false });
    expect(pnl.current).toMatchObject({
      salesRevenue: 240_000,
      cogs: 100_000,
      grossProfit: 140_000,
    });
  });

  it("uses opening stock cost in WAC after later supplier receipt", async () => {
    await applyOpeningStockEntries({
      entries: [
        { variantId: fx.variantId, quantity: 10, unitCost: 50_000, effectiveDate: OPENING_DATE },
      ],
      userId: fx.userId,
    });

    const [supplier] = await db
      .insert(suppliers)
      .values({ code: `NCC-OPEN-${fx.testId}`, name: `Opening Supplier ${fx.testId}` })
      .returning();
    supplierId = supplier.id;

    const purchaseOrder = await createPurchaseOrder({
      supplierId,
      createdBy: fx.userId,
      items: [{ variantId: fx.variantId, orderedQty: 10, unitCost: "70000" }],
    });
    await confirmPurchaseOrder(purchaseOrder.id, fx.userId);
    const purchase = await getPurchaseOrderById(purchaseOrder.id);
    const receipt = await createGoodsReceipt({
      purchaseOrderId: purchaseOrder.id,
      supplierId,
      createdBy: fx.userId,
      invoiceRef: `OPEN-WAC-${fx.testId}`,
      items: [
        {
          variantId: fx.variantId,
          purchaseOrderItemId: purchase?.items[0]?.id,
          quantity: 10,
          unitCost: "70000",
        },
      ],
    });
    await createSupplierPayment({
      supplierId,
      receiptId: receipt.id,
      amount: "700000",
      method: PAYMENT_METHOD.CASH,
      paidAt: REPORT_DATE,
      createdBy: fx.userId,
    });
    const completedReceipt = await completeGoodsReceipt(receipt.id, fx.userId);
    expect(completedReceipt.status).toBe(RECEIPT_STATUS.COMPLETED);

    const [variant] = await db
      .select({ onHand: productVariants.onHand, costPrice: productVariants.costPrice })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(variant).toEqual({ onHand: 20, costPrice: "60000.00" });

    const stock = await getCurrentStockReport({ search: fx.testId });
    expect(stock.data[0]).toMatchObject({ onHand: 20, costPrice: 60_000, stockValue: 1_200_000 });
  });

  it("rechained live movement history when correcting opening stock", async () => {
    await applyOpeningStockEntries({
      entries: [
        { variantId: fx.variantId, quantity: 10, unitCost: 50_000, effectiveDate: OPENING_DATE },
      ],
      userId: fx.userId,
    });
    await db.insert(inventoryMovements).values({
      variantId: fx.variantId,
      type: "stock_out",
      quantity: -2,
      onHandBefore: 10,
      onHandAfter: 8,
      createdAt: new Date("2026-04-02T00:00:00Z"),
      createdBy: fx.userId,
    });
    await db.insert(inventoryMovements).values({
      variantId: fx.variantId,
      type: "supplier_receipt",
      quantity: 5,
      onHandBefore: 8,
      onHandAfter: 13,
      createdAt: new Date("2026-04-03T00:00:00Z"),
      createdBy: fx.userId,
    });

    await applyOpeningStockEntries({
      entries: [
        { variantId: fx.variantId, quantity: 12, unitCost: 50_000, effectiveDate: OPENING_DATE },
      ],
      userId: fx.userId,
    });

    const movements = await db
      .select({
        quantity: inventoryMovements.quantity,
        onHandBefore: inventoryMovements.onHandBefore,
        onHandAfter: inventoryMovements.onHandAfter,
      })
      .from(inventoryMovements)
      .where(eq(inventoryMovements.variantId, fx.variantId))
      .orderBy(inventoryMovements.createdAt, inventoryMovements.id);

    expect(movements).toEqual([
      { quantity: 12, onHandBefore: 0, onHandAfter: 12 },
      { quantity: -2, onHandBefore: 12, onHandAfter: 10 },
      { quantity: 5, onHandBefore: 10, onHandAfter: 15 },
    ]);
  });
});
