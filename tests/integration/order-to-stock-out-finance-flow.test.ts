import {
  FULFILLMENT_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  PURCHASE_ORDER_STATUS,
  RECEIPT_STATUS,
  SUPPLIER_ORDER_STATUS,
} from "@workspace/shared/constants";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { inventoryMovements } from "@/db/schema/inventory";
import { orderItems, orders, payments, supplierOrders } from "@/db/schema/orders";
import { productVariants } from "@/db/schema/products";
import { purchaseOrders } from "@/db/schema/purchases";
import { goodsReceipts, supplierPayments } from "@/db/schema/receipts";
import { suppliers } from "@/db/schema/suppliers";
import { getDayOrders, getFinancialStats } from "@/services/finance.server";
import { completeGoodsReceipt, createGoodsReceipt } from "@/services/goods-receipt.server";
import { completeOrder, createOrder, recordPayment, stockOut } from "@/services/order.server";
import {
  confirmPurchaseOrder,
  createPurchaseOrder,
  getPurchaseOrderById,
} from "@/services/purchase-order.server";
import {
  getCashFlowReport,
  getCashFlowTransactions,
  getCustomerDebtsReport,
  getProfitLossReport,
  getSupplierDebtsReport,
} from "@/services/report.server";
import {
  getPayoutsByMethodReport,
  getPurchasesBySupplierReport,
} from "@/services/report-purchases.server";
import { createSupplierPayment } from "@/services/supplier-payment.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "../unit/services/fixtures";

const SALE_QTY = 2;
const UNIT_PRICE = 150_000;
const UNIT_COST = 90_000;
const SHIPPING_FEE = 20_000;
const SUBTOTAL = SALE_QTY * UNIT_PRICE;
const COGS = SALE_QTY * UNIT_COST;
const ORDER_TOTAL = SUBTOTAL + SHIPPING_FEE;
const ORDER_PROFIT = SUBTOTAL - COGS;
const REPORT_DAY = "2026-04-15";

function money(value: string | null | undefined) {
  return Number(value ?? 0);
}

async function moveFlowIntoReportDay(
  orderId: string,
  receiptId: string,
  supplierPaymentId: string,
) {
  const reportDate = new Date(2026, 3, 15, 10, 0, 0);

  await db
    .update(orders)
    .set({
      createdAt: reportDate,
      stockOutAt: reportDate,
      completedAt: reportDate,
      paidAt: reportDate,
    })
    .where(eq(orders.id, orderId));
  await db.update(payments).set({ createdAt: reportDate }).where(eq(payments.orderId, orderId));
  await db
    .update(goodsReceipts)
    .set({ createdAt: reportDate, receivedAt: reportDate })
    .where(eq(goodsReceipts.id, receiptId));
  await db
    .update(supplierPayments)
    .set({ paidAt: reportDate })
    .where(eq(supplierPayments.id, supplierPaymentId));
}

