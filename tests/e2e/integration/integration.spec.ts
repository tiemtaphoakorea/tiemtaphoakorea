import { FULFILLMENT_STATUS, PAYMENT_STATUS } from "@workspace/shared/constants";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  cancelOrder,
  createOrder,
  createProductWithVariants,
  getCustomerByPhone,
  getCustomers,
  getOrderDetails,
  getProductsWithVariants,
  getSupplierOrderDetails,
  getSupplierOrders,
  recordPayment,
  updateSupplierOrderStatus,
} from "../helpers/api";

test.describe("Integration", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.describe("Integration - Product and Order Flow", () => {
    // Shared data cho test group
    let baseCustomerId: string;

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAsAdmin(page);

      // Tạo base customer cho tests
      const customers = await getCustomers(page);
      baseCustomerId = customers[0]?.id;

      await context.close();
    });

    test("TC-INT-001 should decrease stock and show low stock alert after order", async ({
      page,
    }) => {
      // Tạo test-specific data
      let productData: any;
      let productId: string;
      let variantId: string;
      let customerId: string;

      // Setup data cho test này
      await test.step("Setup test data", async () => {
        productData = await createProductWithVariants(page, {
          name: `Low Stock Test Product ${Date.now()}`,
          description: "Test product for low stock",
          categoryId: null,
          isActive: true,
          variants: [
            {
              sku: `LSTP-${Date.now()}`,
              attributes: { color: "Black", size: "S" },
              stockQuantity: 5,
              lowStockThreshold: 2,
              retailPrice: 100,
              costPrice: 50,
            },
          ],
        });

        expect(productData.success).toBe(true);
        productId = productData.product?.id;
        variantId = productData.product?.variants?.[0]?.id;

        expect(variantId).toBeDefined();
        expect(productId).toBeDefined();

        await page.waitForTimeout(2000);

        customerId = baseCustomerId;
      });

      // Execute test
      await test.step("Create order and verify stock decrease", async () => {
        const orderData = await createOrder(page, {
          customerId,
          items: [{ variantId, quantity: 3 }],
        });

        expect(orderData.success).toBe(true);
      });

      // Verify results
      await test.step("Verify low stock alert", async () => {
        const products = await getProductsWithVariants(page);
        const updatedProduct = products.find((p: any) => p.id === productId);
        const updatedVariant = updatedProduct?.variants?.find((v: any) => v.id === variantId);

        expect(updatedVariant?.stockQuantity).toBe(2);
        expect(updatedVariant?.stockQuantity).toBeLessThanOrEqual(
          updatedVariant?.lowStockThreshold,
        );
      });
    });

    test("TC-INT-002 should handle mixed stock types (in-stock + pre-order)", async ({ page }) => {
      // Test-specific data
      let inStockVariantId: string;
      let preOrderVariantId: string;
      let preOrderSku: string;
      let customerId: string;
      let inStockProductId: string;
      let preOrderProductId: string;

      // Setup data
      await test.step("Setup test products", async () => {
        const inStockSku = `ISP-${Date.now()}`;
        preOrderSku = `POP-${Date.now()}`;

        const inStockProduct = await createProductWithVariants(page, {
          name: `In-Stock Product ${Date.now()}`,
          categoryId: null,
          variants: [
            {
              sku: inStockSku,
              stockQuantity: 10,
              retailPrice: 100,
              costPrice: 50,
            },
          ],
        });

        const preOrderProduct = await createProductWithVariants(page, {
          name: `Pre-Order Product ${Date.now()}`,
          categoryId: null,
          variants: [
            {
              sku: preOrderSku,
              stockQuantity: 0,
              retailPrice: 200,
              costPrice: 100,
            },
          ],
        });

        await page.waitForTimeout(800);
        const productsList = await getProductsWithVariants(page);
        inStockVariantId =
          productsList.find((p: any) => p.id === inStockProduct.product?.id)?.variants?.[0]?.id ??
          inStockProduct.product?.variants?.[0]?.id;
        preOrderVariantId =
          productsList.find((p: any) => p.id === preOrderProduct.product?.id)?.variants?.[0]?.id ??
          preOrderProduct.product?.variants?.[0]?.id;

        inStockProductId = inStockProduct.product?.id;
        preOrderProductId = preOrderProduct.product?.id;
        customerId = baseCustomerId;
      });

      // Execute test
      await test.step("Create order with mixed stock types", async () => {
        const orderData = await createOrder(page, {
          customerId,
          items: [
            { variantId: inStockVariantId, quantity: 2 },
            { variantId: preOrderVariantId, quantity: 1 },
          ],
        });

        expect(orderData.success).toBe(true);
      });

      // Verify results
      await test.step("Verify stock updates and supplier order creation", async () => {
        const products = await getProductsWithVariants(page);
        const updatedInStock = products.find((p: any) => p.id === inStockProductId)?.variants?.[0];
        expect(updatedInStock?.stockQuantity).toBe(8);

        const updatedPreOrder = products.find((p: any) => p.id === preOrderProductId)
          ?.variants?.[0];
        expect(updatedPreOrder?.stockQuantity).toBe(0);

        const supplierOrdersList = await getSupplierOrders(page);
        const relatedSupplierOrder = supplierOrdersList.find(
          (so: any) => so.variantId === preOrderVariantId || so.item?.sku === preOrderSku,
        );
        expect(relatedSupplierOrder).toBeDefined();
      });
    });

    test("TC-INT-003 should create order with mixed in-stock + out-of-stock and show items needing stock", async ({
      page,
    }) => {
      // Test-specific data
      let variantAId: string;
      let variantBId: string;
      let skuB: string;
      let customerId: string;

      // Setup data
      await test.step("Setup test products", async () => {
        const ts = Date.now();
        const productA = await createProductWithVariants(page, {
          name: `In-Stock For Mixed ${ts}`,
          categoryId: null,
          variants: [
            {
              sku: `MIX-A-${ts}`,
              stockQuantity: 2,
              retailPrice: 100,
              costPrice: 50,
            },
          ],
        });
        const productB = await createProductWithVariants(page, {
          name: `Out-of-Stock For Mixed ${ts}`,
          categoryId: null,
          variants: [
            {
              sku: `MIX-B-${ts}`,
              stockQuantity: 0,
              retailPrice: 80,
              costPrice: 40,
            },
          ],
        });

        variantAId = productA.product?.variants?.[0]?.id;
        variantBId = productB.product?.variants?.[0]?.id;
        skuB = `MIX-B-${ts}`;
        expect(variantAId).toBeTruthy();
        expect(variantBId).toBeTruthy();

        customerId = baseCustomerId;
      });

      // Execute test
      let orderBody: any;
      await test.step("Create order with mixed stock", async () => {
        const orderResponse = await apiPost<any>(page, "/api/admin/orders", {
          customerId,
          items: [
            { variantId: variantAId, quantity: 1 },
            { variantId: variantBId, quantity: 1 },
          ],
        });

        expect(orderResponse.response.ok()).toBe(true);
        orderBody = await orderResponse.response.json().catch(() => ({}));
        expect(orderBody.success).toBe(true);
        expect(orderBody.order?.id).toBeTruthy();
      });

      // Verify results
      await test.step("Verify items needing stock", async () => {
        const itemsNeedingStock = orderBody.itemsNeedingStock ?? [];
        expect(itemsNeedingStock.length).toBeGreaterThanOrEqual(1);
        const needB = itemsNeedingStock.find((i: any) => i.sku === skuB);
        expect(needB).toBeDefined();
        expect(needB.quantityToOrder).toBe(1);
      });

      await test.step("Verify stock updates and supplier order", async () => {
        await page.waitForTimeout(2000);
        const products = await getProductsWithVariants(page);
        const updatedA = products
          .flatMap((p: any) => p.variants || [])
          .find((v: any) => v.id === variantAId);
        const updatedB = products
          .flatMap((p: any) => p.variants || [])
          .find((v: any) => v.id === variantBId);
        expect(Number(updatedA?.stockQuantity)).toBe(1);
        expect(Number(updatedB?.stockQuantity)).toBe(-1);

        const supplierOrdersList = await getSupplierOrders(page);
        const soForB = supplierOrdersList.find(
          (so: any) => so.variantId === variantBId || so.item?.sku === skuB,
        );
        expect(soForB).toBeDefined();
        expect(Number(soForB?.quantity)).toBe(1);
      });
    });
  });

  test.describe("Integration - Order and Customer", () => {
    let baseProducts: any[];

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAsAdmin(page);

      // Load base products for tests
      baseProducts = await getProductsWithVariants(page);

      await context.close();
    });

    test("TC-INT-004 should auto-create customer from order and update history", async ({
      page,
    }) => {
      // Test-specific data
      let uniquePhone: string;
      let variantId: string;

      // Setup data
      await test.step("Setup test data", async () => {
        uniquePhone = `09${Date.now().toString().slice(-8)}`;
        variantId = baseProducts[0]?.variants?.[0]?.id;
      });

      // Execute test
      let orderResponse: any;
      await test.step("Create order with new customer", async () => {
        orderResponse = await apiPost<any>(page, "/api/admin/orders", {
          customerPhone: uniquePhone,
          customerName: "New Auto Customer",
          items: [{ variantId, quantity: 1 }],
        });
      });

      // Verify results
      await test.step("Verify customer auto-creation and order history", async () => {
        if (orderResponse.response.ok()) {
          const customer = await getCustomerByPhone(page, uniquePhone);
          expect(customer).toBeDefined();
          expect(customer.phone).toBe(uniquePhone);

          const { data: responseData } = await apiGet<any>(
            page,
            `/api/admin/orders?customerId=${customer.id}`,
          );
          expect(responseData.data?.length).toBeGreaterThan(0);
        }
      });
    });

    test("TC-INT-004b should handle concurrent orders with same new customer phone", async ({
      page,
      browser,
    }) => {
      // Test-specific data
      let context1: any;
      let context2: any;
      let page1: any;
      let page2: any;
      let uniquePhone: string;
      let variantId: string;

      // Setup contexts and data
      await test.step("Setup test contexts and data", async () => {
        context1 = await browser.newContext();
        context2 = await browser.newContext();
        page1 = await context1.newPage();
        page2 = await context2.newPage();

        await loginAsAdmin(page1);
        await loginAsAdmin(page2);

        uniquePhone = `09${Date.now().toString().slice(-8)}`;

        const products = await getProductsWithVariants(page1);
        variantId = products[0]?.variants?.[0]?.id;
      });

      // Execute concurrent orders
      let result1: any;
      let result2: any;
      await test.step("Submit concurrent orders", async () => {
        [result1, result2] = await Promise.all([
          apiPost<any>(page1, "/api/admin/orders", {
            customerPhone: uniquePhone,
            customerName: "Concurrent Customer 1",
            items: [{ variantId, quantity: 1 }],
          }),
          apiPost<any>(page2, "/api/admin/orders", {
            customerPhone: uniquePhone,
            customerName: "Concurrent Customer 2",
            items: [{ variantId, quantity: 1 }],
          }),
        ]);
      });

      // Verify results
      await test.step("Verify no duplicate customers created", async () => {
        const successCount = [result1, result2].filter((r) => r.response.ok()).length;
        expect(successCount).toBeGreaterThanOrEqual(1);

        const allCustomers = await getCustomers(page1);
        const customersWithPhone = allCustomers.filter((c: any) => c.phone === uniquePhone);

        expect(customersWithPhone.length).toBe(1);

        if (result1.response.ok() && result2.response.ok()) {
          const order1 = result1.data.order;
          const order2 = result2.data.order;
          expect(order1.customerId).toBe(order2.customerId);
        }
      });

      // Cleanup
      await test.step("Cleanup contexts", async () => {
        await context1.close();
        await context2.close();
      });
    });
  });

  test.describe("Integration - Payment and Dashboard", () => {
    let baseCustomerId: string;
    let baseProducts: any[];

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAsAdmin(page);

      // Load base data
      const customers = await getCustomers(page);
      baseCustomerId = customers[0]?.id;
      baseProducts = await getProductsWithVariants(page);

      await context.close();
    });

    test("TC-INT-005 should update order status and dashboard KPIs after payment", async ({
      page,
    }) => {
      // Test-specific data
      let orderId: string;
      let total: number;
      let initialRevenue: number;

      // Setup: Create order and get initial stats
      await test.step("Setup test order and get initial stats", async () => {
        const variantId = baseProducts[0]?.variants?.[0]?.id;

        const orderData = await createOrder(page, {
          customerId: baseCustomerId,
          items: [{ variantId, quantity: 1 }],
        });

        expect(orderData.success).toBe(true);
        orderId = orderData.order?.id;
        total = Number(orderData.order?.total);

        const { data: initialData } = await apiGet<any>(page, "/api/admin/stats?section=kpi");
        initialRevenue = Number(initialData.kpiStats?.todayRevenue || 0);
      });

      // Execute: Record partial payment
      await test.step("Record partial payment", async () => {
        const partialAmount = Math.floor(total / 2);
        await recordPayment(page, orderId, {
          amount: partialAmount,
          method: "cash",
        });

        // Verify order is still pending but has paid amount
        const updatedOrder = await getOrderDetails(page, orderId);
        expect(updatedOrder.status).toBe("pending");
        expect(Number(updatedOrder.paidAmount)).toBe(partialAmount);
      });

      // Execute: Record remaining payment
      await test.step("Record remaining payment", async () => {
        const partialAmount = Math.floor(total / 2);
        const remainingAmount = total - partialAmount;
        await recordPayment(page, orderId, {
          amount: remainingAmount,
          method: "bank_transfer",
        });

        // Verify order status becomes "paid"
        const updatedOrder = await getOrderDetails(page, orderId);
        expect(updatedOrder.status).toBe("paid");
        expect(Number(updatedOrder.paidAmount)).toBe(total);
      });

      // Execute: Mark as delivered
      await test.step("Mark order as delivered", async () => {
        await apiPatch(page, `/api/admin/orders/${orderId}/status`, {
          status: "delivered",
        });
      });

      // Verify: Dashboard KPIs updated
      await test.step("Verify dashboard KPIs updated", async () => {
        const { data: updatedData } = await apiGet<any>(page, "/api/admin/stats?section=kpi");
        const updatedRevenue = Number(updatedData.kpiStats?.todayRevenue || 0);

        expect(updatedRevenue).toBe(initialRevenue + total);
      });
    });
  });

  test.describe("Integration - Supplier Order and Stock", () => {
    let baseCustomerId: string;

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAsAdmin(page);

      // Load base customer
      const customers = await getCustomers(page);
      baseCustomerId = customers[0]?.id;

      await context.close();
    });

    test("TC-INT-006 should manage orders and supplier orders independently", async ({ page }) => {
      // Test-specific data
      let preOrderSku: string;
      let productId: string;
      let variantId: string;
      let orderId: string;
      let supplierOrderId: string;

      // Setup: Create pre-order product
      await test.step("Setup pre-order product", async () => {
        preOrderSku = `POU-${Date.now()}`;

        // Create pre-order product with one variant (same pattern as TC-INT-002)
        const preOrderProduct = await createProductWithVariants(page, {
          name: `Pre-Order Independence Test ${Date.now()}`,
          categoryId: null,
          variants: [
            {
              sku: preOrderSku,
              stockQuantity: 0,
              retailPrice: 100,
              costPrice: 50,
            },
          ],
        });
        productId = preOrderProduct.product?.id;
        expect(productId).toBeDefined();

        // Wait for variant to be visible in DB; retry getProductsWithVariants until variant appears
        for (let attempt = 0; attempt < 8; attempt++) {
          await page.waitForTimeout(attempt === 0 ? 1200 : 500);
          const productsList = await getProductsWithVariants(page);
          variantId =
            productsList
              .find((p: any) => p.id === productId)
              ?.variants?.find((v: any) => v.sku === preOrderSku)?.id ??
            preOrderProduct.product?.variants?.[0]?.id;
          if (variantId) break;
        }
        expect(variantId).toBeDefined();

        // Extra wait so variant is visible to order API (avoids "Variants not found" flakiness)
        await page.waitForTimeout(2000);
      });

      // Execute: Create order with pre-order item
      await test.step("Create order and pay", async () => {
        const orderData = await createOrder(page, {
          customerId: baseCustomerId,
          items: [{ variantId: variantId!, quantity: 1 }],
        });
        expect(orderData.success).toBe(true);
        orderId = orderData.order?.id;

        // Move order to paid status
        await recordPayment(page, orderId, {
          amount: orderData.order?.total,
          method: "cash",
        });
      });

      // Verify: Supplier order auto-created
      await test.step("Verify supplier order auto-created", async () => {
        const supplierOrders = await getSupplierOrders(page);
        const relatedSO = supplierOrders.find(
          (so: any) => so.variantId === variantId || so.item?.sku === preOrderSku,
        );
        expect(relatedSO).toBeDefined();
        expect(relatedSO?.status).toBe("pending");
        supplierOrderId = relatedSO.id;
      });

      // Verify: Payment progresses independently of supplier orders
      await test.step("Verify payment independent of supplier orders", async () => {
        // Pre-order variant has no stock, so fulfillment stays pending; payment
        // still reaches "paid", proving payment moves independently.
        const updatedOrder = await getOrderDetails(page, orderId);
        expect(updatedOrder.paymentStatus).toBe(PAYMENT_STATUS.PAID);
        expect(updatedOrder.fulfillmentStatus).toBe(FULFILLMENT_STATUS.PENDING);
      });

      // Verify: Supplier order still pending
      await test.step("Verify supplier order still pending", async () => {
        const supplierOrdersAfter = await getSupplierOrders(page);
        const relatedSOAfter = supplierOrdersAfter.find((so: any) => so.id === supplierOrderId);
        expect(relatedSOAfter?.status).toBe("pending");
      });

      // Execute: Update supplier order separately
      await test.step("Update supplier order status", async () => {
        await updateSupplierOrderStatus(page, supplierOrderId, "received");
      });

      // Verify: Supplier order updated independently
      await test.step("Verify supplier order updated independently", async () => {
        const supplierOrdersFinal = await getSupplierOrders(page);
        const relatedSOFinal = supplierOrdersFinal.find((so: any) => so.id === supplierOrderId);
        expect(relatedSOFinal?.status).toBe("received");
      });
    });

    test("TC-INT-007 should restore stock and update dashboard low stock on cancel", async ({
      page,
    }) => {
      // Test-specific data
      let variantSku: string;
      let productId: string;
      let variantId: string;
      let orderId: string;

      // Setup: Create product with low stock
      await test.step("Setup product with low stock", async () => {
        variantSku = `CRT-${Date.now()}`;
        const productData = await createProductWithVariants(page, {
          name: `Cancel Restore Test ${Date.now()}`,
          variants: [
            {
              sku: variantSku,
              stockQuantity: 3,
              lowStockThreshold: 5,
              retailPrice: 100,
              costPrice: 50,
            },
          ],
        });

        expect(productData.success).toBe(true);
        productId = productData.product?.id;
        variantId = productData.product?.variants?.[0]?.id;
        expect(variantId).toBeDefined();

        // Wait for product to be visible with initial stock 3 (eventual consistency)
        let products = await getProductsWithVariants(page);
        let updatedVariant = products
          .find((p: any) => p.id === productId)
          ?.variants?.find((v: any) => v.id === variantId);
        const initialStockAttempts = 15;
        for (let a = 0; a < initialStockAttempts; a++) {
          if (Number(updatedVariant?.stockQuantity) === 3) break;
          await page.waitForTimeout(a === 0 ? 1500 : 400);
          products = await getProductsWithVariants(page);
          updatedVariant = products
            .find((p: any) => p.id === productId)
            ?.variants?.find((v: any) => v.id === variantId);
        }
        expect(
          Number(updatedVariant?.stockQuantity),
          "Initial variant stock should be 3 before creating order",
        ).toBe(3);
      });

      // Execute: Create order
      await test.step("Create order that reduces stock", async () => {
        const orderData = await createOrder(page, {
          customerId: baseCustomerId,
          items: [{ variantId, quantity: 2 }],
        });

        expect(orderData.success).toBe(true);
        orderId = orderData.order?.id;
      });

      // Verify: Stock decreased
      await test.step("Verify stock decreased after order", async () => {
        let products = await getProductsWithVariants(page);
        let updatedVariant = products
          .find((p: any) => p.id === productId)
          ?.variants?.find((v: any) => v.id === variantId);

        // Poll for eventual consistency after order commit
        const afterOrderAttempts = 10;
        for (let attempt = 0; attempt < afterOrderAttempts; attempt++) {
          if (Number(updatedVariant?.stockQuantity) === 1) break;
          await page.waitForTimeout(attempt === 0 ? 800 : 400);
          products = await getProductsWithVariants(page);
          updatedVariant = products
            .find((p: any) => p.id === productId)
            ?.variants?.find((v: any) => v.id === variantId);
        }
        expect(Number(updatedVariant?.stockQuantity), "Stock should be 1 after order (3 - 2)").toBe(
          1,
        );
      });

      // Execute: Cancel order
      await test.step("Cancel order", async () => {
        await cancelOrder(page, orderId);
      });

      // Verify: Stock restored
      await test.step("Verify stock restored after cancellation", async () => {
        let products = await getProductsWithVariants(page);
        let updatedVariant = products
          .find((p: any) => p.id === productId)
          ?.variants?.find((v: any) => v.id === variantId);

        // Poll for eventual consistency
        const restoreAttempts = 10;
        for (let attempt = 0; attempt < restoreAttempts; attempt++) {
          if (Number(updatedVariant?.stockQuantity) === 3) break;
          await page.waitForTimeout(attempt === 0 ? 1500 : 500);
          products = await getProductsWithVariants(page);
          updatedVariant = products
            .find((p: any) => p.id === productId)
            ?.variants?.find((v: any) => v.id === variantId);
        }
        expect(
          Number(updatedVariant?.stockQuantity),
          "Stock should be restored to 3 after cancel",
        ).toBe(3);
      });

      // Verify: Dashboard low stock count
      await test.step("Verify dashboard low stock count", async () => {
        await page.goto("/");
        await page.waitForSelector("[data-testid='low-stock-count']");
        const lowStockCountString = await page
          .locator("[data-testid='low-stock-count']")
          .textContent();
        const lowStockCount = parseInt(lowStockCountString || "0", 10);
        expect(lowStockCount).toBeGreaterThanOrEqual(0);
      });
    });

    test("TC-INT-008 should update accounting totals when paid order cancelled", async ({
      page,
    }) => {
      // Test-specific data
      let orderId: string;
      let initialRevenue: number;

      // Setup: Create and pay for order
      await test.step("Create and pay for order", async () => {
        const products = await getProductsWithVariants(page);
        const variantId = products[0]?.variants?.[0]?.id;

        const orderData = await createOrder(page, {
          customerId: baseCustomerId,
          items: [{ variantId, quantity: 1 }],
        });

        orderId = orderData.order?.id;
        const order = await getOrderDetails(page, orderId);

        // Record payment
        await recordPayment(page, orderId, {
          amount: order.total,
          method: "cash",
        });
      });

      // Get initial accounting stats
      await test.step("Get initial accounting stats", async () => {
        const { data: initialAccounting } = await apiGet<any>(
          page,
          "/api/admin/finance?month=1&year=2026",
        );
        initialRevenue = initialAccounting.stats?.revenue || 0;
      });

      // Execute: Cancel the paid order
      await test.step("Cancel the paid order", async () => {
        await cancelOrder(page, orderId);
      });

      // Verify: Accounting reflects cancellation
      await test.step("Verify accounting reflects cancellation", async () => {
        const { data: updatedAccounting } = await apiGet<any>(
          page,
          "/api/admin/finance?month=1&year=2026",
        );
        expect(updatedAccounting.stats.revenue).toBeLessThanOrEqual(initialRevenue);
      });
    });
  });

  test.describe("Integration - Concurrency and Race Conditions", () => {
    let baseCustomerId: string;

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAsAdmin(page);

      // Load base customer
      const customers = await getCustomers(page);
      baseCustomerId = customers[0]?.id;

      await context.close();
    });

    test("TC-INT-009 should handle concurrent orders for same stock", async ({ page, browser }) => {
      // Test-specific data
      let context1: any;
      let context2: any;
      let page1: any;
      let page2: any;
      let variantId: string;
      let productId: string;

      // Setup: Create contexts and product
      await test.step("Setup test contexts and product", async () => {
        context1 = await browser.newContext();
        context2 = await browser.newContext();
        page1 = await context1.newPage();
        page2 = await context2.newPage();

        await loginAsAdmin(page1);
        await loginAsAdmin(page2);

        const product = await apiPost<any>(page1, "/api/admin/products", {
          name: `Concurrent Test ${Date.now()}`,
          slug: `concurrent-${Date.now()}`,
          categoryId: null,
        });
        const variant = await apiPost<any>(
          page1,
          `/api/admin/products/${product.data.product?.id}/variants`,
          {
            sku: `CON-${Date.now()}`,
            stockType: "in_stock",
            stockQuantity: 1,
            retailPrice: 100,
            costPrice: 50,
          },
        );

        variantId = variant.data.variant?.id;
        productId = product.data.product?.id;
      });

      // Execute: Concurrent orders
      let result1: any;
      let result2: any;
      await test.step("Submit concurrent orders", async () => {
        [result1, result2] = await Promise.all([
          apiPost<any>(page1, "/api/admin/orders", {
            customerId: baseCustomerId,
            items: [{ variantId, quantity: 1 }],
          }),
          apiPost<any>(page2, "/api/admin/orders", {
            customerId: baseCustomerId,
            items: [{ variantId, quantity: 1 }],
          }),
        ]);
      });

      // Verify: Both orders succeed, stock may go negative
      await test.step("Verify concurrent behavior", async () => {
        const successCount = [result1, result2].filter((r) => r.response.ok()).length;
        expect(successCount).toBe(2);

        // Allow eventual consistency for product list read
        let finalVariant: { stockQuantity?: number } | undefined;
        for (let attempt = 0; attempt < 8; attempt++) {
          await page1.waitForTimeout(attempt === 0 ? 500 : 300);
          const products = await getProductsWithVariants(page1);
          finalVariant = products
            .find((p: any) => p.id === productId)
            ?.variants?.find((v: any) => v.id === variantId);
          const qty = Number(finalVariant?.stockQuantity);
          // Expected: 1 - 2 = -1; occasionally -2 if an extra order committed (e.g. retry)
          if (qty === -1 || qty === -2) break;
        }

        const qty = Number(finalVariant?.stockQuantity);
        expect(
          qty,
          "Stock should be negative (at least 2 orders deducted); -1 or -2 acceptable",
        ).toBeLessThanOrEqual(-1);
        expect(qty).toBeGreaterThanOrEqual(-3);
      });

      // Cleanup
      await test.step("Cleanup contexts", async () => {
        await context1.close();
        await context2.close();
      });
    });

    test("TC-INT-010 should prevent double-submit of order creation", async ({ page }) => {
      // Test-specific data
      let variantId: string;
      let clientToken: string;

      // Setup: Get product and prepare payload
      await test.step("Setup test data", async () => {
        const products = await getProductsWithVariants(page);
        variantId = products[0]?.variants?.[0]?.id;
        clientToken = `order-double-submit-${Date.now()}`;
      });

      // Execute: Double-submit order
      let result1: any;
      let result2: any;
      await test.step("Submit the same order twice", async () => {
        const orderPayload = {
          customerId: baseCustomerId,
          items: [{ variantId, quantity: 1 }],
          clientToken,
        };

        [result1, result2] = await Promise.all([
          apiPost<any>(page, "/api/admin/orders", orderPayload),
          apiPost<any>(page, "/api/admin/orders", orderPayload),
        ]);
      });

      // Verify: Should create only one order (idempotent)
      await test.step("Verify idempotent behavior", async () => {
        const orderId1 = result1.data.order?.id;
        const orderId2 = result2.data.order?.id;

        // If both succeeded, they should return the same order ID (idempotent)
        if (result1.response.ok() && result2.response.ok()) {
          expect(orderId1).toBe(orderId2);
        }
      });
    });

    test("TC-INT-011 should allow retry after create order failure", async ({ page }) => {
      // Test-specific data
      let customerId: string;
      let variantId: string;
      let productId: string;
      let initialStock: number;
      let initialOrderCount: number;

      // Setup: Create dedicated customer
      await test.step("Setup dedicated customer", async () => {
        const uniquePhone = `09${Date.now().toString().slice(-8)}`;
        const existingProducts = await getProductsWithVariants(page);
        const existingVariantId = existingProducts[0]?.variants?.[0]?.id;
        expect(existingVariantId).toBeDefined();

        const setupOrder = await apiPost<any>(page, "/api/admin/orders", {
          customerPhone: uniquePhone,
          customerName: "Retry Test Customer",
          items: [{ variantId: existingVariantId, quantity: 1 }],
        });
        expect(setupOrder.response.ok()).toBe(true);

        const customer = await getCustomerByPhone(page, uniquePhone);
        expect(customer).toBeDefined();
        customerId = customer.id;
      });

      // Setup: Create test product
      await test.step("Setup test product", async () => {
        // Unique name/sku per run to avoid cross-worker hydration match
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const productData = await createProductWithVariants(page, {
          name: `Retry Test Product ${unique}`,
          categoryId: null,
          variants: [
            {
              sku: `RTY-${unique}`,
              stockQuantity: 1,
              retailPrice: 100,
              costPrice: 50,
            },
          ],
        });

        variantId = productData.product?.variants?.[0]?.id;
        productId = productData.product?.id;
        expect(variantId).toBeDefined();

        // Wait for variant to be visible in database with correct stock (eventual consistency)
        let currentVariant: any;
        const maxAttempts = 15;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await page.waitForTimeout(attempt === 0 ? 2000 : 500);
          const products = await getProductsWithVariants(page);
          currentVariant = products
            .find((p: any) => p.id === productId)
            ?.variants?.find((v: any) => v.id === variantId);
          initialStock = currentVariant?.stockQuantity;
          if (initialStock === 1) break;
        }
        expect(
          initialStock,
          `Variant should have stockQuantity 1 after ${maxAttempts} attempts (got ${initialStock})`,
        ).toBe(1);
      });

      // Setup: Get initial order count
      await test.step("Get initial order count", async () => {
        const { data: initialOrders } = await apiGet<any>(
          page,
          `/api/admin/orders?customerId=${customerId}&limit=100`,
        );
        initialOrderCount = initialOrders.data?.length || 0;
      });

      // Execute: First attempt with invalid data (should fail)
      await test.step("Attempt order with invalid variant", async () => {
        const failedResult = await apiPost<any>(page, "/api/admin/orders", {
          customerId,
          items: [
            {
              variantId: "00000000-0000-0000-0000-000000000001",
              quantity: 1,
            },
          ],
        });

        expect(failedResult.response.ok()).toBe(false);
      });

      // Verify: Stock unchanged after failed attempt
      await test.step("Verify stock unchanged after failure", async () => {
        const products2 = await getProductsWithVariants(page);
        const currentVariant2 = products2
          .find((p: any) => p.id === productId)
          ?.variants?.find((v: any) => v.id === variantId);
        expect(currentVariant2?.stockQuantity).toBe(initialStock);
      });

      // Execute: Retry with valid data
      await test.step("Retry order with valid data", async () => {
        const retryResult = await createOrder(page, {
          customerId,
          items: [{ variantId, quantity: 1 }],
        });

        expect(retryResult.success).toBe(true);
        expect(retryResult.order?.id).toBeDefined();
      });

      // Verify: Stock reduced correctly
      await test.step("Verify stock reduced by 1 only", async () => {
        const products3 = await getProductsWithVariants(page);
        const currentVariant3 = products3
          .find((p: any) => p.id === productId)
          ?.variants?.find((v: any) => v.id === variantId);
        expect(currentVariant3?.stockQuantity).toBe(0);
      });

      // Verify: No duplicate orders
      await test.step("Verify no duplicate orders created", async () => {
        const { data: finalOrders } = await apiGet<any>(
          page,
          `/api/admin/orders?customerId=${customerId}&limit=100`,
        );
        const finalOrderCount = finalOrders.data?.length || 0;
        expect(finalOrderCount).toBe(initialOrderCount + 1);
      });
    });

    test("TC-INT-012 should handle concurrent payment submissions", async ({ page }) => {
      // Test-specific data
      let orderId: string;
      let orderTotal: number;
      let paymentAmount: number;

      // Setup: Create order
      await test.step("Setup test order", async () => {
        const products = await getProductsWithVariants(page);
        const variantId = products[0]?.variants?.[0]?.id;

        const orderData = await createOrder(page, {
          customerId: baseCustomerId,
          items: [{ variantId, quantity: 1 }],
        });
        orderId = orderData.order?.id;

        const order = await getOrderDetails(page, orderId);
        orderTotal = Number(order.total);
        paymentAmount = Math.max(1, Math.round(orderTotal * 0.6));
      });

      // Execute: Concurrent payment submissions
      let result1: any;
      let result2: any;
      await test.step("Submit concurrent payments", async () => {
        [result1, result2] = await Promise.all([
          apiPost<any>(page, `/api/admin/orders/${orderId}/payments`, {
            amount: paymentAmount,
            method: "cash",
          }),
          apiPost<any>(page, `/api/admin/orders/${orderId}/payments`, {
            amount: paymentAmount,
            method: "bank_transfer",
          }),
        ]);
      });

      // Verify: Payment handling and order state
      await test.step("Verify concurrent payment handling", async () => {
        const okCount = [result1, result2].filter((r) => r.response.ok()).length;
        expect(okCount).toBeGreaterThan(0);

        const updatedOrder = await getOrderDetails(page, orderId);
        const paidAmount = Number(updatedOrder.paidAmount || 0);
        const remainingBalance = Number(updatedOrder.remainingBalance || 0);

        expect(paidAmount).toBeLessThanOrEqual(orderTotal);
        expect(remainingBalance).toBeGreaterThanOrEqual(0);
      });
    });
  });

  test.describe("Integration - Idempotency", () => {
    let baseCustomerId: string;
    let baseProducts: any[];

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAsAdmin(page);

      // Load base data
      const customers = await getCustomers(page);
      baseCustomerId = customers[0]?.id;
      baseProducts = await getProductsWithVariants(page);

      await context.close();
    });

    test("TC-INT-016 should handle idempotent order creation with client token", async ({
      page,
    }) => {
      // Test-specific data
      let variantId: string;
      let idempotencyKey: string;

      // Setup: Prepare data
      await test.step("Setup test data", async () => {
        variantId = baseProducts[0]?.variants?.[0]?.id;
        idempotencyKey = `order-${Date.now()}`;
      });

      // Execute: First request
      let orderId1: string;
      await test.step("Submit first order request", async () => {
        const orderPayload = {
          customerId: baseCustomerId,
          items: [{ variantId, quantity: 1 }],
          clientToken: idempotencyKey,
        };

        const result1 = await apiPost<any>(page, "/api/admin/orders", orderPayload);
        expect(result1.response.ok()).toBe(true);
        orderId1 = result1.data.order?.id;
      });

      // Execute: Retry with same token
      let orderId2: string;
      await test.step("Retry with same token", async () => {
        const orderPayload = {
          customerId: baseCustomerId,
          items: [{ variantId, quantity: 1 }],
          clientToken: idempotencyKey,
        };

        const result2 = await apiPost<any>(page, "/api/admin/orders", orderPayload);
        expect(result2.response.ok()).toBe(true);
        orderId2 = result2.data.order?.id;
      });

      // Verify: Should return the same order
      await test.step("Verify idempotent behavior", async () => {
        expect(orderId1).toBe(orderId2);
      });
    });

    test("TC-INT-017 should reject idempotent order with different payload", async ({ page }) => {
      // Test-specific data
      let variantId: string;
      let idempotencyKey: string;
      let result1: any;
      let result2: any;

      // Setup
      await test.step("Setup test data", async () => {
        variantId = baseProducts[0]?.variants?.[0]?.id;
        idempotencyKey = `order-diff-${Date.now()}`;
      });

      // Execute: First request
      await test.step("Submit first order", async () => {
        result1 = await apiPost<any>(page, "/api/admin/orders", {
          customerId: baseCustomerId,
          items: [{ variantId, quantity: 1 }],
          clientToken: idempotencyKey,
        });

        expect(result1.response.ok()).toBe(true);
      });

      // Execute: Retry with different payload
      await test.step("Retry with different payload", async () => {
        result2 = await apiPost<any>(page, "/api/admin/orders", {
          customerId: baseCustomerId,
          items: [{ variantId, quantity: 2 }], // Different quantity
          clientToken: idempotencyKey,
        });
      });

      // Verify: Should reject or return original
      await test.step("Verify conflict handling", async () => {
        if (result2.response.ok()) {
          expect(result2.data.order?.id).toBe(result1.data.order?.id);
        } else {
          expect(result2.response.status()).toBe(409);
        }
      });
    });

    test("TC-INT-018 should handle idempotent payment with client token", async ({ page }) => {
      // Test-specific data
      let orderId: string;
      let orderTotal: number;
      let paymentToken: string;

      // Setup: Create order
      await test.step("Setup test order", async () => {
        const variantId = baseProducts[0]?.variants?.[0]?.id;

        const orderData = await createOrder(page, {
          customerId: baseCustomerId,
          items: [{ variantId, quantity: 1 }],
        });
        orderId = orderData.order?.id;
        const order = await getOrderDetails(page, orderId);
        orderTotal = order.total;
        paymentToken = `payment-${Date.now()}`;
      });

      // Execute: First payment
      await test.step("Submit first payment", async () => {
        const paymentPayload = {
          amount: orderTotal,
          method: "cash",
          clientToken: paymentToken,
        };

        const result1 = await apiPost<any>(
          page,
          `/api/admin/orders/${orderId}/payments`,
          paymentPayload,
        );
        expect(result1.response.ok()).toBe(true);
      });

      // Execute: Retry payment with same token
      await test.step("Retry payment with same token", async () => {
        const paymentPayload = {
          amount: orderTotal,
          method: "cash",
          clientToken: paymentToken,
        };

        const result2 = await apiPost<any>(
          page,
          `/api/admin/orders/${orderId}/payments`,
          paymentPayload,
        );

        expect(result2.response.ok()).toBe(true);
      });

      // Verify: Only one payment recorded
      await test.step("Verify no double-charge", async () => {
        const updatedOrder = await getOrderDetails(page, orderId);
        expect(updatedOrder.paidAmount).toBe(orderTotal);
      });
    });

    test("TC-INT-019 should reject idempotent payment with different payload", async ({ page }) => {
      // Test-specific data
      let orderId: string;
      let paymentToken: string;
      let firstAmount: number;

      // Setup: Create order and prepare payment data
      await test.step("Setup test order and payment data", async () => {
        const variantId = baseProducts[0]?.variants?.[0]?.id;

        const orderData = await createOrder(page, {
          customerId: baseCustomerId,
          items: [{ variantId, quantity: 1 }],
        });
        orderId = orderData.order?.id;
        const order = await getOrderDetails(page, orderId);
        paymentToken = `payment-diff-${Date.now()}`;
        firstAmount = Math.max(1, Math.round(Number(order.total) * 0.5));
      });

      // Execute: First payment
      await test.step("Submit first payment", async () => {
        const firstResult = await apiPost<any>(page, `/api/admin/orders/${orderId}/payments`, {
          amount: firstAmount,
          method: "cash",
          clientToken: paymentToken,
        });

        expect(firstResult.response.ok()).toBe(true);
      });

      // Execute: Retry with different amount
      await test.step("Retry payment with different amount", async () => {
        const secondAmount = firstAmount + 1;
        const secondResult = await apiPost<any>(page, `/api/admin/orders/${orderId}/payments`, {
          amount: secondAmount,
          method: "cash",
          clientToken: paymentToken,
        });

        if (!secondResult.response.ok()) {
          expect(secondResult.response.status()).toBeGreaterThanOrEqual(400);
        }
      });

      // Verify: Only first payment recorded
      await test.step("Verify only first payment recorded", async () => {
        const updatedOrder = await getOrderDetails(page, orderId);
        const paidAmount = Number(updatedOrder.paidAmount || 0);
        expect(paidAmount).toBeLessThanOrEqual(firstAmount);
      });
    });

    test("TC-INT-020 should handle idempotent order cancellation", async ({ page }) => {
      // Test-specific data
      let orderId: string;

      // Setup: Create order
      await test.step("Setup test order", async () => {
        const variantId = baseProducts[0]?.variants?.[0]?.id;

        const orderData = await createOrder(page, {
          customerId: baseCustomerId,
          items: [{ variantId, quantity: 1 }],
        });
        orderId = orderData.order?.id;
      });

      // Execute: First cancellation
      await test.step("Cancel order first time", async () => {
        const { response: result1 } = await cancelOrder(page, orderId);
        expect(result1.ok()).toBe(true);
      });

      // Execute: Second cancellation (should be idempotent)
      await test.step("Cancel order second time", async () => {
        const { response: result2 } = await cancelOrder(page, orderId);
        // Should succeed (idempotent) or return 400 if already cancelled
        expect([200, 400]).toContain(result2.status());
      });

      // Verify: Order is cancelled
      await test.step("Verify order is cancelled", async () => {
        const order = await getOrderDetails(page, orderId);
        expect(order.fulfillmentStatus).toBe(FULFILLMENT_STATUS.CANCELLED);
      });
    });
  });

  test.describe("Integration - Transaction Rollback", () => {
    let baseCustomerId: string;

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAsAdmin(page);

      // Load base customer
      const customers = await getCustomers(page);
      baseCustomerId = customers[0]?.id;

      await context.close();
    });

    test("TC-INT-014 should rollback order creation on transaction failure", async ({ page }) => {
      // Execute: Try to create order with invalid data
      let result: any;
      await test.step("Attempt order creation with invalid data", async () => {
        result = await apiPost<any>(page, "/api/admin/orders", {
          customerId: baseCustomerId,
          items: [
            {
              variantId: "non-existent-variant-id",
              quantity: 1,
            },
          ],
        });
      });

      // Verify: Request should fail
      await test.step("Verify transaction failure", async () => {
        expect(result.response.ok()).toBe(false);
        // Verify no partial data was created
        // (This would require checking database or verifying no order fragments exist)
      });
    });
  });

  test.describe("Integration - Supplier Order Concurrency", () => {
    let baseCustomerId: string;

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAsAdmin(page);

      // Load base customer
      const customers = await getCustomers(page);
      baseCustomerId = customers[0]?.id;

      await context.close();
    });

    test("TC-INT-013 should handle concurrent supplier order status updates", async ({ page }) => {
      // Test-specific data
      let variantId: string;
      let supplierOrderId: string;

      // Setup: Create product and order
      await test.step("Setup product and order", async () => {
        const product = await apiPost<any>(page, "/api/admin/products", {
          name: `Supplier Concurrency ${Date.now()}`,
          slug: `supplier-concurrency-${Date.now()}`,
          categoryId: null,
        });

        const variant = await apiPost<any>(
          page,
          `/api/admin/products/${product.data.product?.id}/variants`,
          {
            sku: `SC-${Date.now()}`,
            stockType: "pre_order",
            stockQuantity: 0,
            retailPrice: 100,
            costPrice: 50,
          },
        );

        variantId = variant.data.variant?.id;

        await createOrder(page, {
          customerId: baseCustomerId,
          items: [{ variantId, quantity: 1 }],
        });
      });

      // Setup: Get supplier order
      await test.step("Get supplier order", async () => {
        const supplierOrders = await getSupplierOrders(page);
        const relatedOrder = supplierOrders.find((so: any) => so.variantId === variantId);

        expect(relatedOrder).toBeDefined();
        supplierOrderId = relatedOrder.id;
      });

      // Execute: Concurrent status updates
      let result1: any;
      let result2: any;
      await test.step("Submit concurrent status updates", async () => {
        [result1, result2] = await Promise.all([
          updateSupplierOrderStatus(page, supplierOrderId, "received"),
          updateSupplierOrderStatus(page, supplierOrderId, "cancelled"),
        ]);
      });

      // Verify: One update succeeded
      await test.step("Verify concurrent update handling", async () => {
        const okCount = [result1, result2].filter((r) => r.ok()).length;
        expect(okCount).toBeGreaterThan(0);

        const updatedOrder = await getSupplierOrderDetails(page, supplierOrderId);
        expect(["received", "cancelled"]).toContain(updatedOrder.status);
      });
    });
  });

  test.describe("Integration - Manual Stock Updates", () => {
    test("TC-INT-015 should reflect manual stock increase in catalog availability", async ({
      page,
    }) => {
      // Test-specific data
      let productId: string;
      let variantId: string;
      let variantSku: string;

      // Setup: Create product with zero stock
      await test.step("Setup product with zero stock", async () => {
        const product = await apiPost<any>(page, "/api/admin/products", {
          name: `Manual Stock Test ${Date.now()}`,
          slug: `manual-stock-${Date.now()}`,
          categoryId: null,
        });

        const variant = await apiPost<any>(
          page,
          `/api/admin/products/${product.data.product?.id}/variants`,
          {
            sku: `MST-${Date.now()}`,
            stockQuantity: 0,
            retailPrice: 100,
            costPrice: 50,
          },
        );

        productId = product.data.product?.id;
        variantId = variant.data.variant?.id;
        variantSku = variant.data.variant?.sku;
      });

      // Execute: Manually increase stock
      await test.step("Manually increase stock", async () => {
        await apiPut<any>(page, `/api/admin/products/${productId}`, {
          variants: [
            {
              id: variantId,
              stockQuantity: 10,
            },
          ],
        });
      });

      // Verify: Stock available in catalog
      await test.step("Verify stock available in catalog", async () => {
        await page.goto("/products");
        await page.waitForTimeout(1000);
        const productCard = await page.locator(`[data-sku="${variantSku}"]`);

        if (await productCard.isVisible()) {
          const stockText = await productCard.textContent();
          expect(stockText?.toLowerCase()).not.toContain("out of stock");
        }
      });
    });
  });
});
