import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { cleanupTestSuppliers } from "../helpers/api";

/**
 * Supplier - Create
 * Test cases: TC-SUP-001
 */
test.describe("Supplier - Create", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-SUP-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestSuppliers(page, runId);
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
});
