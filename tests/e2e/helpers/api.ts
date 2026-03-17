import type { Page } from "@playwright/test";
import { STOREFRONT_BASE_URL } from "../../../lib/constants";

export async function apiGet<T>(page: Page, url: string) {
  const response = await page.request.get(url);

  // Check content type before parsing
  const contentType = response.headers()["content-type"] || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(
      `Expected JSON but got ${contentType}. URL: ${url}, Status: ${response.status()}, Body preview: ${text.substring(
        0,
        300,
      )}`,
    );
  }

  return {
    response,
    data: (await response.json()) as T,
  };
}

export async function apiPost<T>(page: Page, url: string, body: Record<string, any>) {
  const response = await page.request.post(url, { data: body });

  // Check content type before parsing
  const contentType = response.headers()["content-type"] || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(
      `Expected JSON but got ${contentType}. URL: ${url}, Status: ${response.status()}, Body preview: ${text.substring(
        0,
        300,
      )}`,
    );
  }

  const data = (await response.json()) as T;

  // Add delay after product creation to ensure transaction is committed and visible to other connections
  if (url === "/api/admin/products" && response.ok()) {
    await page.waitForTimeout(1000);
  }

  // Add delay after variant creation so variant is visible to order API (avoids "valid variantId" / "Variants not found")
  if (url.includes("/api/admin/products/") && url.endsWith("/variants") && response.ok()) {
    await page.waitForTimeout(800);
  }

  if (url === "/api/admin/products" && response.ok()) {
    const product = (data as any)?.product;
    const sentVariants = Array.isArray(body.variants) && body.variants.length > 0;
    // Only hydrate when we sent variants but response has none (e.g. eventual consistency)
    const needsHydration =
      sentVariants && (!product || !product.variants || product.variants.length === 0);
    if (needsHydration) {
      const variantSkus = Array.isArray(body.variants)
        ? body.variants.map((v: any) => v.sku).filter(Boolean)
        : [];
      const maxRetries = 8;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // Exponential backoff: 600ms, 900ms, 1350ms, 2025ms, 3038ms, 4557ms, 6836ms, 10253ms
        const delay = Math.floor(600 * 1.5 ** (attempt - 1));
        await page.waitForTimeout(delay);
        const products = await getProductsWithVariants(page);
        const match = products.find(
          (item: any) =>
            item.id === product?.id ||
            item.name === body.name ||
            (variantSkus.length > 0 &&
              item.variants?.some((v: any) => variantSkus.includes(v.sku))),
        );
        if (match?.variants && match.variants.length > 0) {
          (data as any).product = match;
          break;
        }
      }
    }
  }

  return {
    response,
    data,
  };
}

export async function apiPut<T>(page: Page, url: string, body: Record<string, any>) {
  const response = await page.request.put(url, { data: body });

  // Check content type before parsing
  const contentType = response.headers()["content-type"] || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(
      `Expected JSON but got ${contentType}. URL: ${url}, Status: ${response.status()}, Body preview: ${text.substring(
        0,
        300,
      )}`,
    );
  }

  return {
    response,
    data: (await response.json()) as T,
  };
}

export async function apiPatch<T>(page: Page, url: string, body: Record<string, any> = {}) {
  const response = await page.request.patch(url, { data: body });

  // Check content type before parsing
  const contentType = response.headers()["content-type"] || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(
      `Expected JSON but got ${contentType}. URL: ${url}, Status: ${response.status()}, Body preview: ${text.substring(
        0,
        300,
      )}`,
    );
  }

  return {
    response,
    data: (await response.json()) as T,
  };
}

export async function apiDelete<T>(page: Page, url: string) {
  const response = await page.request.delete(url);

  // Check content type before parsing
  const contentType = response.headers()["content-type"] || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(
      `Expected JSON but got ${contentType}. URL: ${url}, Status: ${response.status()}, Body preview: ${text.substring(
        0,
        300,
      )}`,
    );
  }

  return {
    response,
    data: (await response.json()) as T,
  };
}

export async function getCustomerByPhone(page: Page, phone: string) {
  const { data } = await apiGet<{
    data: Array<{ id: string; phone: string; customerCode: string }>;
  }>(page, `/api/admin/customers?search=${encodeURIComponent(phone)}`);
  return data.data[0];
}

