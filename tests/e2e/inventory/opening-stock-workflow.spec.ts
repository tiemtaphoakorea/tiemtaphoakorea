import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  apiPost,
  cleanupTestProducts,
  completeOrder,
  createProductWithVariants,
  getCustomers,
  getOrderDetails,
  recordPayment,
  stockOut,
} from "../helpers/api";

test.describe("Inventory - Opening Stock Workflow UI", () => {
  test.describe.configure({ mode: "serial", timeout: 90000 });

  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `opening-workflow-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestProducts(page, runId);
  });

  test("opening-stock entered from UI supports order UI, stock-out, payment, and reports UI", async ({
    page,
  }) => {
    const sku = `OS-FLOW-${runId}`;
    const customerPhone = `09${String(Date.now()).slice(-8)}`;
    await createProductWithVariants(page, {
      name: `Opening Workflow ${runId}`,
      variants: [{ sku, stockQuantity: 0, retailPrice: 120000, costPrice: 0 }],
    });
    const customers = await getCustomers(page, customerPhone);
    if (customers.length === 0) {
      await apiPost<any>(page, "/api/admin/customers", {
        fullName: `Opening Customer ${runId}`,
        phone: customerPhone,
        customerType: "retail",
      });
    }

    await page.goto("/inventory/opening-stock");
    await page.getByTestId("opening-stock-search").fill(sku);
    await expect(page.getByTestId(`opening-stock-row-${sku}`)).toBeVisible({ timeout: 10000 });
    await page.getByTestId("opening-stock-effective-date").fill("2026-04-01");
    await page.getByTestId(`opening-stock-quantity-${sku}`).fill("10");
    await page.getByTestId(`opening-stock-unit-cost-${sku}`).fill("50000");
    const applyResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/api/admin/inventory/opening-stock/bulk") &&
        res.request().method() === "PATCH",
      { timeout: 30000 },
    );
    await page.getByTestId(`opening-stock-apply-${sku}`).click();
    expect((await applyResponse).ok()).toBe(true);

    await page.goto("/orders/new");
    await page.locator('button[role="combobox"]').first().click();
    await page.getByPlaceholder(/Tìm theo tên hoặc SĐT/i).fill(customerPhone);
    await page.waitForTimeout(500);
    await page.getByRole("option").filter({ hasText: customerPhone }).first().click();

    await page.getByPlaceholder(/Tìm theo tên, mã SKU/i).fill(sku);
    await page.getByRole("option").filter({ hasText: sku }).first().click();
    await page.keyboard.press("Escape");
    const createOrderResponse = page.waitForResponse(
      (res) => res.url().endsWith("/api/admin/orders") && res.request().method() === "POST",
      { timeout: 30000 },
    );
    await page.getByRole("button", { name: /Tạo đơn hàng/i }).click();
    const orderResponse = await createOrderResponse;
    expect(orderResponse.ok()).toBe(true);
    const orderBody = await orderResponse.json();

    const orderId = orderBody.order.id as string;
    await expect(page).toHaveURL(new RegExp(`/orders/${orderId}$`), { timeout: 15000 });
    await stockOut(page, orderId);
    const order = await getOrderDetails(page, orderId);
    await recordPayment(page, orderId, { amount: Number(order.total), method: "cash" });
    await completeOrder(page, orderId);

    await page.goto("/reports/inventory/current-stock");
    await page.getByPlaceholder("Tìm SKU, sản phẩm...").fill(sku);
    await expect(page.getByRole("row").filter({ hasText: sku })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("row").filter({ hasText: sku })).toContainText("9");

    await page.goto("/reports/profit-loss");
    await expect(page.getByText("Báo cáo lãi lỗ")).toBeVisible();
    await expect(page.getByText("Giá vốn").first()).toBeVisible({ timeout: 10000 });
  });
});
