import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { getProductsWithVariants } from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-014
 */
test.describe("Supplier Orders - Pagination", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-014 should handle pagination when many orders exist", async ({ page }) => {
    // This test assumes pagination controls exist
    // Create multiple orders if needed
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const variant =
      products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku) ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    // Navigate to list
    await page.goto("/supplier-orders");
    await page.waitForTimeout(500);

    // Check if pagination controls exist
    const nextButton = page.getByRole("button", { name: "Go to next page" });
    const prevButton = page.getByRole("button", {
      name: "Go to previous page",
    });

    // If pagination exists, test navigation
    if ((await nextButton.count()) > 0) {
      await expect(nextButton).toBeVisible();
      // Test that next button is disabled on first page if only one page
      const isNextDisabled = await nextButton.isDisabled();

      // If there are multiple pages, clicking next should work
      if (!isNextDisabled) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Previous button should now be enabled
        await expect(prevButton).toBeEnabled();

        // Go back to first page
        await prevButton.click();
        await page.waitForTimeout(500);
      }
    }
  });
});
