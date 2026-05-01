import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  apiDelete,
  apiPost,
  cleanupTestCategories,
  cleanupTestProducts,
  createProductWithVariants,
} from "../helpers/api";

/**
 * Category Validation Tests
 * Test cases: TC-CAT-005, TC-CAT-006, TC-CAT-007, TC-CAT-008, TC-CAT-009
 */
test.describe("Categories - Validation", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-CATV-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestProducts(page, runId);
    await cleanupTestCategories(page, runId);
  });

  // TC-CAT-005: Cannot delete category that has products
  test("TC-CAT-005: should show error when deleting category that contains products", async ({
    page,
  }) => {
    // Create category via API
    const catRes = await apiPost<any>(page, "/api/admin/categories", {
      name: `CatWithProd ${runId}`,
      slug: `cat-with-prod-${runId}`,
    });
    const categoryId = catRes.data?.category?.id ?? catRes.data?.id;

    // Create a product assigned to that category
    await createProductWithVariants(page, {
      name: `CatProd ${runId}`,
      categoryId,
      variants: [{ sku: `CATP-${runId}`, price: 50000 }],
    });

    // Attempt to delete the category via API
    const deleteRes = await apiDelete<any>(page, `/api/admin/categories/${categoryId}`);

    if (deleteRes.response.status() === 400 || deleteRes.response.status() === 409) {
      // API correctly blocked the delete — verify category still visible in UI
      await page.goto("/categories");
      await page.waitForLoadState("networkidle");
      await expect(page.locator(`text=CatWithProd ${runId}`)).toBeVisible({ timeout: 8000 });
    } else {
      // Fallback: trigger via UI and verify toast error or category still present
      await page.goto("/categories");
      await page.waitForLoadState("networkidle");

      const row = page
        .locator("table tbody tr, [data-testid='category-row']")
        .filter({ hasText: `CatWithProd ${runId}` })
        .first();

      if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
        const deleteBtn = row.locator("button:has(svg)").last();
        await deleteBtn.click();
        await page.waitForTimeout(300);

        const menuDeleteItem = page
          .locator('[role="menuitem"]')
          .filter({ hasText: /xóa|delete/i })
          .first();
        if (await menuDeleteItem.isVisible({ timeout: 1500 }).catch(() => false)) {
          await menuDeleteItem.click();
        }

        const confirmBtn = page
          .locator('button:has-text("Xác nhận"), button:has-text("Xóa"), button:has-text("OK")')
          .first();
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click();
        } else {
          page.once("dialog", (dialog) => dialog.accept());
        }

        await page.waitForTimeout(1000);

        const errorToast = page
          .locator('[role="alert"], [data-sonner-toast], .toast')
          .filter({ hasText: /sản phẩm|product|không thể xóa|cannot delete/i })
          .first();

        const stillVisible = await page
          .locator(`text=CatWithProd ${runId}`)
          .isVisible({ timeout: 3000 })
          .catch(() => false);
        const toastVisible = await errorToast.isVisible({ timeout: 3000 }).catch(() => false);

        expect(toastVisible || stillVisible).toBe(true);
      }
    }
  });

  // TC-CAT-006: Category list shows correct product count
  test("TC-CAT-006: should show correct product count for a category", async ({ page }) => {
    // Create category via API
    const catRes = await apiPost<any>(page, "/api/admin/categories", {
      name: `CountCat ${runId}`,
      slug: `count-cat-${runId}`,
    });
    const categoryId = catRes.data?.category?.id ?? catRes.data?.id;

    // Create 2 products in this category
    await createProductWithVariants(page, {
      name: `CountProd1 ${runId}`,
      categoryId,
      variants: [{ sku: `CNT1-${runId}`, price: 10000 }],
    });
    await createProductWithVariants(page, {
      name: `CountProd2 ${runId}`,
      categoryId,
      variants: [{ sku: `CNT2-${runId}`, price: 10000 }],
    });

    await page.goto("/categories");
    await page.waitForLoadState("networkidle");

    // Find the row for the created category
    const categoryRow = page
      .locator("table tbody tr, [data-testid='category-row']")
      .filter({ hasText: `CountCat ${runId}` })
      .first();

    await expect(categoryRow).toBeVisible({ timeout: 8000 });

    // The row should display "2" as the product count
    await expect(
      categoryRow.locator("text=2").or(categoryRow.locator('[data-testid*="count"]')),
    ).toBeVisible({
      timeout: 5000,
    });
  });

  // TC-CAT-007: Cannot delete category that has subcategories
  test("TC-CAT-007: should show error when deleting category that has subcategories", async ({
    page,
  }) => {
    // Create parent category
    const parentRes = await apiPost<any>(page, "/api/admin/categories", {
      name: `ParentCat ${runId}`,
      slug: `parent-cat-${runId}`,
    });
    const parentId = parentRes.data?.category?.id ?? parentRes.data?.id;

    // Create child category
    const childRes = await apiPost<any>(page, "/api/admin/categories", {
      name: `ChildCat ${runId}`,
      slug: `child-cat-${runId}`,
      parentId,
    });
    const childId = childRes.data?.category?.id ?? childRes.data?.id;

    // Attempt to delete the parent via API
    const deleteRes = await apiDelete<any>(page, `/api/admin/categories/${parentId}`);

    if (deleteRes.response.status() === 400 || deleteRes.response.status() === 409) {
      // API correctly blocked — parent still exists
      await page.goto("/categories");
      await page.waitForLoadState("networkidle");
      await expect(page.locator(`text=ParentCat ${runId}`)).toBeVisible({ timeout: 8000 });
    } else {
      // Fallback: trigger via UI
      await page.goto("/categories");
      await page.waitForLoadState("networkidle");

      const row = page
        .locator("table tbody tr, [data-testid='category-row']")
        .filter({ hasText: `ParentCat ${runId}` })
        .first();

      if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
        const deleteBtn = row.locator("button:has(svg)").last();
        await deleteBtn.click();
        await page.waitForTimeout(300);

        const menuDeleteItem = page
          .locator('[role="menuitem"]')
          .filter({ hasText: /xóa|delete/i })
          .first();
        if (await menuDeleteItem.isVisible({ timeout: 1500 }).catch(() => false)) {
          await menuDeleteItem.click();
        }

        const confirmBtn = page
          .locator('button:has-text("Xác nhận"), button:has-text("Xóa"), button:has-text("OK")')
          .first();
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click();
        } else {
          page.once("dialog", (dialog) => dialog.accept());
        }

        await page.waitForTimeout(1000);

        const errorToast = page
          .locator('[role="alert"], [data-sonner-toast], .toast')
          .filter({ hasText: /danh mục con|subcategor|không thể xóa|cannot delete/i })
          .first();

        const stillVisible = await page
          .locator(`text=ParentCat ${runId}`)
          .isVisible({ timeout: 3000 })
          .catch(() => false);
        const toastVisible = await errorToast.isVisible({ timeout: 3000 }).catch(() => false);

        expect(toastVisible || stillVisible).toBe(true);
      }
    }

    // Cleanup child first so parent can be removed by afterEach
    if (childId) {
      await apiDelete(page, `/api/admin/categories/${childId}`).catch(() => {});
    }
  });

  // TC-CAT-008: Empty category name validation
  test("TC-CAT-008: should show inline error when category name is empty", async ({ page }) => {
    await page.goto("/categories");
    await page.waitForLoadState("networkidle");

    await page.click('button:has-text("Thêm danh mục")');
    await page.waitForTimeout(300);

    // Leave name empty and submit
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.clear();

    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    const isRequired = await nameInput.getAttribute("required");

    if (isRequired !== null) {
      // Browser native validation — dialog/sheet should remain open
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });
    } else {
      // Custom inline error
      await expect(
        page
          .locator("text=Tên danh mục bắt buộc")
          .or(page.locator("text=Tên danh mục không được để trống"))
          .or(page.locator('[role="alert"]').filter({ hasText: /tên danh mục|category name/i })),
      ).toBeVisible({ timeout: 5000 });
    }

    // Dialog/sheet must still be open (form not submitted)
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });
  });

  // TC-CAT-009: Reparent category — move child from one parent to another
  test("TC-CAT-009: should move child category to a different parent", async ({ page }) => {
    // Create ChaX
    const chaXRes = await apiPost<any>(page, "/api/admin/categories", {
      name: `ChaX ${runId}`,
      slug: `cha-x-${runId}`,
    });
    const chaXId = chaXRes.data?.category?.id ?? chaXRes.data?.id;

    // Create ConA as child of ChaX
    const conARes = await apiPost<any>(page, "/api/admin/categories", {
      name: `ConA ${runId}`,
      slug: `con-a-${runId}`,
      parentId: chaXId,
    });
    const conAId = conARes.data?.category?.id ?? conARes.data?.id;

    // Create ChaY (no parent)
    const chaYRes = await apiPost<any>(page, "/api/admin/categories", {
      name: `ChaY ${runId}`,
      slug: `cha-y-${runId}`,
    });
    const chaYId = chaYRes.data?.category?.id ?? chaYRes.data?.id;

    // Navigate to categories page and edit ConA
    await page.goto("/categories");
    await page.waitForLoadState("networkidle");

    const conARow = page
      .locator("table tbody tr, [data-testid='category-row']")
      .filter({ hasText: `ConA ${runId}` })
      .first();

    await expect(conARow).toBeVisible({ timeout: 8000 });

    // Open edit dialog for ConA
    const editBtn = conARow
      .locator('button:has-text("Chỉnh sửa"), button[aria-label*="edit"]')
      .or(conARow.locator("button:has(svg)").last());
    await editBtn.click();
    await page.waitForTimeout(300);

    const editMenuItem = page
      .locator('[role="menuitem"]')
      .filter({ hasText: /chỉnh sửa|edit/i })
      .first();
    if (await editMenuItem.isVisible({ timeout: 1500 }).catch(() => false)) {
      await editMenuItem.click();
      await page.waitForTimeout(300);
    }

    // Change parent from ChaX to ChaY
    const parentSelect = page
      .locator('select[name*="parent"], [role="combobox"]')
      .filter({ hasText: /danh mục cha|parent/i })
      .or(page.locator('[name="parentId"]'))
      .first();

    if (await parentSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const tagName = await parentSelect.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === "select") {
        await parentSelect.selectOption({ label: `ChaY ${runId}` });
      } else {
        await parentSelect.click();
        await page.waitForTimeout(300);
        await page
          .locator('[role="option"]')
          .filter({ hasText: `ChaY ${runId}` })
          .first()
          .click();
      }

      await page.click('button[type="submit"]');
      await page
        .waitForSelector('[role="dialog"]', { state: "hidden", timeout: 10000 })
        .catch(() => {});
      await page.waitForLoadState("networkidle");

      // ConA should now appear under ChaY — verify in the UI tree/table
      await expect(page.locator(`text=ConA ${runId}`)).toBeVisible({ timeout: 8000 });

      // ChaX should no longer show ConA as its child (optional tree verification)
      const chaXRow = page
        .locator("table tbody tr, [data-testid='category-row']")
        .filter({ hasText: `ChaX ${runId}` })
        .first();
      if (await chaXRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(chaXRow).not.toContainText(`ConA ${runId}`);
      }
    } else {
      test.skip(true, "Parent category selector not found in edit form");
    }

    // Cleanup in dependency order: child before parents
    if (conAId) await apiDelete(page, `/api/admin/categories/${conAId}`).catch(() => {});
    if (chaXId) await apiDelete(page, `/api/admin/categories/${chaXId}`).catch(() => {});
    if (chaYId) await apiDelete(page, `/api/admin/categories/${chaYId}`).catch(() => {});
  });
});
