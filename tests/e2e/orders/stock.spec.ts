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
  const onHandOf = (variant: any) => Number(variant?.onHand ?? variant?.stockQuantity ?? 0);
  const reservedOf = (variant: any) => Number(variant?.reserved ?? 0);

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

  test("TC-ORD-005 should release reserved stock when a pending order is cancelled", async ({
    page,
  }) => {
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    const productsBefore = await getProductsWithVariants(page);
    const variantBefore = productsBefore
      .flatMap((p) => p.variants || [])
      .find((v) => v.id === variantId);
    const onHandBefore = onHandOf(variantBefore);
    const reservedBefore = reservedOf(variantBefore);

    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });
    expect(result?.order?.id).toBeTruthy();

    const productsAfterCreate = await getProductsWithVariants(page);
    const variantAfterCreate = productsAfterCreate
      .flatMap((p) => p.variants || [])
      .find((v) => v.id === variantId);
    expect(onHandOf(variantAfterCreate)).toBe(onHandBefore);
    expect(reservedOf(variantAfterCreate)).toBe(reservedBefore + 1);

    const cancelResult = await cancelOrder(page, result.order.id);
    expect(cancelResult.response.ok()).toBe(true);

    const productsAfter = await getProductsWithVariants(page);
    const variantAfter = productsAfter
      .flatMap((p) => p.variants || [])
      .find((v) => v.id === variantId);

    expect(onHandOf(variantAfter)).toBe(onHandBefore);
    expect(reservedOf(variantAfter)).toBe(reservedBefore);
  });

  test("TC-ORD-010 should reserve full order quantity and report shortage when stock is insufficient", async ({
    page,
  }) => {
    const runId = Date.now();
    const productResult = await createProductWithVariants(page, {
      name: `E2E Stock Shortage ${runId}`,
      slug: `e2e-stock-shortage-${runId}`,
      isActive: true,
      variants: [
        {
          sku: `E2E-STOCK-SHORT-${runId}`,
          stockQuantity: 3,
          retailPrice: 80,
          costPrice: 40,
        },
      ],
    });
    const variant = productResult.product?.variants?.[0];
    expect(variant?.id).toBeTruthy();

    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const stockBefore = onHandOf(variant);
    const reservedBefore = reservedOf(variant);
    const availableBefore = stockBefore - reservedBefore;
    const requested = availableBefore + 5;
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
    expect(needItem.quantityToOrder).toBe(requested - availableBefore);

    const productsAfter = await getProductsWithVariants(page);
    const variantAfter = productsAfter
      .flatMap((p) => p.variants || [])
      .find((v) => v.id === variant.id);
    expect(onHandOf(variantAfter)).toBe(stockBefore);
    expect(reservedOf(variantAfter)).toBe(reservedBefore + requested);

    const cancelResult = await cancelOrder(page, data.order.id);
    expect(cancelResult.response.ok()).toBe(true);
  });
});
