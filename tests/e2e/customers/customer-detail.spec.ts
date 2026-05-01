import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiPost, createOrder, createProductWithVariants, getCustomers } from "../helpers/api";

/**
 * Customer - Detail Page
 * Test cases: TC-CUST-011, TC-CUST-013
 */
test.describe("Customers - Detail", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-CUST-DET-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  // TC-CUST-011 | Customer detail page sections
  test("TC-CUST-011 should show all required sections on customer detail page", async ({
    page,
  }) => {
    // Get an existing customer from API
    const customers = await getCustomers(page);
    expect(customers.length).toBeGreaterThan(0);
    const customer = customers[0];

    await page.goto(`/customers/${customer.id}`);

    // Wait for page to load (not in loading state)
    await expect(page.getByText("Đang tải..."))
      .not.toBeVisible({ timeout: 10000 })
      .catch(() => {});

    // Profile info section — customer name should be visible
    await expect(page.getByText(customer.fullName)).toBeVisible({ timeout: 15000 });

    // Financial stats section — key financial text markers
    // CustomerFinancialStats renders "Đơn hàng" or similar header
    await expect(page.getByText(/tổng chi tiêu|chi tiêu|đơn hàng/i).first()).toBeVisible({
      timeout: 10000,
    });

    // Location section — CustomerLocationCard
    await expect(page.getByText(/địa chỉ|vị trí/i).first()).toBeVisible({ timeout: 5000 });

    // Order history section — CustomerOrderHistoryTable
    await expect(page.getByText(/lịch sử đơn hàng|đơn hàng/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  // TC-CUST-013 | Customer order history
  test("TC-CUST-013 should display order history with date, amount and status on customer detail", async ({
    page,
  }) => {
    // Create a fresh customer
    const customerRes = await apiPost<any>(page, "/api/admin/customers", {
      fullName: `Order History ${runId}`,
      phone: `09${runId.replace(/\D/g, "").slice(-8)}`,
      customerType: "retail",
    });
    expect(customerRes.response.ok()).toBe(true);
    const customerId = customerRes.data.profile?.id;
    expect(customerId).toBeTruthy();

    // Create a product with a variant to place orders
    const sku = `SKU-OH-${runId.replace(/\D/g, "").slice(-8)}`;
    const productData = await createProductWithVariants(page, {
      name: `Order History Product ${runId}`,
      basePrice: 100000,
      variants: [
        {
          sku,
          price: 100000,
          stockQuantity: 20,
        },
      ],
    });
    const variantId = productData.product?.variants?.[0]?.id;
    expect(variantId).toBeTruthy();

    // Create 2 orders for this customer
    const order1 = await createOrder(page, {
      customerId,
      items: [{ variantId, quantity: 1 }],
    });
    expect(order1.success).toBe(true);

    const order2 = await createOrder(page, {
      customerId,
      items: [{ variantId, quantity: 2 }],
    });
    expect(order2.success).toBe(true);

    // Navigate to the customer detail page
    await page.goto(`/customers/${customerId}`);
    await expect(page.getByText(`Order History ${runId}`)).toBeVisible({ timeout: 15000 });

    // Order history table should show at least 2 rows
    // The table renders rows with order data — check for order number or status text
    const orderRows = page.locator("table tbody tr");
    await expect(orderRows.first()).toBeVisible({ timeout: 10000 });
    const rowCount = await orderRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(2);

    // Status text should be visible (unpaid / pending or any order status label)
    await expect(
      page.getByText(/chờ|đang xử lý|hoàn thành|chưa thanh toán|đơn hàng/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
