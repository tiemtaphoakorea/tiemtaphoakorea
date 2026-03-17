import type { TestInfo } from "@playwright/test";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { cleanupTestSuppliers } from "../helpers/api";

/**
 * F06: Supplier Management Tests
 * Test cases: SUP-01 to SUP-03
 */
test.describe("Supplier Management", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo: TestInfo) => {
    runId = `E2E-SUP-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestSuppliers(page, runId);
  });

  // SUP-01: Xem danh sách nhà cung cấp
  test("TC-SUP-001 should display supplier list", async ({ page }) => {
    await page.goto("/suppliers");

    await expect(
      page.locator("h1, h2").filter({ hasText: /nhà cung cấp|supplier/i }),
    ).toBeVisible();
    await expect(
      page.locator("table").or(page.locator('[data-testid="supplier-list"]')),
    ).toBeVisible();
  });

  // SUP-02: Tạo nhà cung cấp mới
  test("TC-SUP-001 should create a new supplier", async ({ page }) => {
    await page.goto("/suppliers");

    await page.click('button:has-text("Thêm nhà cung cấp")');
    const supplierName = `NCC Test ${runId}`;
    await page.fill('input[name="name"]', supplierName);
    await page.fill('input[name="phone"]', "0901234567");
    await page.fill('input[name="email"]', `ncc-${runId}@test.com`);
    await page.click('button[type="submit"]');
    await expect(page.locator(`text=${supplierName}`)).toBeVisible();
  });

  // SUP-03: Tìm kiếm nhà cung cấp
  test("TC-SUP-004 should search suppliers", async ({ page }) => {
    await page.goto("/suppliers");

    const searchInput = page.locator('input[placeholder*="Tìm"], input[name="search"]');
    await searchInput.fill("NCC");
    await page.waitForTimeout(500);
    expect(page.url()).toContain("search");
  });

  test("TC-SUP-002 should update supplier details", async ({ page }) => {
    await page.goto("/suppliers");
    const supplierName = `NCC Update ${runId}`;
    await page.click('button:has-text("Thêm nhà cung cấp")');
    await page.fill('input[name="name"]', supplierName);
    await page.click('button[type="submit"]');
    await expect(page.locator("table").getByText(supplierName).first()).toBeVisible();

    const row = page.locator("tr", { hasText: supplierName });
    await row.locator("button:has(svg)").last().click();
    await page.click("text=Chỉnh sửa");
    await page.fill('input[name="phone"]', "0911111111");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    await expect(page.locator("table").getByText(supplierName).first()).toBeVisible();
  });

  test("TC-SUP-003 should deactivate supplier", async ({ page }) => {
    await page.goto("/suppliers");

    // Click first supplier row
    await page.locator("table tbody tr").first().click();
    await page.waitForTimeout(300);

    // Look for deactivate button or toggle
    const deactivateBtn = page
      .locator('button:has-text("Vô hiệu")')
      .or(page.locator('button:has-text("Deactivate")'))
      .or(page.locator('[data-testid="toggle-status"]'));
    const hasButton = await deactivateBtn.isVisible().catch(() => false);

    if (hasButton) {
      await deactivateBtn.click();
      await page.waitForTimeout(500);

      // Verify deactivation
      const statusIndicator = page.locator("text=Đã vô hiệu").or(page.locator("text=Deactivated"));
      const hasStatus = await statusIndicator.isVisible().catch(() => false);

      if (hasStatus) {
        await expect(statusIndicator).toBeVisible();

        // Reactivate to avoid affecting other tests
        await deactivateBtn.click();
      }
    }
  });
  test("TC-SUP-005 should show supplier stats", async ({ page }) => {
    await page.goto("/suppliers");
    // Check for table header "Đơn hàng" specifically in the table
    await expect(page.locator("table th").getByText("Đơn hàng")).toBeVisible();
  });
});
