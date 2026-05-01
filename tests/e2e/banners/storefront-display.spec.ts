import { STOREFRONT_BASE_URL } from "@workspace/shared/constants";
import { expect, test } from "../fixtures/auth";
import { apiDelete, apiPost } from "../helpers/api";

const BANNER_1_TITLE = "E2E Banner Slide 1";
const BANNER_2_TITLE = "E2E Banner Slide 2";

/**
 * Storefront Banner Display E2E Tests
 * Tests the carousel on the homepage when banners exist in the DB.
 */
test.describe("Storefront - Banner Carousel", () => {
  let banner1Id: string | null = null;
  let banner2Id: string | null = null;

  // Seed 2 active banners before tests
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto(STOREFRONT_BASE_URL);

    // Login as admin to create banners
    await page.goto("/login");
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/");

    const { data: d1 } = await apiPost<{ banner: { id: string } }>(page, "/api/admin/banners", {
      type: "custom",
      imageUrl: "https://images.unsplash.com/photo-1596461404969?w=2000",
      title: BANNER_1_TITLE,
      subtitle: "Slide 1 subtitle",
      ctaLabel: "Mua ngay",
      ctaUrl: "/products",
      isActive: true,
      sortOrder: 0,
    });
    banner1Id = d1?.banner?.id ?? null;

    const { data: d2 } = await apiPost<{ banner: { id: string } }>(page, "/api/admin/banners", {
      type: "custom",
      imageUrl: "https://images.unsplash.com/photo-1504674900247?w=2000",
      title: BANNER_2_TITLE,
      subtitle: "Slide 2 subtitle",
      ctaLabel: "Khám phá",
      ctaUrl: "/products",
      isActive: true,
      sortOrder: 1,
    });
    banner2Id = d2?.banner?.id ?? null;

    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    if (banner1Id) await apiDelete(page, `/api/admin/banners/${banner1Id}`).catch(() => {});
    if (banner2Id) await apiDelete(page, `/api/admin/banners/${banner2Id}`).catch(() => {});
    await page.close();
  });

  test.use({ storageState: { cookies: [], origins: [] } });

  test("TC-BANNER-STORE-001 homepage displays banner carousel with first slide", async ({
    page,
  }) => {
    await page.goto(STOREFRONT_BASE_URL);
    await expect(page).toHaveTitle(/K-SMART/i);

    // Hero section should be visible
    const heroSection = page.locator("section").first();
    await expect(heroSection).toBeVisible({ timeout: 10000 });
  });

  test("TC-BANNER-STORE-002 dot indicators are visible when multiple banners exist", async ({
    page,
  }) => {
    if (!banner1Id || !banner2Id) test.skip();

    await page.goto(STOREFRONT_BASE_URL);

    // Dot indicators should appear (aria-label pattern)
    const firstDot = page.getByLabel("Chuyển sang slide 1");
    await expect(firstDot).toBeVisible({ timeout: 10000 });

    const secondDot = page.getByLabel("Chuyển sang slide 2");
    await expect(secondDot).toBeVisible();
  });

  test("TC-BANNER-STORE-003 clicking next arrow advances to slide 2", async ({ page }) => {
    if (!banner1Id || !banner2Id) test.skip();

    await page.goto(STOREFRONT_BASE_URL);

    const nextBtn = page.getByLabel("Slide tiếp theo");
    await expect(nextBtn).toBeVisible({ timeout: 10000 });
    await nextBtn.click();

    // Second dot should now be active (has w-6 class = wider dot)
    const secondDot = page.getByLabel("Chuyển sang slide 2");
    await expect(secondDot).toHaveClass(/w-6/);
  });

  test("TC-BANNER-STORE-004 category cards grid is visible below the banner", async ({ page }) => {
    await page.goto(STOREFRONT_BASE_URL);

    // Category cards section should render
    const heroSection = page.locator("section").first();
    await expect(heroSection).toBeVisible({ timeout: 10000 });

    // Should have grid with links (category cards)
    const cardLinks = page.locator("section .grid a");
    await expect(cardLinks.first()).toBeVisible({ timeout: 5000 });
  });
});
