import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  cleanupTestProducts,
  createProductWithVariants,
  createSupplierOrder,
  getProductsWithVariants,
  getSupplierOrderDetails,
  updateSupplierOrderStatus,
} from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-008, TC-SUP-ORDER-015, TC-SUP-ORDER-019
 */
test.describe("Supplier Orders - Stock Updates", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-SUP-STOCK-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestProducts(page, runId);
  });

  test("TC-SUP-ORDER-008 should update stock when receiving in_stock items", async ({ page }) => {
    const sku = `SUP-IN-${runId}`;
    const { product } = await createProductWithVariants(page, {
      name: `Supplier Stock ${runId}`,
      variants: [{ sku, onHand: 0, price: 10000, costPrice: 5000 }],
    });
    const inStockVariant = product.variants.find((v: any) => v.sku === sku);
    expect(inStockVariant?.id).toBeTruthy();

    const initialStock = Number(inStockVariant.onHand ?? inStockVariant.stockQuantity ?? 0);
    const quantityToAdd = 5;

    // Create supplier order
    const { supplierOrder } = await createSupplierOrder(page, {
      variantId: inStockVariant.id,
      quantity: quantityToAdd,
    });

    expect(supplierOrder?.id).toBeTruthy();

    const patchResponse = await updateSupplierOrderStatus(page, supplierOrder.id, "received");
    expect(patchResponse.status()).toBe(200);

    // Verify stock increased via API
    const productsAfter = await getProductsWithVariants(page);
    const variantAfter = productsAfter
      .flatMap((p: any) => p.variants || [])
      .find((v: any) => v.id === inStockVariant.id);

    expect(Number(variantAfter?.onHand ?? variantAfter?.stockQuantity ?? 0)).toBe(
      initialStock + quantityToAdd,
    );
  });

  test("TC-SUP-ORDER-015 should not update stock twice when received repeatedly", async ({
    page,
  }) => {
    const sku = `SUP-REPEAT-${runId}`;
    const { product } = await createProductWithVariants(page, {
      name: `Supplier Repeat ${runId}`,
      variants: [{ sku, onHand: 0, price: 10000, costPrice: 5000 }],
    });
    const variant = product.variants.find((v: any) => v.sku === sku);
    expect(variant?.id).toBeTruthy();

    const initialStock = Number(variant.onHand ?? variant.stockQuantity ?? 0);
    const quantityToAdd = 5;

    const { supplierOrder } = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: quantityToAdd,
    });

    expect(supplierOrder?.id).toBeTruthy();

    const firstPatchResponse = await updateSupplierOrderStatus(page, supplierOrder.id, "received");
    expect(firstPatchResponse.status()).toBe(200);
    const secondPatchResponse = await updateSupplierOrderStatus(page, supplierOrder.id, "received");
    expect(secondPatchResponse.status()).toBe(200);

    const productsAfter = await getProductsWithVariants(page);
    const variantAfter = productsAfter
      .flatMap((p: any) => p.variants || [])
      .find((v: any) => v.id === variant.id);

    expect(Number(variantAfter?.onHand ?? variantAfter?.stockQuantity ?? 0)).toBe(
      initialStock + quantityToAdd,
    );

    // Verify order status is received
    const orderDetails = await getSupplierOrderDetails(page, supplierOrder.id);
    expect(orderDetails.status).toBe("received");
  });

  test("TC-SUP-ORDER-019 should handle manual restocking orders", async ({ page }) => {
    const sku = `SUP-MANUAL-${runId}`;
    const { product } = await createProductWithVariants(page, {
      name: `Supplier Manual ${runId}`,
      variants: [{ sku, onHand: 0, price: 10000, costPrice: 5000 }],
    });
    const variant = product.variants.find((v: any) => v.sku === sku);
    expect(variant?.id).toBeTruthy();

    const initialStock = Number(variant.onHand ?? variant.stockQuantity ?? 0);
    const quantityToAdd = 10;

    // Create manual supplier order
    const { supplierOrder } = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: quantityToAdd,
    });

    expect(supplierOrder?.id).toBeTruthy();

    // Verify via API that order has no orderItemId (manual restocking)
    const orderDetails = await getSupplierOrderDetails(page, supplierOrder.id);
    expect(orderDetails.order?.id).toBeFalsy(); // No linked order

    // Receive the order
    const patchResponse = await updateSupplierOrderStatus(page, supplierOrder.id, "received");
    expect(patchResponse.status()).toBe(200);

    // Verify stock increased (manual restocking always updates stock)
    const productsAfter = await getProductsWithVariants(page);
    const variantAfter = productsAfter
      .flatMap((p: any) => p.variants || [])
      .find((v: any) => v.id === variant.id);

    expect(Number(variantAfter?.onHand ?? variantAfter?.stockQuantity ?? 0)).toBe(
      initialStock + quantityToAdd,
    );
  });
});
