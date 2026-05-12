import type { Page } from "@playwright/test";
import { FULFILLMENT_STATUS } from "@workspace/shared/constants";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  apiDelete,
  apiPost,
  cancelOrder,
  cleanupTestProducts,
  completeOrder,
  createOrder,
  createProductWithVariants,
  deleteOrder,
  recordPayment,
  stockOut,
} from "../helpers/api";

const orderSearch = (page: Page) => page.getByPlaceholder("Tìm mã đơn, khách hàng...");

async function waitForOrdersListResponse(
  page: Page,
  params: { search?: string; limit?: string; page?: string; fulfillmentStatus?: string },
) {
  await page.waitForResponse((response) => {
    if (response.status() !== 200) return false;
    const url = new URL(response.url());
    if (!url.pathname.endsWith("/api/admin/orders")) return false;
    if (params.search !== undefined && url.searchParams.get("search") !== params.search) {
      return false;
    }
    if (params.limit !== undefined && url.searchParams.get("limit") !== params.limit) {
      return false;
    }
    if (params.page !== undefined && url.searchParams.get("page") !== params.page) {
      return false;
    }
    if (
      params.fulfillmentStatus !== undefined &&
      url.searchParams.get("fulfillmentStatus") !== params.fulfillmentStatus
    ) {
      return false;
    }
    return true;
  });
}

async function gotoOrders(page: Page) {
  await page.goto("/orders");
  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.getByRole("tab", { name: "Tất cả" })).toBeVisible();
  await expect(orderSearch(page)).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
}

async function searchOrders(page: Page, term: string, limit = "25") {
  const responsePromise = waitForOrdersListResponse(page, { search: term, limit });
  await orderSearch(page).fill(term);
  await responsePromise;
  await expect(orderSearch(page)).toHaveValue(term);
}

async function createTestCustomer(page: Page, runId: string) {
  const phone = `08${runId.replace(/\D/g, "").slice(-8).padStart(8, "0")}`;
  const { data } = await apiPost<any>(page, "/api/admin/customers", {
    fullName: `E2E Orders Customer ${runId}`,
    phone,
    customerType: "retail",
  });
  return data?.profile ?? data?.customer ?? data?.data ?? data;
}

async function createOrderProduct(page: Page, runId: string) {
  const product = await createProductWithVariants(page, {
    name: `E2E Orders Product ${runId}`,
    variants: [
      {
        sku: `ORD-FULL-${runId}`,
        stockQuantity: 200,
        onHand: 200,
        lowStockThreshold: 5,
        price: 100000,
      },
    ],
  });
  return product.product?.variants?.[0]?.id as string | undefined;
}

