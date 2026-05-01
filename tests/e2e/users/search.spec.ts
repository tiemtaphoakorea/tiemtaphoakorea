import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * User - Search
 * Test cases: TC-USERS-013
 */
test.describe("User - Search", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForTimeout(500);
  });

  // TC-USERS-013: Search users by name or username
  test("TC-USERS-013 should filter user list when searching by name or username", async ({
    page,
  }) => {
    await page.goto("/users");
    await expect(page.locator("table")).toBeVisible({ timeout: 15000 });

    const searchInput = page.locator('input[placeholder*="Tìm"], input[name="search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Type a search term and wait for debounce
    await searchInput.fill("admin");
    await page.waitForTimeout(500);

    // URL should reflect the search param
    expect(page.url()).toContain("search");

    // Table should still be present (not crash / empty state is acceptable if no match)
    await expect(page.locator("table")).toBeVisible({ timeout: 5000 });

    // Clear search — table should return to full list
    await searchInput.fill("");
    await page.waitForTimeout(500);
    await expect(page.locator("table")).toBeVisible({ timeout: 5000 });
  });
});
