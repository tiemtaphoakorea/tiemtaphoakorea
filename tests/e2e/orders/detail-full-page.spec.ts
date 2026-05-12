import type { Page } from "@playwright/test";
import { PAYMENT_STATUS } from "@workspace/shared/constants";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  apiDelete,
  apiPost,
  cancelOrder,
  cleanupTestProducts,
  createOrder,
  createProductWithVariants,
  deleteOrder,
  getOrderDetails,
} from "../helpers/api";

const digitsFromRunId = (runId: string) => runId.replace(/\D/g, "").slice(-8).padStart(8, "0");

function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function createDetailCustomer(page: Page, runId: string, suffix = "Primary") {
  const phone = `09${digitsFromRunId(`${runId}${suffix}`)}`;
  const { data } = await apiPost<any>(page, "/api/admin/customers", {
    fullName: `E2E Order Detail ${suffix} ${runId}`,
    phone,
    address: `${suffix} address ${runId}`,
    customerType: "retail",
  });
  return data?.profile ?? data?.customer ?? data?.data ?? data;
}

async function createDetailProduct(page: Page, runId: string) {
  const created = await createProductWithVariants(page, {
    name: `E2E Order Detail Product ${runId}`,
    variants: [
      {
        sku: `ORD-DETAIL-A-${runId}`,
        attributes: { Color: "Navy", Size: "M" },
        stockQuantity: 150,
        onHand: 150,
        lowStockThreshold: 5,
        price: 120000,
        costPrice: 70000,
      },
      {
        sku: `ORD-DETAIL-B-${runId}`,
        attributes: { Color: "Green", Size: "L" },
        stockQuantity: 150,
        onHand: 150,
        lowStockThreshold: 5,
        price: 150000,
        costPrice: 85000,
      },
    ],
  });
  return created.product;
}

async function createDetailOrder(page: Page, runId: string) {
  const customer = await createDetailCustomer(page, runId);
  const product = await createDetailProduct(page, runId);
  const firstVariantId = product.variants[0].id as string;
  const secondVariantId = product.variants[1].id as string;
  const order = await createOrder(page, {
    customerId: customer.id,
    items: [
      { variantId: firstVariantId, quantity: 2 },
      { variantId: secondVariantId, quantity: 1 },
    ],
    note: runId,
  });
  if (!order.order?.id) {
    throw new Error(`Order creation failed: ${JSON.stringify(order)}`);
  }
  return { customer, product, order: order.order, firstVariantId, secondVariantId };
}

async function gotoOrderDetail(page: Page, orderId: string, orderNumber?: string) {
  await page.goto(`/orders/${orderId}`);
  await expect(page).toHaveURL(new RegExp(`/orders/${orderId}$`));
  if (orderNumber) {
    await expect(page.getByRole("heading", { name: `#${orderNumber}` })).toBeVisible();
  }
}

