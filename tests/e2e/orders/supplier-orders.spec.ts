import { ORDER_STATUS } from "@/lib/constants";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  apiPost,
  createOrder,
  createProductWithVariants,
  createSupplierOrder,
  deleteSupplierOrder,
  findVariantIdBySku,
  getCustomerByPhone,
  getCustomers,
  getProductsWithVariants,
  getSupplierOrderDetails,
  getSupplierOrders,
  updateOrderStatus,
  updateSupplierOrderStatus,
} from "../helpers/api";

/**
 * Order - Supplier Orders
 * Test cases: TC-ORD-008, TC-ORD-014, TC-ORD-015, TC-ORD-016, TC-ORD-020, TC-ORD-021
 * Seed E2E only has users; ensure customer + testTshirt + preorder products exist.
 */
test.describe("Order - Supplier Orders", () => {
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
    const hasPreorder = products.some((p: any) =>
      p.variants?.some((v: any) => v.sku === TEST_PRODUCTS.preorder.sku),
    );
    if (!hasPreorder) {
      await createProductWithVariants(page, {
        name: TEST_PRODUCTS.preorder.name,
        slug: TEST_PRODUCTS.preorder.slug,
        isActive: true,
        variants: [
          {
            sku: TEST_PRODUCTS.preorder.sku,
            stockQuantity: 0,
            retailPrice: 150,
            costPrice: 80,
          },
        ],
      });
    }
  });

  test("TC-ORD-008 should manage supplier order lifecycle", async ({ page }) => {
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const preOrderVariant = await findVariantIdBySku(page, TEST_PRODUCTS.preorder.sku);
    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: preOrderVariant!, quantity: 1 }],
    });

    const supplierOrders = await getSupplierOrders(page, {
      search: result.order.orderNumber,
    });
    expect(supplierOrders.length).toBeGreaterThan(0);

    const supplierOrder = supplierOrders[0];
    expect(supplierOrder.status).toBe("pending");

    const orderedRes = await updateSupplierOrderStatus(page, supplierOrder.id, "ordered");
    expect(orderedRes.status()).toBe(200);

    const receivedRes = await updateSupplierOrderStatus(page, supplierOrder.id, "received");
    expect(receivedRes.status()).toBe(200);

    const updated = await getSupplierOrderDetails(page, supplierOrder.id);
    expect(updated.status).toBe("received");
    expect(updated.orderedAt).toBeTruthy();
    expect(updated.receivedAt).toBeTruthy();
  });

  test("TC-ORD-014 should update stock on supplier received", async ({ page }) => {
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    const productsBefore = await getProductsWithVariants(page);
    const variantBefore = productsBefore
      .flatMap((p) => p.variants || [])
      .find((v) => v.id === variantId);
    const stockBefore = Number(variantBefore?.stockQuantity || 0);

    const created = await createSupplierOrder(page, {
      variantId: variantId!,
      quantity: 4,
    });
    expect(created.success).toBe(true);

    const receivedRes = await updateSupplierOrderStatus(page, created.supplierOrder.id, "received");
    expect(receivedRes.status()).toBe(200);

    const productsAfter = await getProductsWithVariants(page);
    const variantAfter = productsAfter
      .flatMap((p) => p.variants || [])
      .find((v) => v.id === variantId);
    expect(Number(variantAfter?.stockQuantity || 0)).toBe(stockBefore + 4);
  });

  test("TC-ORD-015 should restrict supplier order deletion", async ({ page }) => {
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);

    const pending = await createSupplierOrder(page, {
      variantId: variantId!,
      quantity: 1,
    });
    const deletePending = await deleteSupplierOrder(page, pending.supplierOrder.id);
    expect(deletePending.status()).toBe(500);

    const ordered = await createSupplierOrder(page, {
      variantId: variantId!,
      quantity: 1,
    });
    await updateSupplierOrderStatus(page, ordered.supplierOrder.id, "ordered");
    const deleteOrdered = await deleteSupplierOrder(page, ordered.supplierOrder.id);
    expect(deleteOrdered.status()).toBe(500);

    const cancelled = await createSupplierOrder(page, {
      variantId: variantId!,
      quantity: 1,
    });
    await updateSupplierOrderStatus(page, cancelled.supplierOrder.id, "cancelled");
    const deleteCancelled = await deleteSupplierOrder(page, cancelled.supplierOrder.id);
    expect(deleteCancelled.status()).toBe(200);
  });

  test("TC-ORD-016 should persist supplier order update fields", async ({ page }) => {
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    const created = await createSupplierOrder(page, {
      variantId: variantId!,
      quantity: 1,
    });

    const expectedDate = new Date(Date.now() + 86400000).toISOString();
    const note = `E2E supplier note ${Date.now()}`;
    const updateRes = await updateSupplierOrderStatus(page, created.supplierOrder.id, "ordered", {
      note,
      actualCostPrice: "55000",
      expectedDate,
    });
    expect(updateRes.status()).toBe(200);

    const updated = await getSupplierOrderDetails(page, created.supplierOrder.id);
    expect(updated.note).toBe(note);
    expect(Number(updated.actualCostPrice)).toBe(55000);
    expect(new Date(updated.expectedDate).toDateString()).toBe(
      new Date(expectedDate).toDateString(),
    );
  });

  test("TC-ORD-020 should remove supplier orders on cancel", async ({ page }) => {
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const preOrderVariant = await findVariantIdBySku(page, TEST_PRODUCTS.preorder.sku);

    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: preOrderVariant!, quantity: 1 }],
    });

    // Cancel the order
    await updateOrderStatus(page, result.order.id, ORDER_STATUS.CANCELLED);

    // Check if supplier orders are cancelled/removed
    const supplierOrdersAfter = await getSupplierOrders(page, {
      search: result.order.orderNumber,
    });

    // Either removed or marked as cancelled
    if (supplierOrdersAfter.length > 0) {
      const hasAllCancelled = supplierOrdersAfter.every(
        (so: any) => so.status === ORDER_STATUS.CANCELLED,
      );
      expect(hasAllCancelled).toBe(true);
    }
  });

  test("TC-ORD-021 should allow manual supplier order received", async ({ page }) => {
    // Use in_stock variant - manual supplier orders should increase stock for in_stock items
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    const productsBefore = await getProductsWithVariants(page);
    const variantBefore = productsBefore
      .flatMap((p) => p.variants || [])
      .find((v) => v.id === variantId);
    const stockBefore = Number(variantBefore?.stockQuantity || 0);

    const created = await createSupplierOrder(page, {
      variantId: variantId!,
      quantity: 5,
    });
    expect(created.success).toBe(true);

    const receivedRes = await updateSupplierOrderStatus(page, created.supplierOrder.id, "received");
    expect(receivedRes.status()).toBe(200);

    const productsAfter = await getProductsWithVariants(page);
    const variantAfter = productsAfter
      .flatMap((p) => p.variants || [])
      .find((v) => v.id === variantId);
    expect(Number(variantAfter?.stockQuantity || 0)).toBe(stockBefore + 5);
  });
});
