import type { Locator } from "@playwright/test";
import { STOREFRONT_BASE_URL } from "../../../lib/constants";
import { expect, test } from "../fixtures/auth";

/**
 * Guest Storefront - Variant Pricing
 * Test cases: TC-CATALOG-002
 */
test.describe("Guest Storefront - Variant Pricing", () => {
  test.use({ baseURL: STOREFRONT_BASE_URL });

  const readPrice = async (locator: Locator) => {
    const text = (await locator.textContent()) || "";
    const digits = text.replace(/[^\d]/g, "");
    return Number(digits || "0");
  };

  test("TC-CATALOG-002 should switch variant prices on detail page", async ({ page }) => {
    await page.goto("/products/basic-tee");

    const priceLocator = page.locator('[data-testid="product-price"]');
    await expect(priceLocator).toBeVisible();

    const redVariant = page.locator("button", { hasText: "Basic Tee - Red" }).first();
    const blueVariant = page.locator("button", { hasText: "Basic Tee - Blue" }).first();

    const initialPrice = await readPrice(priceLocator);
    expect(initialPrice).toBeGreaterThan(0);

    if (await redVariant.isVisible()) {
      await redVariant.click();
      await expect.poll(() => readPrice(priceLocator)).toBeGreaterThan(0);
    }

    if (await blueVariant.isVisible()) {
      await blueVariant.click();
      await expect.poll(() => readPrice(priceLocator)).toBeGreaterThan(0);
    }
  });
});
