import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  apiPost,
  cancelOrder,
  createOrder,
  createProductWithVariants,
  findVariantIdBySku,
  getCustomerByPhone,
  getCustomers,
  getProductsWithVariants,
} from "../helpers/api";

/**
 * Order - Stock
 * Test cases: TC-ORD-005, TC-ORD-010
 * Seed E2E only has users; ensure customer + products (testTshirt, basicTee) exist.
 */
test.describe("Order - Stock", () => {
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
    const hasTestTshirt = products.some((p: any) =>
      p.variants?.some((v: any) => v.sku === TEST_PRODUCTS.testTshirt.sku),
    );
    if (!hasTestTshirt) {
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
    const hasBasicTee = products.some((p: any) =>
      p.variants?.some(
        (v: any) =>
          v.sku === TEST_PRODUCTS.basicTee.skuInStock ||
          v.sku === TEST_PRODUCTS.basicTee.skuOutOfStock,
      ),
    );
    if (!hasBasicTee) {
      await createProductWithVariants(page, {
        name: TEST_PRODUCTS.basicTee.name,
        slug: TEST_PRODUCTS.basicTee.slug,
        isActive: true,
        variants: [
          {
            sku: TEST_PRODUCTS.basicTee.skuInStock,
            stockQuantity: 5,
            retailPrice: 80,
            costPrice: 40,
          },
          {
            sku: TEST_PRODUCTS.basicTee.skuOutOfStock,
            stockQuantity: 0,
            retailPrice: 80,
            costPrice: 40,
          },
        ],
      });
    }
  });

  test("TC-ORD-005 should restore stock when order is cancelled", async ({ page }) => {
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    const productsBefore = await getProductsWithVariants(page);
    const variantBefore = productsBefore
      .flatMap((p) => p.variants || [])
      .find((v) => v.id === variantId);

    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });

    await cancelOrder(page, result.order.id);

    const productsAfter = await getProductsWithVariants(page);
    const variantAfter = productsAfter
      .flatMap((p) => p.variants || [])
      .find((v) => v.id === variantId);

    expect(Number(variantAfter.stockQuantity)).toBeGreaterThanOrEqual(
      Number(variantBefore.stockQuantity),
    );
  });

  test("TC-ORD-010 should create order and itemsNeedingStock when insufficient stock (vẫn tạo đơn, cần nhập thêm hàng)", async ({
    page,
  }) => {
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const products = await getProductsWithVariants(page);
    const variant = products
      .flatMap((p) => p.variants || [])
      .find((v) => v.sku === TEST_PRODUCTS.basicTee.skuInStock);
    expect(variant?.id).toBeTruthy();

    const stockBefore = Number(variant.stockQuantity || 0);
    const requested = Math.max(stockBefore + 100, 1);
    const { response, data } = await apiPost<any>(page, "/api/admin/orders", {
      customerId: customer.id,
      items: [{ variantId: variant.id, quantity: requested }],
    });
    expect(response.ok()).toBe(true);
    expect(data?.success).toBe(true);
    expect(data?.order?.id).toBeTruthy();
    expect(Array.isArray(data?.itemsNeedingStock)).toBe(true);
    const needItem = data.itemsNeedingStock?.find((i: any) => i.sku === variant.sku);
    expect(needItem).toBeDefined();
    expect(needItem.quantityToOrder).toBe(requested - stockBefore);

    const productsAfter = await getProductsWithVariants(page);
    const variantAfter = productsAfter
      .flatMap((p) => p.variants || [])
      .find((v) => v.id === variant.id);
    // Stock allows negative: full quantity deducted → stockBefore - requested
    expect(Number(variantAfter?.stockQuantity)).toBe(stockBefore - requested);
  });
});
