import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import { createOrder, findVariantIdBySku, getCustomerByPhone } from "../helpers/api";

/**
 * Order - Search
 * Test cases: TC-ORD-002, TC-ORD-003
 *
 * NOTE: TC-ORD-002 in validation.spec.ts covers API-level validation errors.
 * This spec covers UI search behaviour on the orders list page.
 */
test.describe("Order - Search", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-ORD-002 should filter order list by order number", async ({ page }) => {
    test.setTimeout(60000);

    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    expect(customer?.id).toBeTruthy();
    expect(variantId).toBeTruthy();

    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });
    expect(result.success).toBe(true);
    const { orderNumber } = result.order;

    await page.goto("/orders");
    await page.waitForLoadState("networkidle");

    // Type the order number into the search field
    const searchInput = page.getByPlaceholder(/Tìm mã đơn hàng/);
    await searchInput.fill(orderNumber);

    // Wait for debounce + list refresh
    await page.waitForTimeout(600);
    await page.waitForLoadState("networkidle");

    // The created order must appear in the filtered results
    await expect(page.getByText(orderNumber)).toBeVisible({ timeout: 10000 });
  });

  test("TC-ORD-003 should filter order list by customer name", async ({ page }) => {
    test.setTimeout(60000);

    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    expect(customer?.id).toBeTruthy();
    // fullName is not in the getCustomerByPhone return type; use the known fixture value
    const customerName: string = TEST_CUSTOMERS.primary.fullName;

    await page.goto("/orders");
    await page.waitForLoadState("networkidle");

    // Type the customer name in the search field
    const searchInput = page.getByPlaceholder(/Tìm mã đơn hàng/);
    await searchInput.fill(customerName);

    // Wait for debounce + list refresh
    await page.waitForTimeout(600);
    await page.waitForLoadState("networkidle");

    // At least one row should appear with the customer's name
    await expect(page.getByText(customerName).first()).toBeVisible({ timeout: 10000 });

    // All visible rows in the table body should belong to this customer
    // (every row that has a customer name cell must show the searched customer)
    const customerCells = page.locator("table tbody tr").filter({ hasText: customerName });
    const allRows = page.locator("table tbody tr");
    const totalRows = await allRows.count();
    const matchingRows = await customerCells.count();
    expect(matchingRows).toBe(totalRows);
  });
});
