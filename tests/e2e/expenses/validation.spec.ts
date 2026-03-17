import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Expense - Validation
 * Test cases: TC-EXP-003
 */
test.describe("Expense - Validation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
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