describe("order-to-stock-out finance flow", () => {
  let fx: OrderTestFixture;
  let supplierId: string | undefined;

  beforeEach(async () => {
    fx = await seedOrderTest();
    await db
      .update(productVariants)
      .set({ onHand: 0, reserved: 0, costPrice: "0" })
      .where(eq(productVariants.id, fx.variantId));

    const [supplier] = await db
      .insert(suppliers)
      .values({
        code: `NCC-${fx.testId}`,
        name: `Supplier ${fx.testId}`,
      })
      .returning();
    supplierId = supplier.id;
  });

  afterEach(async () => {
    if (supplierId) {
      await db.delete(supplierPayments).where(eq(supplierPayments.supplierId, supplierId));
      await db.delete(goodsReceipts).where(eq(goodsReceipts.supplierId, supplierId));
      await db.delete(purchaseOrders).where(eq(purchaseOrders.supplierId, supplierId));
      await db.delete(suppliers).where(eq(suppliers.id, supplierId));
    }
    await cleanOrderTest(fx);
  });

  it("covers preorder purchase, receipt, stock-out, payment, and per-order P&L reports", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      shippingFee: SHIPPING_FEE,
      items: [{ variantId: fx.variantId, quantity: SALE_QTY, customPrice: UNIT_PRICE }],
    });

    const autoOrders = await db
      .select()
      .from(supplierOrders)
      .where(eq(supplierOrders.variantId, fx.variantId));
    expect(autoOrders).toHaveLength(1);
    expect(autoOrders[0].status).toBe(SUPPLIER_ORDER_STATUS.PENDING);
    expect(autoOrders[0].quantity).toBe(SALE_QTY);

    const purchaseOrder = await createPurchaseOrder({
      supplierId,
      createdBy: fx.userId,
      items: [{ variantId: fx.variantId, orderedQty: SALE_QTY, unitCost: `${UNIT_COST}` }],
    });
    await confirmPurchaseOrder(purchaseOrder.id, fx.userId);

    const confirmedPurchase = await getPurchaseOrderById(purchaseOrder.id);
    const purchaseItem = confirmedPurchase?.items[0];
    expect(confirmedPurchase?.status).toBe(PURCHASE_ORDER_STATUS.ORDERED);
    expect(purchaseItem?.receivedQty).toBe(0);

    const receipt = await createGoodsReceipt({
      purchaseOrderId: purchaseOrder.id,
      supplierId,
      createdBy: fx.userId,
      invoiceRef: `INV-${fx.testId}`,
      items: [
        {
          variantId: fx.variantId,
          purchaseOrderItemId: purchaseItem?.id,
          quantity: SALE_QTY,
          unitCost: `${UNIT_COST}`,
        },
      ],
    });
    const supplierPayment = await createSupplierPayment({
      supplierId: supplierId!,
      receiptId: receipt.id,
      amount: `${COGS}`,
      method: PAYMENT_METHOD.CASH,
      paidAt: new Date(2026, 3, 15, 10, 0, 0),
      createdBy: fx.userId,
    });
    const completedReceipt = await completeGoodsReceipt(receipt.id, fx.userId);
    expect(completedReceipt.status).toBe(RECEIPT_STATUS.COMPLETED);

    const [variantAfterReceipt] = await db
      .select({
        onHand: productVariants.onHand,
        reserved: productVariants.reserved,
        costPrice: productVariants.costPrice,
      })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(variantAfterReceipt).toEqual({
      onHand: SALE_QTY,
      reserved: SALE_QTY,
      costPrice: `${UNIT_COST}.00`,
    });

    await stockOut({ orderId: order.id, userId: fx.userId });
    await recordPayment({
      orderId: order.id,
      userId: fx.userId,
      amount: ORDER_TOTAL,
      method: PAYMENT_METHOD.CASH,
    });
    await completeOrder({ orderId: order.id, userId: fx.userId });
    await moveFlowIntoReportDay(order.id, receipt.id, supplierPayment.id);

    const [finalOrder] = await db.select().from(orders).where(eq(orders.id, order.id));
    expect(finalOrder.paymentStatus).toBe(PAYMENT_STATUS.PAID);
    expect(finalOrder.fulfillmentStatus).toBe(FULFILLMENT_STATUS.COMPLETED);
    expect(money(finalOrder.subtotal)).toBe(SUBTOTAL);
    expect(money(finalOrder.shippingFee)).toBe(SHIPPING_FEE);
    expect(money(finalOrder.total)).toBe(ORDER_TOTAL);
    expect(money(finalOrder.totalCost)).toBe(COGS);
    expect(money(finalOrder.profit)).toBe(ORDER_PROFIT);
    expect(money(finalOrder.paidAmount)).toBe(ORDER_TOTAL);

    const [line] = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    expect(money(line.costPriceAtOrderTime)).toBe(UNIT_COST);
    expect(money(line.lineCost)).toBe(COGS);
    expect(money(line.lineProfit)).toBe(ORDER_PROFIT);

    const [variantAfterStockOut] = await db
      .select({ onHand: productVariants.onHand, reserved: productVariants.reserved })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(variantAfterStockOut).toEqual({ onHand: 0, reserved: 0 });

    const movements = await db
      .select({
        type: inventoryMovements.type,
        quantity: inventoryMovements.quantity,
        onHandBefore: inventoryMovements.onHandBefore,
        onHandAfter: inventoryMovements.onHandAfter,
      })
      .from(inventoryMovements)
      .where(eq(inventoryMovements.variantId, fx.variantId));
    expect(movements).toEqual(
      expect.arrayContaining([
        { type: "supplier_receipt", quantity: SALE_QTY, onHandBefore: 0, onHandAfter: SALE_QTY },
        { type: "stock_out", quantity: -SALE_QTY, onHandBefore: SALE_QTY, onHandAfter: 0 },
      ]),
    );

    const period = {
      startDate: new Date(2026, 3, 15),
      endDate: new Date(2026, 3, 15),
    };

    const finance = await getFinancialStats(period);
    expect(finance).toMatchObject({
      revenue: SUBTOTAL,
      cogs: COGS,
      grossProfit: ORDER_PROFIT,
      expenses: 0,
      supplierPayouts: COGS,
      netProfit: ORDER_PROFIT,
      orderCount: 1,
      missingCostItems: 0,
      missingCostRate: 0,
    });

    const pnl = await getProfitLossReport({ ...period, compare: false });
    expect(pnl.current).toMatchObject({
      salesRevenue: SUBTOTAL,
      cogs: COGS,
      grossProfit: ORDER_PROFIT,
      otherExpense: 0,
      netProfit: ORDER_PROFIT,
      orderCount: 1,
    });

    const dayOrder = (await getDayOrders(REPORT_DAY)).find((row) => row.id === order.id);
    expect(dayOrder).toMatchObject({
      cogs: COGS,
      grossProfit: ORDER_PROFIT,
    });

    const customerDebts = await getCustomerDebtsReport({ ...period, includeZero: true });
    const customerDebt = customerDebts.data.find((row) => row.customerId === fx.customerId);
    expect(customerDebt).toMatchObject({
      debtIncrease: ORDER_TOTAL,
      debtDecrease: ORDER_TOTAL,
      closingDebt: 0,
    });

    const supplierDebts = await getSupplierDebtsReport({ ...period, includeZero: true });
    const supplierDebt = supplierDebts.data.find((row) => row.supplierId === supplierId);
    expect(supplierDebt).toMatchObject({
      debtIncrease: COGS,
      debtDecrease: COGS,
      closingDebt: 0,
    });

    const cashFlow = await getCashFlowReport(period);
    expect(cashFlow).toMatchObject({
      totalInflow: ORDER_TOTAL,
      totalOutflow: COGS,
      netCashFlow: ORDER_TOTAL - COGS,
      breakdown: {
        customerPayments: ORDER_TOTAL,
        supplierPayments: COGS,
        expenses: 0,
      },
    });

    const cashFlowTransactions = await getCashFlowTransactions(period);
    expect(cashFlowTransactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "supplier-payment",
          reference: supplierPayment.code,
          amount: -COGS,
        }),
      ]),
    );

    const purchasesBySupplier = await getPurchasesBySupplierReport(period);
    const supplierPurchase = purchasesBySupplier.data.find((row) => row.supplierId === supplierId);
    expect(supplierPurchase).toMatchObject({
      receiptCount: 1,
      totalQty: SALE_QTY,
      payableAmount: COGS,
      paidAmount: COGS,
      debtAmount: 0,
    });

    const payoutsByMethod = await getPayoutsByMethodReport(period);
    expect(payoutsByMethod).toMatchObject({
      rows: [
        expect.objectContaining({
          method: PAYMENT_METHOD.CASH,
          txCount: 1,
          totalAmount: COGS,
        }),
      ],
      summary: {
        totalAmount: COGS,
        txCount: 1,
        avgAmount: COGS,
        topMethod: PAYMENT_METHOD.CASH,
      },
    });
  });
});