test.describe("Orders - Detail page automation coverage", () => {
  test.describe.configure({ mode: "serial" });

  let runId: string;
  let customerIds: string[];
  let orderIds: string[];

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-ORD-DETAIL-${testInfo.workerIndex}-${Date.now()}`;
    customerIds = [];
    orderIds = [];
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    for (const orderId of orderIds.reverse()) {
      await cancelOrder(page, orderId, { note: `cleanup ${runId}` }).catch(() => {});
      await deleteOrder(page, orderId).catch(() => {});
    }
    for (const customerId of customerIds.reverse()) {
      await apiDelete(page, `/api/admin/customers/${customerId}`).catch(() => {});
    }
    await cleanupTestProducts(page, runId);
  });

  test("renders the detail page shell, key sections, status actions, and payment history", async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);
    const { customer, order } = await createDetailOrder(page, runId);
    customerIds.push(customer.id);
    orderIds.push(order.id);

    await apiPost(page, `/api/admin/orders/${order.id}/payments`, {
      amount: 100000,
      method: "cash",
      note: `render payment ${runId}`,
    });

    await gotoOrderDetail(page, order.id, order.orderNumber);

    await expect(
      page.locator('[data-slot="badge"]').filter({ hasText: "Thanh toán một phần" }).first(),
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="badge"]').filter({ hasText: "Chờ xử lý" }).first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Xuất hóa đơn" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Xuất kho" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hủy đơn" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Thanh toán" })).toBeVisible();

    for (const heading of [
      "Chi tiết sản phẩm",
      "Lịch sử thanh toán",
      "Lịch sử trạng thái",
      "Thông tin khách hàng",
    ]) {
      await expect(page.getByText(heading, { exact: true })).toBeVisible();
    }

    await expect(page.getByText(customer.fullName, { exact: true })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Navy - M" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Green - L" })).toBeVisible();
    await expect(page.getByText(`render payment ${runId}`, { exact: true })).toBeVisible();
    await expect(page.locator("text=Unhandled Runtime Error")).toHaveCount(0);
    await expect(page.locator("text=Build Error")).toHaveCount(0);
    expect(consoleErrors).toEqual([]);
  });

  test("updates admin note, discount, and custom shipping details", async ({ page }) => {
    const { customer, order } = await createDetailOrder(page, runId);
    customerIds.push(customer.id);
    orderIds.push(order.id);

    await gotoOrderDetail(page, order.id, order.orderNumber);

    await page.getByRole("button", { name: "Chỉnh sửa" }).click();
    await page.locator("textarea#adminNote").fill(`Admin note ${runId}`);
    await page.locator("input#discount").fill("15000");
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/admin/orders/${order.id}`) &&
          response.request().method() === "PUT" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Lưu" }).click(),
    ]);
    await expect(page.getByText(`Admin note ${runId}`, { exact: true })).toBeVisible();

    const shippingSection = page
      .getByText("Thông tin giao hàng", { exact: true })
      .locator("xpath=ancestor::div[contains(@class,'space-y-3')][1]");
    await shippingSection.getByRole("button", { name: "Sửa" }).click();
    await page.getByText("Địa chỉ tùy chỉnh", { exact: true }).click();
    await page.getByPlaceholder("Họ tên người nhận").fill(`Receiver ${runId}`);
    await page.getByPlaceholder("Số liên hệ khi giao").fill("0987654321");
    await page
      .getByPlaceholder("Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành...")
      .fill(`Shipping address ${runId}`);
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/admin/orders/${order.id}`) &&
          response.request().method() === "PUT" &&
          response.status() === 200,
      ),
      shippingSection.getByRole("button", { name: "Lưu" }).click(),
    ]);

    await expect(page.getByText(`Receiver ${runId}`, { exact: true })).toBeVisible();
    await expect(page.getByText(`Shipping address ${runId}`, { exact: true })).toBeVisible();

    const updated = await getOrderDetails(page, order.id);
    expect(updated.adminNote).toBe(`Admin note ${runId}`);
    expect(Number(updated.discount)).toBe(15000);
    expect(updated.shippingName).toBe(`Receiver ${runId}`);
    expect(updated.shippingPhone).toBe("0987654321");
    expect(updated.shippingAddress).toBe(`Shipping address ${runId}`);
  });

  test("edits order items from the detail page while order is pending", async ({ page }) => {
    const { customer, order } = await createDetailOrder(page, runId);
    customerIds.push(customer.id);
    orderIds.push(order.id);

    await gotoOrderDetail(page, order.id, order.orderNumber);

    const itemsCard = page
      .getByText("Chi tiết sản phẩm", { exact: true })
      .locator("xpath=ancestor::div[contains(@class,'ring-slate-200')][1]");
    await itemsCard.getByRole("button", { name: "Sửa" }).click();
    const firstItemRow = itemsCard.locator("tbody tr").filter({ hasText: "Navy" });
    await firstItemRow.locator("input").nth(0).fill("3");
    await firstItemRow.locator("input").nth(1).fill("130000");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/admin/orders/${order.id}`) &&
          response.request().method() === "PUT" &&
          response.status() === 200,
      ),
      itemsCard.getByRole("button", { name: "Lưu" }).click(),
    ]);

    const updated = await getOrderDetails(page, order.id);
    const editedItem = updated.items.find((item: any) => String(item.variantName).includes("Navy"));
    expect(editedItem.quantity).toBe(3);
    expect(Number(editedItem.unitPrice)).toBe(130000);
  });

  test("records a payment from the detail page and updates payment status", async ({ page }) => {
    const { customer, order } = await createDetailOrder(page, runId);
    customerIds.push(customer.id);
    orderIds.push(order.id);

    await gotoOrderDetail(page, order.id, order.orderNumber);

    await page.getByRole("button", { name: "Thanh toán" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Ghi nhận thanh toán" })).toBeVisible();
    await dialog.locator("input").first().fill("200000");
    await dialog.getByPlaceholder("Ghi chú nội bộ...").fill(`Payment note ${runId}`);
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/admin/orders/${order.id}/payments`) &&
          response.request().method() === "POST" &&
          response.status() === 200,
      ),
      dialog.getByRole("button", { name: "Lưu thanh toán" }).click(),
    ]);

    await expect(page.getByText("Lịch sử thanh toán", { exact: true })).toBeVisible();
    await expect(page.getByText(`Payment note ${runId}`, { exact: true })).toBeVisible();

    const updated = await getOrderDetails(page, order.id, { expectedPaidAmount: 200000 });
    expect(Number(updated.paidAmount)).toBe(200000);
    expect(updated.paymentStatus).toBe(PAYMENT_STATUS.PARTIAL);
  });

  test("stocks out a paid order and then completes it from the detail page", async ({ page }) => {
    const { customer, order } = await createDetailOrder(page, runId);
    customerIds.push(customer.id);
    orderIds.push(order.id);

    await gotoOrderDetail(page, order.id, order.orderNumber);

    await page.getByRole("button", { name: "Thanh toán" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Ghi nhận thanh toán" })).toBeVisible();
    await dialog.getByPlaceholder("Ghi chú nội bộ...").fill(`Full payment ${runId}`);
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/admin/orders/${order.id}/payments`) &&
          response.request().method() === "POST" &&
          response.status() === 200,
      ),
      dialog.getByRole("button", { name: "Lưu thanh toán" }).click(),
    ]);
    await expect(
      page.locator('[data-slot="badge"]').filter({ hasText: "Đã thanh toán" }).first(),
    ).toBeVisible();

    await page
      .getByPlaceholder("Nhập ghi chú cho lần cập nhật trạng thái này...")
      .fill(`Stock out note ${runId}`);
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/admin/orders/${order.id}/stock-out`) &&
          response.request().method() === "POST" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Xuất kho" }).click(),
    ]);
    await expect(
      page.locator('[data-slot="badge"]').filter({ hasText: "Đã xuất kho" }).first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Hoàn tất đơn" })).toBeVisible();

    await page
      .getByPlaceholder("Nhập ghi chú cho lần cập nhật trạng thái này...")
      .fill(`Complete note ${runId}`);
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/admin/orders/${order.id}/complete`) &&
          response.request().method() === "POST" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Hoàn tất đơn" }).click(),
    ]);

    await expect(
      page.locator('[data-slot="badge"]').filter({ hasText: "Hoàn thành" }).first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Hoàn tất đơn" })).toHaveCount(0);
    const updated = await getOrderDetails(page, order.id);
    expect(updated.paymentStatus).toBe(PAYMENT_STATUS.PAID);
    expect(updated.fulfillmentStatus).toBe("completed");
  });

  test("protects cancellation behind confirmation and then marks order as cancelled", async ({
    page,
  }) => {
    const { customer, order } = await createDetailOrder(page, runId);
    customerIds.push(customer.id);
    orderIds.push(order.id);

    await gotoOrderDetail(page, order.id, order.orderNumber);
    await page
      .getByPlaceholder("Nhập ghi chú cho lần cập nhật trạng thái này...")
      .fill(`Cancel note ${runId}`);
    await page.getByRole("button", { name: "Hủy đơn" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Bạn có chắc chắn muốn hủy đơn hàng này?" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Huỷ" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(
      page.locator('[data-slot="badge"]').filter({ hasText: "Chờ xử lý" }).first(),
    ).toBeVisible();

    await page.getByRole("button", { name: "Hủy đơn" }).click();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/admin/orders/${order.id}/cancel`) &&
          response.request().method() === "POST" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Hủy đơn" }).click(),
    ]);

    await expect(
      page.locator('[data-slot="badge"]').filter({ hasText: "Đã huỷ" }).first(),
    ).toBeVisible();
    await expect(page.getByTestId("delete-order-button")).toBeVisible();
    const updated = await getOrderDetails(page, order.id);
    expect(updated.fulfillmentStatus).toBe("cancelled");
  });
});
