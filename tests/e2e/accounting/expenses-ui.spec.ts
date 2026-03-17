import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { createExpense, deleteExpense, listExpenses } from "../helpers/api";

/**
 * F06: Simple Accounting Tests
 * Test cases: TC-ACC-001, TC-ACC-010, TC-ACC-013
 */
test.describe("Accounting - Expense UI", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-ACC-001 should allow expense entry", async ({ page }) => {
    const expenseName = `E2E Expense ${Date.now()}`;
    await page.goto("/expenses");
    await page.click('button:has-text("Ghi nhận chi phí")');
    await page.fill('input[placeholder*="Tiền thuê"]', expenseName);
    await page.fill('input[placeholder="0"]', "100000");
    await page.click('button:has-text("Lưu chi phí")');
    await expect(page.getByText(expenseName, { exact: true })).toBeVisible();
  });

  test("TC-ACC-010 should edit/delete expense", async ({ page }) => {
    const description = `E2E Expense Delete ${Date.now()}`;
    const res = await createExpense(page, {
      description,
      amount: 123456,
      type: "fixed",
      date: new Date().toISOString(),
    });
    expect(res.success).toBe(true);
    expect(res.expense?.id).toBeTruthy();
    const expenseId = res.expense.id;

    const deleteRes = await deleteExpense(page, expenseId);
    expect(deleteRes.status()).toBe(200);

    const list = await listExpenses(page, 1000);
    const exists = (list || []).some((expense: any) => expense.description === description);
    expect(exists).toBe(false);
  });

  test("TC-ACC-013 should validate expense amount", async ({ page }) => {
    await page.goto("/expenses");
    await page.click('button:has-text("Ghi nhận chi phí")');

    // Fill description (required) so we can submit
    await page.fill(
      'input[placeholder*="Tiền thuê"], input[placeholder*="mô tả"]',
      "E2E Validation",
    );
    const amountInput = page.locator('input[placeholder="0"]');
    await amountInput.fill("-100");

    const saveButton = page.locator('button:has-text("Lưu chi phí")');
    await saveButton.click();

    // Schema shows "Số tiền phải lớn hơn 0" for invalid amount
    const errorMsg = page.locator("text=/không hợp lệ|invalid|phải lớn hơn 0|lớn hơn 0/i");
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });
});
