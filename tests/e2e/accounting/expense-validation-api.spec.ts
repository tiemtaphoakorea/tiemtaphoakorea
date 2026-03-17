import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { createExpense } from "../helpers/api";

/**
 * Advanced Accounting Tests
 * Test cases: TC-ACC-013
 */
test.describe("Accounting - Expense Validation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-ACC-013 should validate expense amount", async ({ page }) => {
    // Try to create expense with negative amount (type must be "fixed" or "variable")
    const negativeResponse = await createExpense(page, {
      description: "Negative Expense",
      amount: -1000,
      type: "fixed",
      date: "2026-01-15",
    });

    expect(negativeResponse.success).toBe(false);

    // Try to create expense with zero amount
    const zeroResponse = await createExpense(page, {
      description: "Zero Expense",
      amount: 0,
      type: "fixed",
      date: "2026-01-15",
    });

    expect(zeroResponse.success).toBe(false);

    // Valid amount should succeed
    const validResponse = await createExpense(page, {
      description: "Valid Expense",
      amount: 1000,
      type: "fixed",
      date: "2026-01-15",
    });

    expect(validResponse.success).toBe(true);
  });
});
