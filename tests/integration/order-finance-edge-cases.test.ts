import { PAYMENT_METHOD } from "@workspace/shared/constants";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { orderItems, orders } from "@/db/schema/orders";
import { productVariants } from "@/db/schema/products";
import { goodsReceipts, supplierPayments } from "@/db/schema/receipts";
import { suppliers } from "@/db/schema/suppliers";
import { getFinancialStats } from "@/services/finance.server";
import { completeGoodsReceipt, createGoodsReceipt } from "@/services/goods-receipt.server";
import { createOrder, stockOut } from "@/services/order.server";
import { getProfitLossReport } from "@/services/report.server";
import { createSupplierPayment } from "@/services/supplier-payment.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "../unit/services/fixtures";

const REPORT_DATE = new Date(2026, 3, 15, 10, 0, 0);
const PERIOD = {
  startDate: new Date(2026, 3, 15),
  endDate: new Date(2026, 3, 15),
};

function money(value: string | null | undefined) {
  return Number(value ?? 0);
}

async function putOrderInReportPeriod(orderId: string) {
  await db
    .update(orders)
    .set({
      createdAt: new Date(2026, 2, 1, 9, 0, 0),
      stockOutAt: REPORT_DATE,
    })
    .where(eq(orders.id, orderId));
}

describe("order finance edge cases", () => {
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
      .values({ code: `NCC-${fx.testId}`, name: `Supplier ${fx.testId}` })
      .returning();
    supplierId = supplier.id;
  });

  afterEach(async () => {
    if (supplierId) {
      await db.delete(supplierPayments).where(eq(supplierPayments.supplierId, supplierId));
      await db.delete(goodsReceipts).where(eq(goodsReceipts.supplierId, supplierId));
      await db.delete(suppliers).where(eq(suppliers.id, supplierId));
    }
    await cleanOrderTest(fx);
  });

  async function receiveStock(quantity: number, unitCost: number) {
    const receipt = await createGoodsReceipt({
      supplierId,
      createdBy: fx.userId,
      items: [{ variantId: fx.variantId, quantity, unitCost: `${unitCost}` }],
    });
    await createSupplierPayment({
      supplierId: supplierId!,
      receiptId: receipt.id,
      amount: `${quantity * unitCost}`,
      method: PAYMENT_METHOD.CASH,
      paidAt: REPORT_DATE,
      createdBy: fx.userId,
    });
    return completeGoodsReceipt(receipt.id, fx.userId);
  }

  async function createAndStockOut(quantity: number, unitPrice: number) {
    const { order } = await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity, customPrice: unitPrice }],
    });
    await stockOut({ orderId: order.id, userId: fx.userId });
    await putOrderInReportPeriod(order.id);
    return order;
  }

  it("excludes stock-out orders with missing cost from official P&L totals", async () => {
    const order = await createAndStockOut(1, 150_000);

    const [line] = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    expect(money(line.lineCost)).toBe(0);

    const finance = await getFinancialStats(PERIOD);
    expect(finance).toMatchObject({
      revenue: 0,
      cogs: 0,
      grossProfit: 0,
      netProfit: 0,
      orderCount: 0,
      missingCostItems: 1,
      missingCostOrderCount: 1,
      excludedRevenue: 150_000,
    });

    const pnl = await getProfitLossReport({ ...PERIOD, compare: false });
    expect(pnl.current).toMatchObject({
      salesRevenue: 0,
      cogs: 0,
      grossProfit: 0,
      netProfit: 0,
      orderCount: 0,
      missingCostItems: 1,
      missingCostOrderCount: 1,
      excludedRevenue: 150_000,
    });
  });

  it("recognizes fulfilled profit by stockOutAt even when order was created earlier", async () => {
    await receiveStock(1, 90_000);
    await createAndStockOut(1, 150_000);

    const finance = await getFinancialStats(PERIOD);
    expect(finance).toMatchObject({
      revenue: 150_000,
      cogs: 90_000,
      grossProfit: 60_000,
      netProfit: 60_000,
      orderCount: 1,
      missingCostItems: 0,
    });
  });

  it("reports negative gross profit when sale price is below stocked cost", async () => {
    const unitCost = 120_000;
    const unitPrice = 100_000;
    await receiveStock(1, unitCost);
    await createAndStockOut(1, unitPrice);

    const finance = await getFinancialStats(PERIOD);
    expect(finance).toMatchObject({
      revenue: unitPrice,
      cogs: unitCost,
      grossProfit: -20_000,
      netProfit: -20_000,
      orderCount: 1,
    });
  });

  it("updates WAC across later receipts and stock-out snapshots each order's current WAC", async () => {
    await receiveStock(4, 90_000);
    const firstOrder = await createAndStockOut(2, 150_000);

    await receiveStock(2, 110_000);
    const [variantAfterSecondReceipt] = await db
      .select({ onHand: productVariants.onHand, costPrice: productVariants.costPrice })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(variantAfterSecondReceipt).toEqual({ onHand: 4, costPrice: "100000.00" });

    const secondOrder = await createAndStockOut(1, 150_000);

    const [firstLine] = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, firstOrder.id));
    const [secondLine] = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, secondOrder.id));
    expect(money(firstLine.costPriceAtOrderTime)).toBe(90_000);
    expect(money(secondLine.costPriceAtOrderTime)).toBe(100_000);

    const finance = await getFinancialStats(PERIOD);
    expect(finance).toMatchObject({
      revenue: 450_000,
      cogs: 280_000,
      grossProfit: 170_000,
      netProfit: 170_000,
      orderCount: 2,
      missingCostItems: 0,
    });
  });
});
