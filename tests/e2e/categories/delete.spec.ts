import type { TestInfo } from "@playwright/test";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { cleanupTestCategories } from "../helpers/api";

/**
 * F07: Category Management Tests
 */
test.describe("Category Management - Delete", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo: TestInfo) => {
    runId = `E2E-CAT-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestCategories(page, runId);
  });

  test("TC-PROD-014 should delete a category", async ({ page }) => {
    await page.goto("/categories");
    const categoryName = `E2E Delete Category ${runId}`;
    await page.click('button:has-text("Thêm danh mục")');
    await page.fill('input[name="name"]', categoryName);
    await page.click('button[type="submit"]');

    // Wait for category creation
    await page
      .waitForSelector('[role="dialog"]', { state: "hidden", timeout: 10000 })
      .catch(() => {});
    await page.waitForLoadState("networkidle");
    await expect(page.locator(`text=${categoryName}`)).toBeVisible({
      timeout: 10000,
    });

    // Now delete the category
    const row = page.locator("tr", { hasText: categoryName });
    await row.locator("button:has(svg)").last().click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.click("text=Xóa");

    // Wait for deletion to complete
    await expect(page.locator(`text=${categoryName}`)).not.toBeVisible({
      timeout: 10000,
    });
  });
});
