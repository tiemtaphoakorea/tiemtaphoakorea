import { expect, test } from "../fixtures/auth";
import { STOREFRONT_BASE_URL } from "../helpers/api";

test.describe("Storefront - Navbar Links", () => {
  // Use a clean session for shopping flow
  test.use({ storageState: { cookies: [], origins: [] } });

  test("TC-STORE-004 should display navbar menu and category links", async ({ page }) => {
    await page.goto(STOREFRONT_BASE_URL);

    // Logo link (pick the first matching logo link)
    const logoLink = page.getByRole("link", { name: /K-SMART/i }).first();
    await expect(logoLink).toBeVisible();

    // Main category menu link
    await expect(page.getByRole("link", { name: /DANH MỤC/i })).toBeVisible();

    // Category links should be visible in navbar
    // Category links in navbar should be visible (check a representative subset)
    await expect(page.getByRole("link", { name: "Chăm sóc da" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Đồ gia dụng" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Hàng mới" }).first()).toBeVisible();

    // Clicking a category should navigate to products listing with category filter applied
    await page.getByRole("link", { name: "Chăm sóc da" }).click();
    await expect(page).toHaveURL(/\/products\?.*category=/);
    // Products listing header should be visible
    await expect(page.getByRole("heading", { name: /Danh mục .*Sản phẩm/i })).toBeVisible();
  });
});
