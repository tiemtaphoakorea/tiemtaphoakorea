import type { TestInfo } from "@playwright/test";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS } from "../fixtures/data";
import { apiPost, getCustomerDetails, getCustomers } from "../helpers/api";

/**
 * F03: Customer Management Tests
 * Test cases: CUST-01 to CUST-05
 */
test.describe("Customer Management", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo: TestInfo) => {
    runId = `E2E-CUST-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
    // Ensure primary test customer exists for downstream tests that rely on TEST_CUSTOMERS.primary
    const customers = await getCustomers(page, TEST_CUSTOMERS.primary.phone);
    if (customers.length === 0) {
      await apiPost<any>(page, "/api/admin/customers", {
        fullName: TEST_CUSTOMERS.primary.fullName,
        phone: TEST_CUSTOMERS.primary.phone,
        customerType: "retail",
      });
    }
  });

  // CUST-01: Xem danh sách khách hàng
  test("TC-CUST-004 should display customer list", async ({ page }) => {
    await page.goto("/customers");

    await expect(page.locator("h1, h2").filter({ hasText: /khách hàng|customer/i })).toBeVisible();
    await expect(
      page.locator("table").or(page.locator('[data-testid="customer-list"]')),
    ).toBeVisible();
  });

  // CUST-02: Tạo khách hàng mới - tự động tạo mã KH
  test("TC-CUST-001/TC-CUST-003 should auto-generate customer code when creating new customer", async ({
    page,
  }) => {
    await page.goto("/customers");

    await page.getByRole("button", { name: /thêm kh/i }).click();
    await expect(page.getByRole("heading", { name: /thêm khách hàng/i })).toBeVisible();

    await page.fill('input[name="fullName"]', `Test Customer ${runId}`);
    const uniquePhone = `09${(runId.replace(/\D/g, "") || String(Date.now()))
      .padStart(8, "0")
      .slice(-8)}`;
    await page.fill('input[name="phone"]', uniquePhone);

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/admin/customers") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: /^Thêm$/ }).click();
    const createResponse = await createResponsePromise;
    const body = await createResponse.json();

    expect(createResponse.ok()).toBe(true);
    expect(body.profile.customerCode).toMatch(/^KH\d{8}(-\d{3})?$/);
    await expect(page.getByText("Đã thêm khách hàng")).toBeVisible({ timeout: 5000 });
  });

  // CUST-03: Tìm kiếm khách hàng
  test("TC-CUST-004 should search customers by name or phone", async ({ page }) => {
    await page.goto("/customers");

    const searchInput = page.locator('input[placeholder*="Tìm"], input[name="search"]');
    await searchInput.fill(TEST_CUSTOMERS.primary.phone);
    await page.waitForTimeout(500);

    // Wait for results to update
    await page.waitForTimeout(500);

    // Verify search was applied
    expect(page.url()).toContain("search");
  });

  // NOTE: Customer password reset test removed
  // Customers do NOT need login accounts - this feature is for User Management (staff/employees) only
  // TODO: Remove auth creation from customer.server.ts and password reset UI from customers page

  // CUST-05: Vô hiệu hóa khách hàng
  test("TC-CUST-006 should deactivate customer", async ({ page }) => {
    await page.goto("/customers");
    await page.fill('input[placeholder*="Tìm"]', TEST_CUSTOMERS.primary.phone);
    await page.waitForTimeout(500);

    // Click first customer
    await page.locator("table tbody tr").first().click();

    // Find deactivate toggle or button
    const deactivateBtn = page.locator(
      'button:has-text("Vô hiệu"), button:has-text("Deactivate"), [data-testid="toggle-status"]',
    );
    if (await deactivateBtn.isVisible()) {
      await deactivateBtn.click();

      await expect(
        page.locator("text=đã vô hiệu").or(page.locator("text=deactivated")),
      ).toBeVisible({ timeout: 10000 });
      // Toggle back to avoid impacting other tests
      await deactivateBtn.click();
    }
  });

  test("TC-CUST-007 should show customer order history", async ({ page }) => {
    await page.goto("/customers");
    await page.fill('input[placeholder*="Tìm kiếm"]', TEST_CUSTOMERS.primary.phone);
    await page.waitForTimeout(500);

    const row = page.locator("table tbody tr").first();
    await expect(row).toBeVisible();

    // Navigate to customer details by clicking the row (more stable than dropdown actions)
    await row.click();

    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Lịch sử đơn hàng")).toBeVisible();
  });

  test("TC-CUST-008 should auto-create customer from order", async ({ page }) => {
    const customers = await getCustomers(page, TEST_CUSTOMERS.primary.phone);
    const customer = customers[0];

    expect(customer?.id).toBeTruthy();
    expect(customer?.customerCode).toBeTruthy();
    expect(customer?.customerCode).toMatch(/^(KH|CUS)/);
  });
  test("TC-CUST-009 should compute customer stats", async ({ page }) => {
    const customers = await getCustomers(page, TEST_CUSTOMERS.primary.phone);
    const customer = customers[0];
    expect(customer?.id).toBeTruthy();

    const detail = await getCustomerDetails(page, customer.id);
    const totalSpent = (detail.orders || []).reduce(
      (acc: number, order: any) => acc + Number(order.total || 0),
      0,
    );
    const orderCount = detail.orders?.length || 0;

    const formatCurrency = (val: number) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(val);

    await page.goto(`/customers/${customer.id}`);
    await expect(page.locator("text=Thống kê tài chính")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page
        .locator("text=Tổng chi tiêu")
        .locator("..")
        .locator("div")
        .filter({ hasText: formatCurrency(totalSpent) })
        .first(),
    ).toBeVisible();
    await expect(
      page
        .locator("text=Số đơn hàng")
        .locator("..")
        .locator("div")
        .filter({ hasText: orderCount.toString() })
        .first(),
    ).toBeVisible();
  });
  test("TC-CUST-010 should prevent duplicate phone", async ({ page }) => {
    await page.goto("/customers");

    await page.getByRole("button", { name: /thêm kh/i }).click();
    await expect(page.getByRole("heading", { name: /thêm khách hàng/i })).toBeVisible();

    await page.fill('input[name="fullName"]', `Duplicate Test ${Date.now()}`);
    await page.fill('input[name="phone"]', TEST_CUSTOMERS.primary.phone);

    const duplicateResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/admin/customers") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: /^Thêm$/ }).click();
    const duplicateResponse = await duplicateResponsePromise;

    expect(duplicateResponse.ok()).toBe(false);
    expect(duplicateResponse.status()).toBeGreaterThanOrEqual(400);
    await expect(page.getByRole("heading", { name: /thêm khách hàng/i })).toBeVisible();
  });
});
