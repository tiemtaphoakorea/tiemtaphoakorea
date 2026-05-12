import { expect, loginAsAdmin, test } from "../fixtures/auth";

const pnlPayload = {
  current: {
    salesRevenue: 0,
    cogs: 0,
    grossProfit: 0,
    otherIncome: 0,
    otherExpense: 0,
    netProfit: 0,
    orderCount: 0,
    missingCostItems: 1,
    missingCostOrderCount: 1,
    missingCostRate: 1,
    excludedRevenue: 300_000,
  },
  previous: null,
  delta: null,
  period: {
    startDate: "2026-05-01T00:00:00.000Z",
    endDate: "2026-05-12T23:59:59.999Z",
  },
  previousPeriod: null,
};

const missingCostPayload = {
  data: [
    {
      orderId: "order-1",
      orderNumber: "ORD-MISS-001",
      customerName: "Nguyen Van A",
      customerPhone: "0900000000",
      stockOutAt: "2026-05-12T10:00:00.000Z",
      revenue: 300_000,
      missingCostItemCount: 1,
      items: [
        {
          orderItemId: "item-1",
          variantId: "variant-1",
          productName: "Áo order Nhật",
          variantName: "Size M",
          sku: "JP-SHIRT-M",
          quantity: 2,
          unitPrice: 150_000,
          lineTotal: 300_000,
          lineCost: 0,
          currentCostPrice: 80_000,
        },
      ],
    },
  ],
  summary: {
    orderCount: 1,
    itemCount: 1,
    excludedRevenue: 300_000,
  },
  metadata: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

test.describe("Finance - Missing cost exceptions", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("shows drill-down and lets owner submit missing unit cost", async ({ page }) => {
    await page.route("**/api/admin/reports/profit-loss?**", async (route) => {
      await route.fulfill({ json: pnlPayload });
    });
    await page.route("**/api/admin/reports/profit-loss/missing-cost?**", async (route) => {
      await route.fulfill({ json: missingCostPayload });
    });
    await page.route("**/api/admin/orders/order-1/items/item-1/cost", async (route) => {
      await route.fulfill({ json: { success: true, order: { id: "order-1" } } });
    });

    await page.goto("/reports/profit-loss");

    await expect(page.getByText("Đã loại đơn thiếu giá vốn khỏi P&L")).toBeVisible();
    await page.getByRole("link", { name: /xem đơn thiếu giá vốn/i }).click();

    await expect(page).toHaveURL(/\/reports\/profit-loss\/missing-cost/);
    await expect(page.getByText("ORD-MISS-001")).toBeVisible();
    await expect(page.getByText("JP-SHIRT-M")).toBeVisible();

    await page.getByRole("button", { name: /bổ sung giá vốn/i }).click();
    await page.getByRole("textbox", { name: /giá vốn/i }).fill("80000");
    await page.getByRole("button", { name: /lưu giá vốn|cập nhật/i }).click();

    await expect(page.getByText(/đã cập nhật|đã bổ sung/i)).toBeVisible();
  });
});
