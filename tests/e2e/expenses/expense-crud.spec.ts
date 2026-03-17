import type { TestInfo } from "@playwright/test";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { cleanupTestExpenses } from "../helpers/api";

test.describe("Expense Management", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo: TestInfo) => {
    runId = `E2E-EXP-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestExpenses(page, runId);
  });

  test("TC-EXP-001 should list expenses", async ({ page }) => {
    await page.goto("/expenses");
    await expect(page.locator("h1, h2").filter({ hasText: /chi phí|expense/i })).toBeVisible();
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

  test("TC-EXP-003 should validation required fields", async ({ page }) => {
    await page.goto("/expenses");
    await page.getByRole("button", { name: /ghi nhận chi phí/i }).click();

    // Wait for sheet/form to be visible before submitting empty
    await expect(page.getByPlaceholder(/tiền thuê mặt bằng/i)).toBeVisible();

    await page.getByRole("button", { name: /lưu chi phí/i }).click();

    // Form must show validation error messages (zod schema: description, amount)
    // Note: date has default value so it won't show error
    await expect(page.getByText(/vui lòng nhập mô tả chi phí/i)).toBeVisible({
      timeout: 3000,
    });
    await expect(page.getByText(/số tiền phải lớn hơn 0/i)).toBeVisible({
      timeout: 3000,
    });

    // Sheet stays open (form not submitted)
    const sheetTitle = page.getByRole("heading", { name: /thêm chi phí/i });
    await expect(sheetTitle).toBeVisible();
  });
});
