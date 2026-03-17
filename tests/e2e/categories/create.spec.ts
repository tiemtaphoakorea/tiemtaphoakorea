import type { TestInfo } from "@playwright/test";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { cleanupTestCategories } from "../helpers/api";

/**
 * F07: Category Management Tests
 * Test cases: CAT-02
 */
test.describe("Category Management - Create", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo: TestInfo) => {
    runId = `E2E-CAT-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestCategories(page, runId);
  });

  // CAT-02: Tạo danh mục mới
  test("TC-PROD-014 should create a new category", async ({ page }) => {
    await page.goto("/categories");

    await page.click('button:has-text("Thêm danh mục")');
    const categoryName = `E2E Category ${runId}`;
    await page.fill('input[name="name"]', categoryName);
    await page.click('button[type="submit"]');

    // Wait for the sheet to close and data to reload
    await page
      .waitForSelector('[role="dialog"]', { state: "hidden", timeout: 10000 })
      .catch(() => {});

    // Now check if category is visible
    await expect(page.locator(`text=${categoryName}`)).toBeVisible({
      timeout: 10000,
    });
  });
});