test.describe("Orders - Full page automation coverage", () => {
  test.describe.configure({ mode: "serial" });

  let runId: string;
  let customerId: string | null;
  let createdOrderIds: string[];

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-ORD-FULL-${testInfo.workerIndex}-${Date.now()}`;
    customerId = null;
    createdOrderIds = [];
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    for (const orderId of createdOrderIds.reverse()) {
      await apiPost(page, `/api/admin/orders/${orderId}/return`, {
        reason: `cleanup ${runId}`,
      }).catch(() => {});
      await cancelOrder(page, orderId, { note: `cleanup ${runId}` }).catch(() => {});
      await deleteOrder(page, orderId).catch(() => {});
    }
    if (customerId) {
      await apiDelete(page, `/api/admin/customers/${customerId}`).catch(() => {});
    }
    await cleanupTestProducts(page, runId);
  });

  test("renders the orders page shell, table columns, and primary actions", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await gotoOrders(page);

    await expect(page.locator('a[href="/orders"]').filter({ hasText: "Đơn hàng" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Tạo đơn/i })).toHaveAttribute(
      "href",
      "/orders/new",
    );
    await expect(page.getByRole("button", { name: "Xuất Excel" })).toBeVisible();

    for (const tabName of ["Tất cả", "Chờ xử lý", "Đã xuất kho", "Hoàn thành", "Đã huỷ"]) {
      await expect(page.getByRole("tab", { name: tabName })).toBeVisible();
    }

    for (const header of [
      "Mã đơn",
      "Ngày tạo đơn",
      "Tên khách",
      "Thanh toán",
      "Trạng thái",
      "Tổng tiền",
    ]) {
      await expect(page.getByRole("columnheader", { name: header })).toBeVisible();
    }

    await expect(page.getByRole("button", { name: "Previous page" })).toBeDisabled();
    await expect(page.locator("span").filter({ hasText: /\/ trang · Tổng \d+ đơn/ })).toBeVisible();
    await expect(page.locator("text=Unhandled Runtime Error")).toHaveCount(0);
    await expect(page.locator("text=Build Error")).toHaveCount(0);
    expect(consoleErrors).toEqual([]);
  });

  test("searches by order number and customer name, then opens detail from a row", async ({
    page,
  }) => {
    const customer = await createTestCustomer(page, runId);
    customerId = customer.id;
    const variantId = await createOrderProduct(page, runId);
    expect(variantId).toBeTruthy();

    const order = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
      note: runId,
    });
    if (!order.order?.id) {
      throw new Error(`Order creation failed: ${JSON.stringify(order)}`);
    }
    expect(order.order?.id).toBeTruthy();
    createdOrderIds.push(order.order.id);

    await gotoOrders(page);
    await searchOrders(page, order.order.orderNumber);
    await expect(page.getByText(order.order.orderNumber, { exact: true })).toBeVisible();

    await searchOrders(page, customer.fullName);
    await expect(page.getByText(customer.fullName, { exact: true })).toBeVisible();

    await page.getByRole("row").filter({ hasText: order.order.orderNumber }).click();
    await expect(page).toHaveURL(new RegExp(`/orders/${order.order.id}$`));
  });

  test("searches by customer phone and filters searched orders by every fulfillment status", async ({
    page,
  }) => {
    const customer = await createTestCustomer(page, runId);
    customerId = customer.id;
    const variantId = await createOrderProduct(page, runId);
    expect(variantId).toBeTruthy();

    const pending = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
      note: `${runId} pending`,
    });
    const stockOutOrder = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
      note: `${runId} stock out`,
    });
    const completed = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
      note: `${runId} completed`,
    });
    const cancelled = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
      note: `${runId} cancelled`,
    });
    expect(pending.order?.id).toBeTruthy();
    expect(stockOutOrder.order?.id).toBeTruthy();
    expect(completed.order?.id).toBeTruthy();
    expect(cancelled.order?.id).toBeTruthy();
    createdOrderIds.push(
      pending.order.id,
      stockOutOrder.order.id,
      completed.order.id,
      cancelled.order.id,
    );
    await stockOut(page, stockOutOrder.order.id, { note: runId });
    await recordPayment(page, completed.order.id, {
      amount: Number(completed.order.total),
      method: "cash",
    });
    await stockOut(page, completed.order.id, { note: runId });
    await completeOrder(page, completed.order.id, { note: runId });
    await cancelOrder(page, cancelled.order.id, { note: runId });

    await gotoOrders(page);
    await searchOrders(page, customer.phone);
    await expect(page.getByText(pending.order.orderNumber, { exact: true })).toBeVisible();
    await expect(page.getByText(stockOutOrder.order.orderNumber, { exact: true })).toBeVisible();
    await expect(page.getByText(completed.order.orderNumber, { exact: true })).toBeVisible();
    await expect(page.getByText(cancelled.order.orderNumber, { exact: true })).toBeVisible();

    await Promise.all([
      waitForOrdersListResponse(page, {
        search: customer.phone,
        limit: "25",
        fulfillmentStatus: FULFILLMENT_STATUS.PENDING,
      }),
      page.getByRole("tab", { name: "Chờ xử lý" }).click(),
    ]);
    await expect(page.getByText(pending.order.orderNumber, { exact: true })).toBeVisible();
    await expect(page.getByText(stockOutOrder.order.orderNumber, { exact: true })).toHaveCount(0);
    await expect(page.getByText(completed.order.orderNumber, { exact: true })).toHaveCount(0);
    await expect(page.getByText(cancelled.order.orderNumber, { exact: true })).toHaveCount(0);

    await Promise.all([
      waitForOrdersListResponse(page, {
        search: customer.phone,
        limit: "25",
        fulfillmentStatus: FULFILLMENT_STATUS.STOCK_OUT,
      }),
      page.getByRole("tab", { name: "Đã xuất kho" }).click(),
    ]);
    await expect(page.getByText(stockOutOrder.order.orderNumber, { exact: true })).toBeVisible();
    await expect(page.getByText(pending.order.orderNumber, { exact: true })).toHaveCount(0);
    await expect(page.getByText(completed.order.orderNumber, { exact: true })).toHaveCount(0);
    await expect(page.getByText(cancelled.order.orderNumber, { exact: true })).toHaveCount(0);

    await Promise.all([
      waitForOrdersListResponse(page, {
        search: customer.phone,
        limit: "25",
        fulfillmentStatus: FULFILLMENT_STATUS.COMPLETED,
      }),
      page.getByRole("tab", { name: "Hoàn thành" }).click(),
    ]);
    await expect(page.getByText(completed.order.orderNumber, { exact: true })).toBeVisible();
    await expect(page.getByText(pending.order.orderNumber, { exact: true })).toHaveCount(0);
    await expect(page.getByText(stockOutOrder.order.orderNumber, { exact: true })).toHaveCount(0);
    await expect(page.getByText(cancelled.order.orderNumber, { exact: true })).toHaveCount(0);

    await Promise.all([
      waitForOrdersListResponse(page, {
        search: customer.phone,
        limit: "25",
        fulfillmentStatus: FULFILLMENT_STATUS.CANCELLED,
      }),
      page.getByRole("tab", { name: "Đã huỷ" }).click(),
    ]);
    await expect(page.getByText(cancelled.order.orderNumber, { exact: true })).toBeVisible();
    await expect(page.getByText(pending.order.orderNumber, { exact: true })).toHaveCount(0);
    await expect(page.getByText(stockOutOrder.order.orderNumber, { exact: true })).toHaveCount(0);
    await expect(page.getByText(completed.order.orderNumber, { exact: true })).toHaveCount(0);

    await page.getByRole("tab", { name: "Tất cả" }).click();
    await expect(page.getByText(pending.order.orderNumber, { exact: true })).toBeVisible();
    await expect(page.getByText(stockOutOrder.order.orderNumber, { exact: true })).toBeVisible();
    await expect(page.getByText(completed.order.orderNumber, { exact: true })).toBeVisible();
    await expect(page.getByText(cancelled.order.orderNumber, { exact: true })).toBeVisible();

    await searchOrders(page, `${runId}-NO-MATCH`);
    await expect(page.getByRole("cell", { name: "Chưa có đơn nào" })).toBeVisible();
  });

  test("paginates isolated search results and changes page size", async ({ page }) => {
    const customer = await createTestCustomer(page, runId);
    customerId = customer.id;
    const variantId = await createOrderProduct(page, runId);
    expect(variantId).toBeTruthy();

    for (let i = 0; i < 12; i++) {
      const order = await createOrder(page, {
        customerId: customer.id,
        items: [{ variantId: variantId!, quantity: 1 }],
        note: `${runId} page ${i + 1}`,
      });
      expect(order.order?.id).toBeTruthy();
      createdOrderIds.push(order.order.id);
    }

    await gotoOrders(page);
    await searchOrders(page, customer.fullName);
    await expect(page.getByText("Tổng 12 đơn")).toBeVisible();

    await Promise.all([
      waitForOrdersListResponse(page, { search: customer.fullName, limit: "10", page: "1" }),
      page.locator("select").selectOption("10"),
    ]);
    await expect(page.getByRole("button", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("button", { name: "Next page" })).toBeEnabled();

    await Promise.all([
      waitForOrdersListResponse(page, { search: customer.fullName, limit: "10", page: "2" }),
      page.getByRole("button", { name: "Next page" }).click(),
    ]);
    await expect(page.getByRole("button", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(await page.locator("table tbody tr").count()).toBe(2);

    await page.locator("select").selectOption("25");
    await expect(page.getByRole("button", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled();
    await expect(page.locator("table tbody tr")).toHaveCount(12);
  });
});
