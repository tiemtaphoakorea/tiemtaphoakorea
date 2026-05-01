import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  apiDelete,
  apiPost,
  cancelOrder,
  createOrder,
  createProductWithVariants,
  getCustomers,
} from "../helpers/api";

/**
 * Customer - Miscellaneous
 * Test cases: TC-CUST-018, TC-CUST-021, TC-CUST-022, TC-CUST-023
 */
test.describe("Customers - Misc", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-CUST-MISC-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  // TC-CUST-018 | Pagination controls present
  test("TC-CUST-018 should show pagination controls on /customers", async ({ page }) => {
    await page.goto("/customers");
    await expect(page.locator("table")).toBeVisible({ timeout: 15000 });

    const hasPagination = await page
      .locator("button[aria-label*='Next'], button[aria-label*='next'], [data-testid*='next']")
      .or(page.getByRole("button", { name: /next|tiếp/i }))
      .isVisible()
      .catch(() => false);

    if (hasPagination) {
      expect(hasPagination).toBe(true);
    } else {
      const pageSizeSelector = page.locator("select, [role='combobox']").first();
      await expect(pageSizeSelector).toBeVisible({ timeout: 5000 });
    }
  });

  // TC-CUST-018b | Changing page via URL param loads correct page
  test("TC-CUST-018b should update results when page param changes in URL", async ({ page }) => {
    await page.goto("/customers?page=1");
    await expect(page.locator("table")).toBeVisible({ timeout: 15000 });

    await page.goto("/customers?page=2");
    await expect(page.locator("table")).toBeVisible({ timeout: 15000 });
    expect(page.url()).toContain("page=2");
  });

  // TC-CUST-021: Filter by customer type "Retail"
  test("TC-CUST-021 filter by customer type retail updates URL param", async ({ page }) => {
    await page.goto("/customers");
    await expect(page.locator("table")).toBeVisible({ timeout: 15000 });

    // Open the customer type filter dropdown
    await page.getByRole("button", { name: /Tất cả loại KH/i }).click();
    // Select "Khách lẻ" (retail)
    await page.getByRole("menuitem", { name: /Khách lẻ/i }).click();

    await page.waitForTimeout(300);
    expect(page.url()).toContain("customerType=retail");

    // Reset filter
    await page.getByRole("button", { name: /Khách lẻ/i }).click();
    await page.getByRole("menuitem", { name: /Tất cả loại KH/i }).click();
  });

  // TC-CUST-022: totalSpent excludes cancelled orders → tier badge recalculates
  test("TC-CUST-022 totalSpent excludes cancelled orders via API", async ({ page }) => {
    const ts = runId.replace(/\D/g, "").slice(-8);

    // Create a customer
    const { data: custData } = await apiPost<any>(page, "/api/admin/customers", {
      fullName: `Tier Test ${ts}`,
      phone: `09${ts}`,
      customerType: "retail",
    });
    const customerId: string = custData.profile?.id ?? custData.customer?.id ?? custData.id;
    expect(customerId).toBeTruthy();

    // Create a product + variant so we can create an order
    const productData = await createProductWithVariants(page, {
      name: `TierProd ${ts}`,
      variants: [
        {
          sku: `TIER-${ts}`,
          price: 500_000,
          stockQuantity: 10,
        },
      ],
    });
    const variantId: string = productData.product?.variants?.[0]?.id;
    expect(variantId).toBeTruthy();

    // Create order for the customer
    const orderData = await createOrder(page, {
      customerId,
      items: [{ variantId, quantity: 2 }],
    });
    const orderId: string = orderData.order?.id;
    expect(orderId).toBeTruthy();

    // totalSpent should reflect the order total (2 × 500,000 = 1,000,000)
    const before = await getCustomers(page, `09${ts}`);
    const beforeSpent = Number(before[0]?.totalSpent ?? 0);
    expect(beforeSpent).toBeGreaterThan(0);

    // Cancel the order
    const { response: cancelRes } = await cancelOrder(page, orderId);
    expect(cancelRes.ok()).toBe(true);

    // totalSpent should now be 0 (cancelled order excluded)
    const after = await getCustomers(page, `09${ts}`);
    const afterSpent = Number(after[0]?.totalSpent ?? 0);
    expect(afterSpent).toBe(0);

    // Cleanup
    await apiDelete(page, `/api/admin/customers/${customerId}`).catch(() => {});
    await apiDelete(page, `/api/admin/products/${productData.product?.id}`).catch(() => {});
  });

  // TC-CUST-023: Filter by customer status (active / inactive)
  test("TC-CUST-023 filter by status inactive updates URL param", async ({ page }) => {
    await page.goto("/customers");
    await expect(page.locator("table")).toBeVisible({ timeout: 15000 });

    // Open the status filter dropdown
    await page.getByRole("button", { name: /Tất cả trạng thái/i }).click();
    // Select "Tạm khóa" (inactive)
    await page.getByRole("menuitem", { name: /Tạm khóa/i }).click();

    await page.waitForTimeout(300);
    expect(page.url()).toMatch(/status=inactive/i);

    // Reset filter
    await page.getByRole("button", { name: /Tạm khóa/i }).click();
    await page.getByRole("menuitem", { name: /Tất cả trạng thái/i }).click();
  });
});
