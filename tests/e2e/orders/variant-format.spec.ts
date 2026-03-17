import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS } from "../fixtures/data";
import { apiPost, createOrder, getCustomerByPhone, getCustomers } from "../helpers/api";

/**
 * Order - Variant Display Format
 * Test cases: TC-ORD-027
 * Seed E2E only has users; ensure customer exists (test creates its own product).
 */
test.describe("Order - Variant Display Format", () => {
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
  });

  test("TC-ORD-027 should format JSON variant names in order detail display", async ({ page }) => {
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);

    // Create a product with variant name as JSON (simulating old data format)
    const jsonVariantName = '{"color":"Black","size":"S"}';
    const productRes = await apiPost<any>(page, "/api/admin/products", {
      name: `JSON Format Test ${Date.now()}`,
      description: "",
      categoryId: null,
      basePrice: 0,
      isActive: true,
      variants: [
        {
          name: jsonVariantName, // JSON string as variant name
          sku: `JSON-TEST-${Date.now()}`,
          price: 100000,
          costPrice: 50000,
          stockQuantity: 10,
          stockType: "in_stock",
        },
      ],
    });
    const productData = productRes.data;

    const variantId = productData.product?.variants?.[0]?.id;
    expect(variantId).toBeTruthy();

    // Create order with this variant
    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });

    // Navigate to order detail page
    await page.goto(`/orders/${result.order.id}`);
    await page.waitForSelector('[data-slot="badge"]', { timeout: 10000 }).catch(() => {});

    // Verify that raw JSON string is NOT displayed
    const rawJsonPattern = /\{"color":"Black","size":"S"\}/;
    const rawJsonCount = await page.locator(`text=${rawJsonPattern}`).count();
    expect(rawJsonCount).toBe(0);

    // Verify that formatted text "Black - S" IS displayed
    const formattedPattern = /Black.*S|S.*Black/i;
    const formattedText = page.locator(`text=${formattedPattern}`).first();
    await expect(formattedText).toBeVisible({ timeout: 5000 });

    // Verify the formatted text contains both values
    const textContent = await formattedText.textContent();
    expect(textContent).toMatch(/Black/i);
    expect(textContent).toMatch(/S/i);
  });
});