export async function getProductsWithVariants(page: Page) {
  const { data } = await apiGet<{ products: any[] }>(page, "/api/admin/products?include=variants");
  return data.products || [];
}

/** Poll GET /api/admin/products/:id until product exists (avoids FK/500 when creating variants) */
export async function waitForProductVisible(
  page: Page,
  productId: string,
  maxAttempts = 15,
  delayMs = 400,
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { response } = await apiGet<{ product?: unknown }>(
      page,
      `/api/admin/products/${productId}`,
    );
    if (response.ok()) return;
    await page.waitForTimeout(delayMs);
  }
  throw new Error(`Product ${productId} not visible after ${maxAttempts} attempts`);
}

/**
 * Create a product with variants in a single API call
 * The API expects variants array in the POST body
 */
export async function createProductWithVariants(
  page: Page,
  params: {
    name: string;
    slug?: string;
    description?: string;
    categoryId?: string | null;
    basePrice?: number;
    isActive?: boolean;
    variants: Array<{
      sku: string;
      attributes?: Record<string, any>;
      stockQuantity?: number;
      lowStockThreshold?: number;
      price?: number;
      retailPrice?: number;
      costPrice?: number;
    }>;
  },
) {
  const slug = params.slug || `${params.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

  const { data } = await apiPost<{ success: boolean; product: any }>(page, "/api/admin/products", {
    name: params.name,
    slug,
    description: params.description || "",
    categoryId: params.categoryId || null,
    basePrice: params.basePrice || 0,
    isActive: params.isActive !== false,
    variants: params.variants.map((v, index) => ({
      name: v.attributes ? JSON.stringify(v.attributes) : `Variant ${index + 1}`,
      sku: v.sku,
      attributes: v.attributes || {},
      stockQuantity: v.stockQuantity || 0,
      lowStockThreshold: v.lowStockThreshold,
      price: v.price || v.retailPrice || 0,
      costPrice: v.costPrice || 0,
    })),
  });
  return data;
}

export async function findVariantIdBySku(page: Page, sku: string) {
  const products = await getProductsWithVariants(page);
  for (const product of products) {
    for (const variant of product.variants || []) {
      if (variant.sku === sku) return variant.id as string;
    }
  }
  return null;
}

export async function createOrder(
  page: Page,
  params: {
    customerId: string;
    items: Array<{ variantId: string; quantity: number }>;
    note?: string;
  },
) {
  const maxRetries = 6;
  const retryDelayBase = 500;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { data, response } = await apiPost<{ success: boolean; order: any }>(
      page,
      "/api/admin/orders",
      params,
    );

    if (response.ok() && data.success) {
      // Verify order exists by trying to fetch it
      try {
        await page.waitForTimeout(200);
        const verification = await page.request.get(`/api/admin/orders/${data.order.id}`);
        if (!verification.ok()) {
          const _verifyText = await verification.text();
          // If verification fails, retry creating the order
          if (attempt < maxRetries) {
            await page.waitForTimeout(retryDelayBase * attempt);
            continue;
          }
        } else {
        }
      } catch (_verifyError) {}

      return data;
    }

    const errorText = JSON.stringify(data);

    // Retry on duplicate order number, Variants not found, or 500 errors (with longer delay for Variants not found)
    const isRetryable =
      errorText.includes("duplicate key") ||
      errorText.includes("Order not found") ||
      errorText.includes("Variants not found") ||
      errorText.includes("unique constraint") ||
      response.status() === 500;
    if (isRetryable && attempt < maxRetries) {
      const backoffDelay = errorText.includes("Variants not found")
        ? retryDelayBase * attempt
        : retryDelayBase * 0.4 * 1.5 ** (attempt - 1);
      await page.waitForTimeout(backoffDelay);
      continue;
    }

    // If it's a client error (4xx), don't retry
    if (
      response.status() >= 400 &&
      response.status() < 500 &&
      !errorText.includes("Order not found")
    ) {
      return data;
    }

    return data;
  }

  return { success: false, order: null };
}

export async function updateOrderStatus(page: Page, orderId: string, status: string) {
  const { response } = await apiPatch<{ success: boolean }>(
    page,
    `/api/admin/orders/${orderId}/status`,
    { status },
  );
  return response;
}

export async function updateOrder(page: Page, orderId: string, payload: Record<string, any>) {
  const { response, data } = await apiPut<any>(page, `/api/admin/orders/${orderId}`, payload);
  return { response, data };
}

export async function deleteOrder(page: Page, orderId: string) {
  const { response } = await apiDelete<{ success?: boolean }>(page, `/api/admin/orders/${orderId}`);
  return response;
}

export async function recordPayment(
  page: Page,
  orderId: string,
  params: { amount: number; method: string; referenceCode?: string },
) {
  const maxRetries = 3;
  const retryDelay = 500; // ms

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { data, response } = await apiPost<{ success: boolean }>(
      page,
      `/api/admin/orders/${orderId}/payments`,
      params,
    );

    if (response.ok()) {
      // Add a small delay to ensure transaction is committed
      await page.waitForTimeout(200);
      return data;
    }

    const errorText = await response.text();

    // If it's "Order not found" and we have retries left, wait and retry
    if (errorText.includes("Order not found") && attempt < maxRetries) {
      await page.waitForTimeout(retryDelay * attempt); // Exponential backoff
      continue;
    }

    // Otherwise throw the error
    throw new Error(`Payment API failed: ${response.status()} - ${errorText}`);
  }

  throw new Error(`Payment API failed after ${maxRetries} retries`);
}

export async function getOrderDetails(
  page: Page,
  orderId: string,
  options?: { expectedPaidAmount?: number },
) {
  const maxRetries = 5;
  const retryDelay = 300;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, response } = await apiGet<{ order: any }>(page, `/api/admin/orders/${orderId}`);

      if (response.ok() && data.order) {
        // If we're checking for a specific paidAmount, verify it matches
        if (options?.expectedPaidAmount !== undefined) {
          const actualPaid = Number(data.order.paidAmount || 0);
          if (actualPaid < options.expectedPaidAmount && attempt < maxRetries) {
            await page.waitForTimeout(retryDelay);
            continue;
          }
        }
        return data.order;
      }

      const errorText = await response.text();

      // Retry on "Order not found" errors or server errors
      if (attempt < maxRetries) {
        await page.waitForTimeout(retryDelay);
        continue;
      }

      // If it's a different error, throw immediately
      throw new Error(`Failed to get order details: ${response.status()} - ${errorText}`);
    } catch (error: any) {
      if (attempt < maxRetries) {
        await page.waitForTimeout(retryDelay);
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Failed to get order details after ${maxRetries} retries for order ${orderId}`);
}

