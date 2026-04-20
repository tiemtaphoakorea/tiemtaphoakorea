import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  apiPost,
  cancelOrder,
  createOrder,
  createProductWithVariants,
  deleteOrder,
  findVariantIdBySku,
  getCustomerByPhone,
  getCustomers,
  getProductsWithVariants,
  recordPayment,
} from "../helpers/api";

/**
 * Order - Delete Rules
 * Test cases: TC-ORD-012
 * Seed E2E only has users; ensure customer + product exist before tests.
 */
test.describe("Order - Delete Rules", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    const customers = await getCustomers(page, TEST_CUSTOMERS.primary.phone);
    if (customers.length === 0) {
      await apiPost<any>(page, "/api/admin/customers", {
        fullName: TEST_CUSTOMERS.primary.fullName,
        phone: TEST_CUSTOMERS.primary.phone,
        customerType: "retail",
      });
    }
    const products = await getProductsWithVariants(page);
    const hasProduct = products.some((p: any) =>
      p.variants?.some((v: any) => v.sku === TEST_PRODUCTS.testTshirt.sku),
    );
    if (!hasProduct) {
      await createProductWithVariants(page, {
        name: TEST_PRODUCTS.testTshirt.name,
        slug: TEST_PRODUCTS.testTshirt.slug,
        isActive: true,
        variants: [
          {
            sku: TEST_PRODUCTS.testTshirt.sku,
            stockQuantity: 10,
            retailPrice: 100,
            costPrice: 50,
          },
        ],
      });
    }
  });

  test("TC-ORD-012 should enforce delete order rules", async ({ page }) => {
    test.setTimeout(90000); // 3 orders + deletes + payment; needs more than default 30s
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);

    const getStock = async () => {
      const products = await getProductsWithVariants(page);
      const variant = products.flatMap((p) => p.variants || []).find((v) => v.id === variantId);
      return Number(variant?.stockQuantity || 0);
    };

    const _stockBefore = await getStock();
    const pending = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });

    const stockAfterCreatePending = await getStock();

    // Check UI button visibility for PENDING order
    await page.goto(`/orders/${pending.order.id}`);
    await expect(page.getByTestId("delete-order-button")).not.toBeVisible();

    // Verify API restriction still works
    const deletePending = await deleteOrder(page, pending.order.id);
    expect(deletePending.status()).toBe(500);
    const stockAfterPending = await getStock();
    // Delete attempt must not modify stock for non-cancelled (PENDING) orders
    expect(stockAfterPending).toBe(stockAfterCreatePending);

    const cancelled = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });
    await cancelOrder(page, cancelled.order.id);

    // Check UI button visibility for CANCELLED order
    await page.goto(`/orders/${cancelled.order.id}`);
    await page.reload(); // Force refresh to be sure

    // Debug: verify status is indeed 'Đã hủy' in UI
    await expect(page.locator('[data-slot="badge"]')).toContainText("Đã hủy", {
      timeout: 10000,
    });

    await expect(page.locator('[data-testid="delete-order-button"]')).toBeVisible({
      timeout: 15000,
    });

    const deleteCancelled = await deleteOrder(page, cancelled.order.id);
    expect(deleteCancelled.status()).toBe(200);

    const paid = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });
    await recordPayment(page, paid.order.id, {
      amount: Number(paid.order.total),
      method: "cash",
    });

    // Check UI button visibility for PAID order
    await page.goto(`/orders/${paid.order.id}`);
    await expect(page.getByTestId("delete-order-button")).not.toBeVisible();

    const deletePaid = await deleteOrder(page, paid.order.id);
    expect(deletePaid.status()).toBe(500);
  });
});
