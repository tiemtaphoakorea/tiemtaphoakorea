import type { Locator, Page } from "@playwright/test";
import { ADMIN_BASE_URL, STOREFRONT_BASE_URL } from "../../../lib/constants";
import { expect, login, test } from "../fixtures/auth";

/**
 * F11: Guest Storefront Tests
 * Test cases: GUEST-01 to GUEST-03
 * baseURL set in-spec so you can run: npm run test:e2e -- --grep "TC-CATALOG-001" or npm run test:e2e:guest
 */
test.describe("Guest Storefront", () => {
  test.use({ baseURL: STOREFRONT_BASE_URL });
  const readPriceValue = async (locator: Locator) => {
    const text = (await locator.textContent()) || "";
    const digits = text.replace(/[^\d]/g, "");
    return Number(digits || "0");
  };
  const countCards = (page: Page) => page.locator('[data-testid^="product-card-"]').count();

  // GUEST-01: Trang chủ hiển thị hero và sản phẩm nổi bật
  test("TC-CATALOG-004 should display home page sections", async ({ page }) => {
    await page.goto("/");

    // Hero h1 "NÂNG TẦM VẺ ĐẸP HÀN" or Featured h2 "Bán chạy nhất" (strict: pick first match)
    await expect(
      page
        .locator("h1, h2")
        .filter({ hasText: /NÂNG TẦM|Bán chạy|sản phẩm|Danh mục/i })
        .first(),
    ).toBeVisible();
    await expect(
      page
        .locator('[data-testid="featured-products"]')
        .or(page.locator("#featured-products"))
        .or(page.locator("text=Bán chạy nhất"))
        .first(),
    ).toBeVisible();
  });

  // GUEST-02: Xem danh sách sản phẩm
  test("TC-CATALOG-001 should display product listing", async ({ page }) => {
    await page.goto("/products");

    await expect(page.locator("h1, h2").filter({ hasText: /sản phẩm|products/i })).toBeVisible();
    await expect(
      page.locator('[data-testid="product-list"]').or(page.locator("article").first()),
    ).toBeVisible();
  });

  // GUEST-03: Tìm kiếm sản phẩm
  test("TC-CATALOG-001 should search and filter products", async ({ page }) => {
    await page.goto("/products");

    const searchInput = page.locator(
      'input[placeholder*="Tìm"], input[name="q"], input[type="search"]',
    );
    if (await searchInput.isVisible()) {
      await searchInput.fill("Basic");
      await expect(page).toHaveURL(/q=Basic/);
    }

    const categoryButton = page.locator("button", { hasText: "E2E Apparel" }).first();
    if (await categoryButton.isVisible()) {
      await categoryButton.click();
      await expect(page).toHaveURL(/category=e2e-apparel/);
    }

    const resetButton = page.locator("button", { hasText: "Tất cả" }).first();
    if (await resetButton.isVisible()) {
      await resetButton.click();
      await expect(page).not.toHaveURL(/category=/);
    }
  });

  test("TC-CATALOG-002 should switch variant prices on detail page", async ({ page }) => {
    await page.goto("/products/basic-tee");

    const priceLocator = page.locator('[data-testid="product-price"]');
    await expect(priceLocator).toBeVisible();

    const redVariant = page.locator("button", { hasText: "Basic Tee - Red" }).first();
    const blueVariant = page.locator("button", { hasText: "Basic Tee - Blue" }).first();

    const initialPrice = await readPriceValue(priceLocator);
    expect(initialPrice).toBeGreaterThan(0);

    if (await redVariant.isVisible()) {
      await redVariant.click();
      await expect.poll(() => readPriceValue(priceLocator)).toBeGreaterThan(0);
    }

    if (await blueVariant.isVisible()) {
      await blueVariant.click();
      await expect.poll(() => readPriceValue(priceLocator)).toBeGreaterThan(0);
    }
  });

  test("TC-CATALOG-003 should show correct stock labels", async ({ page }) => {
    await page.goto("/products/basic-tee");
    const stockLabel = page.locator('[data-testid="stock-status-label"]').first();
    await expect(stockLabel).toBeVisible();
    await expect(stockLabel).toHaveText(/Sẵn sàng giao|Tạm hết hàng/i);

    const blueVariant = page.locator("button", { hasText: "Basic Tee - Blue" }).first();
    if (await blueVariant.isVisible()) {
      await blueVariant.click();
      await expect(stockLabel).toHaveText(/Tạm hết hàng/i);
    }

    await page.goto("/products/preorder-tee");
    const preorderLabel = page.locator('[data-testid="stock-status-label"]').first();
    await expect(preorderLabel).toBeVisible();
    await expect(preorderLabel).toHaveText(/Đặt hàng \(7-10 ngày\)/i);
  });

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

  test("TC-CATALOG-006 should show pagination and empty state", async ({ page }) => {
    await page.goto("/products");

    const page2Button = page.locator('[data-testid="pagination-page-2"]');
    if (await page2Button.isVisible()) {
      await page2Button.click();
      await expect(page).toHaveURL(/page=2/);
      const page2Count = await countCards(page);
      expect(page2Count).toBeGreaterThan(0);
    }

    const searchInput = page.locator(
      'input[placeholder*="Tìm"], input[name="q"], input[type="search"]',
    );
    if (await searchInput.isVisible()) {
      await searchInput.fill("no-result-e2e");
      await expect(page.locator("text=Không tìm thấy sản phẩm")).toBeVisible();
    }
  });
});
