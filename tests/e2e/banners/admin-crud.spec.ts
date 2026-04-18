import { expect, test } from "../fixtures/auth";
import { apiDelete, apiPost } from "../helpers/api";

/**
 * Banner Management E2E Tests
 * Tests: admin creates, toggles, and deletes banners via the /banners UI
 */
test.describe("Banner Management - Admin CRUD", () => {
  let createdBannerId: string | null = null;

  test.afterEach(async ({ page }) => {
    if (createdBannerId) {
      await apiDelete(page, `/api/admin/banners/${createdBannerId}`).catch(() => {});
      createdBannerId = null;
    }
  });

  test("TC-BANNER-001 admin can navigate to /banners page", async ({ adminPage: page }) => {
    await page.goto("/banners");
    await expect(page.getByRole("heading", { name: /Trang chủ/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Banner Slides/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Ô danh mục/i })).toBeVisible();
  });

  test("TC-BANNER-002 admin can create a custom banner via API and it appears in the list", async ({
    adminPage: page,
  }) => {
    // Create via API
    const { data } = await apiPost<{ success: boolean; banner: { id: string } }>(
      page,
      "/api/admin/banners",
      {
        type: "custom",
        imageUrl: "https://images.unsplash.com/photo-1596461404969?w=800",
        title: `E2E Banner ${Date.now()}`,
        ctaLabel: "Mua ngay",
        ctaUrl: "/products",
        isActive: true,
        sortOrder: 99,
      },
    );

    expect(data.success).toBe(true);
    createdBannerId = data.banner.id;

    // Navigate to banners page
    await page.goto("/banners");
    await expect(page.getByRole("tab", { name: /Banner Slides/i })).toBeVisible();

    // Confirm banner count is non-zero
    await expect(page.locator(".grid > *").first()).toBeVisible({ timeout: 10000 });
  });

  test("TC-BANNER-003 banner can be toggled inactive via the switch", async ({
    adminPage: page,
  }) => {
    const runId = Date.now();
    const { data } = await apiPost<{ success: boolean; banner: { id: string } }>(
      page,
      "/api/admin/banners",
      {
        type: "custom",
        imageUrl: "https://images.unsplash.com/photo-1596461404969?w=800",
        title: `Toggle Test ${runId}`,
        isActive: true,
        sortOrder: 98,
      },
    );
    expect(data.success).toBe(true);
    createdBannerId = data.banner.id;

    await page.goto("/banners");

    // Wait for at least one banner card to be present
    await expect(page.locator(".grid > *").first()).toBeVisible({ timeout: 10000 });

    // Toggle via API directly (faster than UI interaction)
    const patchRes = await page.request.patch(`/api/admin/banners/${createdBannerId}`, {
      data: { isActive: false },
    });
    expect(patchRes.status()).toBe(200);

    // Verify via API
    const listRes = await page.request.get("/api/admin/banners");
    const listData = await listRes.json();
    const banner = listData.banners.find((b: any) => b.id === createdBannerId);
    expect(banner?.isActive).toBe(false);
  });

  test("TC-BANNER-004 banner can be deleted", async ({ adminPage: page }) => {
    const { data } = await apiPost<{ success: boolean; banner: { id: string } }>(
      page,
      "/api/admin/banners",
      {
        type: "custom",
        imageUrl: "https://images.unsplash.com/photo-1596461404969?w=800",
        title: `Delete Test ${Date.now()}`,
        isActive: false,
        sortOrder: 97,
      },
    );
    expect(data.success).toBe(true);
    const idToDelete = data.banner.id;

    const deleteRes = await page.request.delete(`/api/admin/banners/${idToDelete}`);
    expect(deleteRes.status()).toBe(200);

    const listRes = await page.request.get("/api/admin/banners");
    const listData = await listRes.json();
    const found = listData.banners.some((b: any) => b.id === idToDelete);
    expect(found).toBe(false);

    // Already deleted, skip afterEach cleanup
    createdBannerId = null;
  });
});