export async function getOrders(
  page: Page,
  params?: { search?: string; status?: string; page?: number; limit?: number },
) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  const { data } = await apiGet<any>(page, `/api/admin/orders${qs ? `?${qs}` : ""}`);
  return data;
}

export async function getSupplierOrders(page: Page, params?: { search?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  const { data } = await apiGet<any[]>(page, `/api/admin/supplier-orders${qs ? `?${qs}` : ""}`);
  return data;
}

export async function getSupplierOrderDetails(page: Page, id: string) {
  const { data } = await apiGet<{ supplierOrder: any }>(page, `/api/admin/supplier-orders/${id}`);
  return data.supplierOrder;
}

export async function updateSupplierOrderStatus(
  page: Page,
  id: string,
  status: string,
  params?: { note?: string; actualCostPrice?: string; expectedDate?: string },
) {
  const response = await page.request.patch(`/api/admin/supplier-orders/${id}`, {
    data: {
      status,
      ...params,
    },
  });
  return response;
}

export async function deleteSupplierOrder(page: Page, id: string) {
  const { response } = await apiDelete<{ success?: boolean }>(
    page,
    `/api/admin/supplier-orders/${id}`,
  );
  return response;
}

export async function createSupplierOrder(
  page: Page,
  params: {
    variantId: string;
    quantity: number;
    expectedDate?: string;
    note?: string;
  },
) {
  const { data } = await apiPost<{ success: boolean; supplierOrder: any }>(
    page,
    "/api/admin/supplier-orders",
    params,
  );
  return data;
}

export async function getCustomers(page: Page, search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const { data } = await apiGet<{ data: any[] }>(page, `/api/admin/customers${query}`);
  return data.data || [];
}

export async function getCustomerDetails(page: Page, customerId: string) {
  const { data } = await apiGet<{ customer: any }>(page, `/api/admin/customers/${customerId}`);
  return data.customer;
}

export async function createExpense(
  page: Page,
  params: { description: string; amount: number; type: string; date: string },
) {
  const { data } = await apiPost<any>(page, "/api/admin/expenses", params);
  return data;
}

export async function deleteExpense(page: Page, expenseId: string) {
  const { response } = await apiDelete<any>(page, `/api/admin/expenses/${expenseId}`);
  return response;
}

export async function listExpenses(page: Page, limit = 1000) {
  const { data } = await apiGet<{ data: any[] }>(page, `/api/admin/expenses?limit=${limit}`);
  return data.data || [];
}

export async function getFinanceSummary(page: Page, params: { month: number; year: number }) {
  const { data } = await apiGet<{ stats: any }>(
    page,
    `/api/admin/finance?month=${params.month}&year=${params.year}`,
  );
  return data.stats;
}

/** Storefront base URL (no admin subdomain). Use for guest/chat widget tests. */
export { STOREFRONT_BASE_URL };

export async function getChatRooms(page: Page) {
  const { data } = await apiGet<{ rooms: any[] }>(page, "/api/admin/chat");
  return data.rooms ?? [];
}

export async function uploadChatAttachment(
  page: Page,
  params: {
    roomId: string;
    file: { name: string; mimeType: string; buffer: Buffer };
  },
) {
  const response = await page.request.post("/api/chat", {
    multipart: {
      roomId: params.roomId,
      file: {
        name: params.file.name,
        mimeType: params.file.mimeType,
        buffer: params.file.buffer,
      },
    },
  });
  return response;
}

export async function loginAdmin(page: Page, credentials: { username: string; password: string }) {
  const { response, data } = await apiPost<any>(page, "/api/admin/login", credentials);
  return { response, data };
}

export async function getAdminProfile(page: Page) {
  const { data } = await apiGet<any>(page, "/api/admin/profile");
  return data;
}

export async function getAdminUsers(page: Page) {
  const { data } = await apiGet<any>(page, "/api/admin/users");
  return data;
}

export async function getAdminFinance(page: Page) {
  const { data } = await apiGet<any>(page, "/api/admin/finance");
  return data;
}

export async function getProfitReport(page: Page, params: { month: number; year: number }) {
  const { data } = await apiGet<{ stats: any }>(
    page,
    `/api/admin/stats/profit?month=${params.month}&year=${params.year}`,
  );
  return data.stats;
}

export async function recordExpense(
  page: Page,
  params: { description: string; amount: number; type: string; date: string },
) {
  return createExpense(page, params);
}

export async function getOrderHistory(page: Page, orderId: string) {
  const { data } = await apiGet<{ history: any[] }>(page, `/api/admin/orders/${orderId}/history`);
  return data.history || [];
}

export async function getSupplierStats(page: Page, supplierId: string) {
  const { data } = await apiGet<{ stats: any; recentOrders: any[] }>(
    page,
    `/api/admin/suppliers/${supplierId}/stats`,
  );
  return data;
}

export async function getCategories(page: Page, search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const { data } = await apiGet<{ categories: any[] }>(page, `/api/admin/categories${query}`);
  return data.categories || [];
}

export async function deleteCategory(page: Page, categoryId: string) {
  const { response } = await apiDelete<{ success?: boolean }>(
    page,
    `/api/admin/categories/${categoryId}`,
  );
  return response;
}

export async function createCategory(
  page: Page,
  params: {
    name: string;
    slug?: string;
    description?: string;
    imageStr?: string;
  },
) {
  const { data } = await apiPost<{ success: boolean; category: any }>(
    page,
    "/api/admin/categories",
    params,
  );
  return data.category;
}

export async function getSuppliers(page: Page, search?: string) {
  const params = new URLSearchParams();
  params.set("includeInactive", "true");
  if (search != null && search !== "") params.set("search", search);
  const qs = params.toString();
  const { data } = await apiGet<{ suppliers: any[] }>(
    page,
    `/api/admin/suppliers${qs ? `?${qs}` : ""}`,
  );
  return data?.suppliers ?? [];
}

export async function deleteSupplier(page: Page, supplierId: string) {
  const { response } = await apiDelete<{ success?: boolean }>(
    page,
    `/api/admin/suppliers/${supplierId}`,
  );
  return response;
}

/**
 * Clean up test expenses whose description contains the given pattern.
 */
export async function cleanupTestExpenses(page: Page, descriptionPattern: string) {
  try {
    const expenses = await listExpenses(page);
    const toDelete = expenses.filter(
      (e: any) => e.description && String(e.description).includes(descriptionPattern),
    );
    for (const e of toDelete) {
      await deleteExpense(page, e.id);
    }
    return toDelete.length;
  } catch {
    return 0;
  }
}

/**
 * Clean up test categories whose name contains the given pattern.
 */
export async function cleanupTestCategories(page: Page, namePattern: string) {
  try {
    const categories = await getCategories(page);
    const toDelete = categories.filter((c: any) => c.name && String(c.name).includes(namePattern));
    for (const c of toDelete) {
      // Handle nested categories or constraints if necessary, currently just delete
      await deleteCategory(page, c.id);
    }
    return toDelete.length;
  } catch {
    return 0;
  }
}

/**
 * Clean up test suppliers whose name contains the given pattern.
 */
export async function cleanupTestSuppliers(page: Page, namePattern: string) {
  try {
    const suppliers = await getSuppliers(page);
    const toDelete = suppliers.filter((s: any) => s.name && String(s.name).includes(namePattern));
    for (const s of toDelete) {
      await deleteSupplier(page, s.id);
    }
    return toDelete.length;
  } catch {
    return 0;
  }
}

/**
 * Clean up test supplier orders whose note contains the given pattern.
 */
export async function cleanupTestSupplierOrders(page: Page, notePattern: string) {
  try {
    const orders = await getSupplierOrders(page);
    const list = Array.isArray(orders) ? orders : [];
    const toDelete = list.filter((o: any) => o.note && String(o.note).includes(notePattern));
    for (const o of toDelete) {
      await deleteSupplierOrder(page, o.id);
    }
    return toDelete.length;
  } catch {
    return 0;
  }
}

/**
 * Clean up test data created during tests
 * This helps prevent test interference by removing products created with specific patterns
 */
export async function cleanupTestProducts(page: Page, namePattern?: string) {
  try {
    const products = await getProductsWithVariants(page);
    const testProducts = products.filter((p: any) => {
      if (namePattern) {
        return p.name.includes(namePattern);
      }
      // Default: clean up products with common test patterns
      return (
        p.name.includes("E2E") ||
        p.name.includes("Test") ||
        p.name.includes("Validation") ||
        p.name.includes("Cost History") ||
        p.name.includes("Catalog Product") ||
        p.name.includes("Inactive in Category") ||
        p.name.includes("Threshold Test") ||
        p.name.includes("SKU Search") ||
        p.name.includes("Concurrent") ||
        p.name.includes("Negative Stock") ||
        p.name.includes("Stock Product") ||
        p.name.includes("Image Test") ||
        p.name.includes("Active Catalog") ||
        p.name.includes("Inactive Catalog") ||
        p.name.includes("Duplicate SKU") ||
        p.name.includes("Updated Product") ||
        p.name.includes("Matrix Product") ||
        p.name.includes("Variant Product") ||
        p.name.includes("Stock Type Product") ||
        p.name.includes("Stock Validation") ||
        p.name.includes("Out of Stock") ||
        p.name.includes("Low Stock") ||
        p.name.includes("Normal Stock") ||
        p.name.includes("Slug Test") ||
        p.name.includes("Deactivate Test")
      );
    });

    for (const product of testProducts) {
      await apiDelete(page, `/api/admin/products/${product.id}`);
    }

    return testProducts.length;
  } catch (_error) {
    return 0;
  }
}
