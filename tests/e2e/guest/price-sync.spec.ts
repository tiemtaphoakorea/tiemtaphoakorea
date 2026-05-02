import type { Locator } from "@playwright/test";
import { ADMIN_BASE_URL, STOREFRONT_BASE_URL } from "@workspace/shared/constants";
import { expect, login, test } from "../fixtures/auth";

/**
 * Guest Storefront - Price Sync
 * Test cases: TC-CATALOG-005
 */
test.describe("Guest Storefront - Price Sync", () => {
  const readPriceValue = async (locator: Locator) => {
    const text = (await locator.textContent()) || "";
    const digits = text.replace(/[^\d]/g, "");
    return Number(digits || "0");
  };

  test("TC-CATALOG-005 should reflect updated prices from admin", async ({ browser }) => {
    const adminContext = await browser.newContext({
      baseURL: ADMIN_BASE_URL,
    });
    const adminPage = await adminContext.newPage();
    await login(adminPage, "admin", "password123");

    const productsResponse = await adminPage.request.get("/api/admin/products?include=variants");
    const productsPayload = await productsResponse.json();
    const products = productsPayload.products || [];
    const target = products.find((p: any) => p.slug === "basic-tee");
    if (!target) {
      throw new Error("basic-tee product not found");
    }

    const original = {
      basePrice: Number(target.basePrice || 0),
      variants: (target.variants || []).map((v: any) => ({
        id: v.id,
        price: Number(v.price || 0),
        costPrice: Number(v.costPrice || 0),
        stockQuantity: Number(v.stockQuantity || 0),
        stockType: v.stockType || "in_stock",
        name: v.name,
        sku: v.sku,
      })),
    };

    const updatedBasePrice = original.basePrice + 10000;
    const updatedVariants = original.variants.map((v: any) => ({
      ...v,
      price: v.price + 10000,
    }));

    await adminPage.request.put(`/api/admin/products/${target.id}`, {
      data: {
        name: target.name,
        slug: target.slug,
        description: target.description || "",
        categoryId: target.categoryId,
        basePrice: updatedBasePrice,
        isActive: target.isActive !== false,
        variants: updatedVariants,
      },
    });

    const guestContext = await browser.newContext({
      baseURL: STOREFRONT_BASE_URL,
    });
    const page = await guestContext.newPage();

    const expectedUpdatedPrices = new Set(updatedVariants.map((v: { price: number }) => v.price));

    await page.goto("/products?q=Basic");
    const card = page.locator(`[data-testid="product-card-${target.slug}"]`);
    await expect(card).toBeVisible({ timeout: 10000 });
    const listPrice = card.locator('[data-testid="product-card-price"]');
    await expect.poll(() => readPriceValue(listPrice)).toBeTruthy();
    const actualListPrice = await readPriceValue(listPrice);
    expect(
      expectedUpdatedPrices.has(actualListPrice),
      `Listing price ${actualListPrice} should be one of updated [${[...expectedUpdatedPrices].join(", ")}]`,
    ).toBe(true);

    await page.goto(`/products/${target.slug}`);
    const detailPrice = page.locator('[data-testid="product-price"]');
    await expect.poll(() => readPriceValue(detailPrice)).toBeTruthy();
    const actualDetailPrice = await readPriceValue(detailPrice);
    expect(
      expectedUpdatedPrices.has(actualDetailPrice),
      `Detail price ${actualDetailPrice} should be one of [${[...expectedUpdatedPrices].join(", ")}]`,
    ).toBe(true);

    await adminPage.request.put(`/api/admin/products/${target.id}`, {
      data: {
        name: target.name,
        slug: target.slug,
        description: target.description || "",
        categoryId: target.categoryId,
        basePrice: original.basePrice,
        isActive: target.isActive !== false,
        variants: original.variants,
      },
    });

    await guestContext.close();
    await adminContext.close();
  });
});
