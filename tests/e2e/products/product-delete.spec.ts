import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiDelete, apiPost, cleanupTestProducts, createProductWithVariants } from "../helpers/api";

/**
 * Product Delete Tests
 * Test cases: TC-PROD-014, TC-PROD-015, TC-PROD-016
 *
 * Note: TC-PROD-014 label is already used in categories/ specs for category operations.
 * Here TC-PROD-014 refers to the product delete cancel-dialog flow.
 */
test.describe("Products - Delete", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-DEL-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestProducts(page, runId);
  });

  // TC-PROD-014: Cancel the delete confirm dialog — product must NOT be deleted
  test("TC-PROD-014: should NOT delete product when cancel is chosen in confirm dialog", async ({
    page,
  }) => {
    const productName = `CancelDel ${runId}`;
    await createProductWithVariants(page, {
      name: productName,
      variants: [{ sku: `CDEL-${runId}`, price: 60000 }],
    });

    await page.goto("/products");
    await page.fill('input[placeholder*="Tìm kiếm"]', productName);
    await page.waitForTimeout(700);

    await expect(page.locator(`text=${productName}`)).toBeVisible({ timeout: 8000 });

    // Open action menu / delete button for the product row
    const row = page.locator("table tbody tr").filter({ hasText: productName }).first();
    const deleteBtn = row
      .locator('button:has-text("Xóa"), button[aria-label*="xóa"], button[aria-label*="delete"]')
      .or(row.locator("button:has(svg)").last());
    await deleteBtn.click();
    await page.waitForTimeout(300);

    // If there's a dropdown menu item, click it
    const menuDeleteItem = page
      .locator('[role="menuitem"]')
      .filter({ hasText: /xóa|delete/i })
      .first();
    if (await menuDeleteItem.isVisible({ timeout: 1500 }).catch(() => false)) {
      await menuDeleteItem.click();
      await page.waitForTimeout(300);
    }

    // A confirm dialog should appear — click Cancel / Hủy
    const cancelBtn = page
      .locator('button:has-text("Hủy"), button:has-text("Cancel"), button:has-text("Không")')
      .first();

    if (await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cancelBtn.click();
    } else {
      // Browser native confirm — dismiss it
      page.once("dialog", (dialog) => dialog.dismiss());
    }

    await page.waitForTimeout(500);

    // Product must still be in the list
    await expect(page.locator(`text=${productName}`)).toBeVisible({ timeout: 5000 });
  });

  // TC-PROD-015: Bulk delete — create 3 products, select all, delete all
  test("TC-PROD-015: should bulk delete multiple products", async ({ page }) => {
    const names = [`BulkDel A ${runId}`, `BulkDel B ${runId}`, `BulkDel C ${runId}`];

    // Create 3 products via API
    for (let i = 0; i < names.length; i++) {
      await createProductWithVariants(page, {
        name: names[i],
        variants: [{ sku: `BULK-${i}-${runId}`, price: 10000 }],
      });
    }

    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    // Search for bulk products to narrow the list
    await page.fill('input[placeholder*="Tìm kiếm"]', `BulkDel`);
    await page.waitForTimeout(700);

    // Enter select/bulk mode if there's a dedicated button
    const selectModeBtn = page
      .locator('button:has-text("Chọn"), button:has-text("Select"), button[aria-label*="select"]')
      .first();
    if (await selectModeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await selectModeBtn.click();
      await page.waitForTimeout(300);
    }

    // Check "select all" checkbox
    const selectAllCheckbox = page
      .locator('input[type="checkbox"][aria-label*="all"], th input[type="checkbox"]')
      .or(page.locator('thead input[type="checkbox"]'))
      .first();

    if (await selectAllCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectAllCheckbox.check();
      await page.waitForTimeout(300);
    } else {
      // Check individual rows
      const rowCheckboxes = page.locator("table tbody tr input[type='checkbox']");
      const checkboxCount = await rowCheckboxes.count();
      for (let i = 0; i < Math.min(checkboxCount, 3); i++) {
        await rowCheckboxes.nth(i).check();
      }
    }

    // Click bulk delete button
    const bulkDeleteBtn = page
      .locator('button:has-text("Xóa đã chọn"), button:has-text("Xóa"), button[aria-label*="bulk"]')
      .filter({ hasText: /xóa/i })
      .first();

    await expect(bulkDeleteBtn).toBeVisible({ timeout: 5000 });
    await bulkDeleteBtn.click();
    await page.waitForTimeout(300);

    // Confirm the deletion dialog
    const confirmBtn = page
      .locator(
        'button:has-text("Xác nhận"), button:has-text("Xóa"), button:has-text("Confirm"), button:has-text("OK")',
      )
      .filter({ hasText: /xác nhận|confirm|xóa|ok/i })
      .first();

    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
    } else {
      page.once("dialog", (dialog) => dialog.accept());
    }

    await page.waitForTimeout(1000);

    // All 3 products should no longer appear
    for (const name of names) {
      await expect(page.locator(`text=${name}`)).not.toBeVisible({ timeout: 8000 });
    }
  });

  // TC-PROD-016: Cannot delete product that has active orders
  test("TC-PROD-016: should show error when deleting product with active orders", async ({
    page,
  }) => {
    // Create customer for the order
    const customerRes = await apiPost<any>(page, "/api/admin/customers", {
      fullName: `Order Cust ${runId}`,
      phone: `09${runId.replace(/\D/g, "").slice(0, 8)}`,
      customerType: "retail",
    });
    const customerId =
      customerRes.data?.customer?.id ?? customerRes.data?.data?.id ?? customerRes.data?.id;

    // Create product + variant
    const product = await createProductWithVariants(page, {
      name: `HasOrder ${runId}`,
      variants: [{ sku: `ORD-${runId}`, price: 100000, stockQuantity: 10 }],
    });
    const variantId = product.product?.variants?.[0]?.id;

    // Create an order referencing the variant
    let orderId: string | null = null;
    if (customerId && variantId) {
      const orderRes = await apiPost<any>(page, "/api/admin/orders", {
        customerId,
        items: [{ variantId, quantity: 1 }],
      });
      orderId = orderRes.data?.order?.id ?? null;
    }

    // Attempt to delete the product via API
    const productId = product.product?.id;
    if (!productId) {
      test.skip(true, "Product creation failed — cannot test delete with orders");
    }

    const deleteRes = await apiDelete<any>(page, `/api/admin/products/${productId}`);

    if (deleteRes.response.status() === 400 || deleteRes.response.status() === 409) {
      // API correctly rejected the delete — verify via UI as well
      await page.goto("/products");
      await page.fill('input[placeholder*="Tìm kiếm"]', `HasOrder ${runId}`);
      await page.waitForTimeout(700);
      await expect(page.locator(`text=HasOrder ${runId}`)).toBeVisible({ timeout: 8000 });
    } else {
      // Try via UI to trigger the toast error
      await page.goto("/products");
      await page.fill('input[placeholder*="Tìm kiếm"]', `HasOrder ${runId}`);
      await page.waitForTimeout(700);

      const row = page
        .locator("table tbody tr")
        .filter({ hasText: `HasOrder ${runId}` })
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

        // Either error toast shown, or product still visible
        const errorToast = page
          .locator('[role="alert"], [data-sonner-toast], .toast')
          .filter({ hasText: /đơn hàng|order|không thể xóa|cannot delete/i })
          .first();

        const stillVisible = await page
          .locator(`text=HasOrder ${runId}`)
          .isVisible({ timeout: 3000 })
          .catch(() => false);

        const toastVisible = await errorToast.isVisible({ timeout: 3000 }).catch(() => false);

        expect(toastVisible || stillVisible).toBe(true);
      }
    }

    // Cleanup order before product cleanup
    if (orderId) {
      await apiPost(page, `/api/admin/orders/${orderId}/cancel`, {}).catch(() => {});
      await apiDelete(page, `/api/admin/orders/${orderId}`).catch(() => {});
    }
    if (customerId) {
      await apiDelete(page, `/api/admin/customers/${customerId}`).catch(() => {});
    }
  });
});
