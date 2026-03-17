import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { cleanupTestExpenses } from "../helpers/api";

/**
 * Expense - Create
 * Test cases: TC-EXP-002
 */
test.describe("Expense - Create", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-EXP-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestExpenses(page, runId);
  });

  test("TC-EXP-002 should create new expense", async ({ page }) => {
    await page.goto("/expenses");

    // Button that opens the add sheet is "Ghi nhận chi phí" (not the sheet title "Thêm chi phí")
    await page.getByRole("button", { name: /ghi nhận chi phí/i }).click();

    // Wait for sheet to open and form to be ready
    const descriptionInput = page.getByPlaceholder(/tiền thuê mặt bằng/i);
    await expect(descriptionInput).toBeVisible();

    const description = `Expense ${runId}`;
    await descriptionInput.fill(description);

    // Amount: use placeholder or name (form has name="amount" via Controller)
    const amountInput = page.locator('input[name="amount"]').or(page.getByPlaceholder("0").first());
    await amountInput.first().fill("500000");

    // Select type if combobox exists (optional)
    const typeSelect = page.locator('button[role="combobox"]').first();
    if (await typeSelect.isVisible()) {
      await typeSelect.click();
      await page.locator('[role="option"]').first().click();
    }

    await page.getByRole("button", { name: /lưu chi phí/i }).click();

    // Wait for sheet to close and new expense to appear in list
    await expect(page.locator(`text=${description}`)).toBeVisible({
      timeout: 15000,
    });
  });
});
