import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  createOrder,
  findVariantIdBySku,
  getCustomerByPhone,
  getOrderDetails,
  updateOrder,
} from "../helpers/api";

/**
 * Order - Edit Restrictions
 * Test cases: TC-ORD-009, TC-ORD-017, TC-ORD-018
 */
test.describe("Order - Edit Restrictions", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-ORD-009 should restrict order edits", async ({ page }) => {
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });

    await page.goto(`/orders/${result.order.id}`);

    // Ensure order item table has no editable fields
    const itemsTable = page.locator("table").first();
    await expect(itemsTable.locator("input, select, textarea")).toHaveCount(0);

    // Ensure customer section is not editable
    const customerCard = page.locator("text=Khách hàng").first().locator("..");
    await expect(customerCard.locator("input, select, textarea")).toHaveCount(0);

    // Admin note update allowed
    const adminNote = `E2E Admin Note ${Date.now()}`;
    await page.click('button:has-text("Chỉnh sửa")');
    await page.fill("textarea#adminNote", adminNote);
    await page.click('button:has-text("Lưu")');
    await expect(page.locator(`text=${adminNote}`)).toBeVisible();
  });

  test("TC-ORD-017 should allow admin note edit", async ({ page }) => {
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });

    const adminNote = `E2E Admin Note ${Date.now()}`;
    const discount = 10000;
    const { response: updateRes } = await updateOrder(page, result.order.id, {
      adminNote,
      discount,
    });
    expect(updateRes.status()).toBe(200);

    const updated = await getOrderDetails(page, result.order.id);
    expect(updated.adminNote).toBe(adminNote);
    const expectedTotal = Number(updated.subtotal) - discount;
    expect(Number(updated.total)).toBe(expectedTotal);
  });

  test("TC-ORD-018 should block order item quantity edit", async ({ page }) => {
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });

    await page.goto(`/orders/${result.order.id}`);
    const itemsTable = page.locator("table").first();
    await expect(itemsTable.locator("input, select")).toHaveCount(0);
  });
});
