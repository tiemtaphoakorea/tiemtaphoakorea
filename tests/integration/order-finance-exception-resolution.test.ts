import { PAYMENT_METHOD } from "@workspace/shared/constants";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { inventoryMovements } from "@/db/schema/inventory";
import { orderItems, orders, payments } from "@/db/schema/orders";
import { productVariants } from "@/db/schema/products";
import { getFinancialStats } from "@/services/finance.server";
import { createOrder, recordPayment, returnOrder, stockOut } from "@/services/order.server";
import { getCashFlowReport } from "@/services/report.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "../unit/services/fixtures";

const REPORT_DATE = new Date(2026, 4, 12, 10, 0, 0);
const PERIOD = {
  startDate: new Date(2026, 4, 12),
  endDate: new Date(2026, 4, 12),
};

function money(value: string | null | undefined) {
  return Number(value ?? 0);
}

async function putOrderInReportPeriod(orderId: string) {
  await db
    .update(orders)
    .set({
      createdAt: new Date(2026, 3, 30, 9, 0, 0),
      stockOutAt: REPORT_DATE,
    })
    .where(eq(orders.id, orderId));
}

async function createMissingCostStockOutOrder(fx: OrderTestFixture) {
  await db
    .update(productVariants)
    .set({ onHand: 0, reserved: 0, costPrice: "0" })
    .where(eq(productVariants.id, fx.variantId));

  const { order } = await createOrder({
    customerId: fx.customerId,
    userId: fx.userId,
    items: [{ variantId: fx.variantId, quantity: 2, customPrice: 150_000 }],
    autoCreatePurchaseOrder: false,
  });
  await stockOut({ orderId: order.id, userId: fx.userId });
  await putOrderInReportPeriod(order.id);
  return order;
}

describe("order finance exception resolution", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await db.delete(inventoryMovements).where(eq(inventoryMovements.variantId, fx.variantId));
    await cleanOrderTest(fx);
  });

  it("lists delivered orders excluded from P&L because cost is missing", async () => {
    const order = await createMissingCostStockOutOrder(fx);

    const { getMissingCostOrdersReport } = (await import("@/services/report.server")) as any;
    const report = await getMissingCostOrdersReport(PERIOD);

    expect(report.summary).toMatchObject({
      orderCount: 1,
      itemCount: 1,
      excludedRevenue: 300_000,
    });
    const row = report.data.find((item: any) => item.orderId === order.id);
    expect(row).toMatchObject({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: `Customer ${fx.testId}`,
      revenue: 300_000,
      missingCostItemCount: 1,
    });
    expect(row.items).toHaveLength(1);
    expect(row.items[0]).toMatchObject({
      variantId: fx.variantId,
      sku: `SKU-${fx.testId}`,
      quantity: 2,
      lineTotal: 300_000,
      lineCost: 0,
      currentCostPrice: 0,
    });
  });

  it("moves an excluded stock-out order back into official P&L after unit cost is supplied", async () => {
    const order = await createMissingCostStockOutOrder(fx);
    const [item] = await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    const { updateStockOutOrderItemCost } = (await import("@/services/order.server")) as any;
    await updateStockOutOrderItemCost({
      orderItemId: item.id,
      unitCost: 80_000,
      userId: fx.userId,
      note: "Bổ sung giá vốn sau khi hàng về",
    });

    const [updatedItem] = await db
      .select({
        costPriceAtOrderTime: orderItems.costPriceAtOrderTime,
        lineCost: orderItems.lineCost,
        lineProfit: orderItems.lineProfit,
      })
      .from(orderItems)
      .where(eq(orderItems.id, item.id));
    expect(money(updatedItem.costPriceAtOrderTime)).toBe(80_000);
    expect(money(updatedItem.lineCost)).toBe(160_000);
    expect(money(updatedItem.lineProfit)).toBe(140_000);

    const [updatedOrder] = await db
      .select({ totalCost: orders.totalCost, profit: orders.profit })
      .from(orders)
      .where(eq(orders.id, order.id));
    expect(money(updatedOrder.totalCost)).toBe(160_000);
    expect(money(updatedOrder.profit)).toBe(140_000);

    const finance = await getFinancialStats(PERIOD);
    expect(finance).toMatchObject({
      revenue: 300_000,
      cogs: 160_000,
      grossProfit: 140_000,
      orderCount: 1,
      missingCostItems: 0,
      missingCostOrderCount: 0,
      excludedRevenue: 0,
    });

    const { getMissingCostOrdersReport } = (await import("@/services/report.server")) as any;
    const exceptions = await getMissingCostOrdersReport(PERIOD);
    expect(exceptions.summary).toMatchObject({
      orderCount: 0,
      itemCount: 0,
      excludedRevenue: 0,
    });
  });

  it("removes returned delivered orders from P&L while keeping the customer cash receipt visible", async () => {
    await db
      .update(productVariants)
      .set({ onHand: 10, reserved: 0, costPrice: "80000" })
      .where(eq(productVariants.id, fx.variantId));

    const { order } = await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 2, customPrice: 150_000 }],
      autoCreatePurchaseOrder: false,
    });
    await stockOut({ orderId: order.id, userId: fx.userId });
    await putOrderInReportPeriod(order.id);
    await recordPayment({
      orderId: order.id,
      userId: fx.userId,
      amount: 300_000,
      method: PAYMENT_METHOD.CASH,
      note: "Khách đã thanh toán khi nhận hàng",
    });
    await db.update(payments).set({ createdAt: REPORT_DATE }).where(eq(payments.orderId, order.id));

    const beforeReturn = await getFinancialStats(PERIOD);
    expect(beforeReturn).toMatchObject({
      revenue: 300_000,
      cogs: 160_000,
      grossProfit: 140_000,
      orderCount: 1,
    });

    await returnOrder({
      orderId: order.id,
      userId: fx.userId,
      reason: "Khách trả hàng sau khi nhận",
    });

    const afterReturn = await getFinancialStats(PERIOD);
    expect(afterReturn).toMatchObject({
      revenue: 0,
      cogs: 0,
      grossProfit: 0,
      orderCount: 0,
    });

    const cashFlow = await getCashFlowReport({ ...PERIOD, groupBy: "day" });
    expect(cashFlow.breakdown.customerPayments).toBe(300_000);
    expect(cashFlow.totalInflow).toBe(300_000);
    expect(cashFlow.netCashFlow).toBe(300_000);
  });
});
