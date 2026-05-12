import type { Page } from "@playwright/test";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  apiDelete,
  apiPost,
  cancelOrder,
  cleanupTestProducts,
  createProductWithVariants,
  deleteOrder,
  getOrderDetails,
} from "../helpers/api";

const digitsFromRunId = (runId: string) => runId.replace(/\D/g, "").slice(-8).padStart(8, "0");
const customerSearchButton = (page: Page) =>
  page.getByRole("combobox").filter({ hasText: "Tìm kiếm khách hàng..." });
const productSearchInput = (page: Page) => page.getByLabel("Tìm sản phẩm");

async function createOrderCustomer(page: Page, runId: string, suffix = "Primary") {
  const phone = `07${digitsFromRunId(`${runId}${suffix}`)}`;
  const { data } = await apiPost<any>(page, "/api/admin/customers", {
    fullName: `E2E Create Order ${suffix} ${runId}`,
    phone,
    address: `${suffix} customer address ${runId}`,
    customerType: "retail",
  });
  return data?.profile ?? data?.customer ?? data?.data ?? data;
}

async function createOrderProduct(page: Page, runId: string) {
  const created = await createProductWithVariants(page, {
    name: `E2E Create Order Product ${runId}`,
    variants: [
      {
        sku: `CREATE-A-${runId}`,
        attributes: { Color: "Blue", Size: "M" },
        stockQuantity: 120,
        onHand: 120,
        lowStockThreshold: 5,
        price: 110000,
        costPrice: 65000,
      },
      {
        sku: `CREATE-B-${runId}`,
        attributes: { Color: "Red", Size: "L" },
        stockQuantity: 80,
        onHand: 80,
        lowStockThreshold: 5,
        price: 140000,
        costPrice: 80000,
      },
    ],
  });
  return created.product;
}

async function gotoCreateOrder(page: Page) {
  await page.goto("/orders/new");
  await expect(page).toHaveURL(/\/orders\/new$/);
  await expect(page.getByRole("heading", { name: "Tạo đơn hàng mới" })).toBeVisible();
}

async function selectExistingCustomer(page: Page, customer: any) {
  await customerSearchButton(page).click();
  await page.getByPlaceholder("Tìm theo tên hoặc SĐT...").fill(customer.phone);
  await page.getByRole("option").filter({ hasText: customer.phone }).click();
  await expect(page.getByText(customer.fullName, { exact: true })).toBeVisible();
}

async function addVariantBySku(page: Page, sku: string) {
  await productSearchInput(page).fill(sku);
  await page.getByRole("option").filter({ hasText: sku }).click();
  await expect(page.getByRole("row").filter({ hasText: sku })).toBeVisible();
}

async function submitOrderAndCaptureId(page: Page) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/admin/orders") &&
        response.request().method() === "POST" &&
        response.status() === 200,
    ),
    page.getByRole("button", { name: "Tạo đơn hàng" }).click(),
  ]);

  const data = await response.json();
  const orderId = data?.order?.id;
  if (!orderId) {
    throw new Error("Create order response did not include order.id");
  }

  await expect(page).toHaveURL(new RegExp(`/orders/${orderId}$`));
  return orderId as string;
}

test.describe("Orders - Create page automation coverage", () => {
  test.describe.configure({ mode: "serial" });

  let runId: string;
  let customerIds: string[];
  let orderIds: string[];

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-ORD-CREATE-${testInfo.workerIndex}-${Date.now()}`;
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

  test("renders the create page shell, customer picker, add-row, empty cart, and disabled submit", async ({
    page,
  }) => {
    await gotoCreateOrder(page);

    await expect(page.getByText("Chọn khách hàng để bắt đầu", { exact: true })).toBeVisible();
    await expect(customerSearchButton(page)).toBeVisible();
    await expect(productSearchInput(page)).toBeVisible();
    await expect(page.getByRole("button", { name: "Chọn nhiều" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Dán SKU" })).toBeVisible();
    await expect(page.getByText("Chưa có sản phẩm nào", { exact: true })).toBeVisible();
    await expect(page.getByText("0 dòng · 0 sản phẩm", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tạo đơn hàng" })).toBeDisabled();
    await expect(page.locator("text=Unhandled Runtime Error")).toHaveCount(0);
    await expect(page.locator("text=Build Error")).toHaveCount(0);
  });

  test("creates an order for an existing customer with edited cart and shipping fee", async ({
    page,
  }) => {
    const customer = await createOrderCustomer(page, runId);
    customerIds.push(customer.id);
    await createOrderProduct(page, runId);

    await gotoCreateOrder(page);
    await selectExistingCustomer(page, customer);

    await expect(page.locator("#ship-name")).toHaveValue(customer.fullName);
    await page.locator("#ship-address").fill(`Edited shipping address ${runId}`);
    await page.getByLabel("Trả phí ship hộ khách").click();
    await page.locator("#shipping-fee").fill("25000");
    await page.locator("#order-note").fill(`Create order note ${runId}`);

    await addVariantBySku(page, `CREATE-A-${runId}`);
    const row = page.getByRole("row").filter({ hasText: `CREATE-A-${runId}` });
    await row.getByRole("textbox", { name: "Số lượng" }).fill("3");
    await row.getByRole("textbox", { name: "Đơn giá" }).fill("125000");

    await expect(page.getByText("1 dòng · 3 sản phẩm", { exact: true })).toBeVisible();
    await expect(page.getByText("Phí ship: 25.000 ₫", { exact: true })).toBeVisible();

    const orderId = await submitOrderAndCaptureId(page);
    orderIds.push(orderId);
    const order = await getOrderDetails(page, orderId);

    expect(order.customer.id).toBe(customer.id);
    expect(order.shippingAddress).toBe(`Edited shipping address ${runId}`);
    expect(Number(order.shippingFee)).toBe(25000);
    expect(order.adminNote ?? order.note).toContain(runId);
    expect(order.items).toHaveLength(1);
    expect(order.items[0].quantity).toBe(3);
    expect(Number(order.items[0].unitPrice)).toBe(125000);
  });

  test("creates a new customer inline and redirects to the created order detail", async ({
    page,
  }) => {
    await createOrderProduct(page, runId);
    const newCustomerName = `E2E Inline Customer ${runId}`;
    const newCustomerPhone = `06${digitsFromRunId(runId)}`;

    await gotoCreateOrder(page);
    await customerSearchButton(page).click();
    await page.getByPlaceholder("Tìm theo tên hoặc SĐT...").fill(newCustomerName);
    await page.getByRole("button", { name: `Tạo mới "${newCustomerName}"` }).click();
    await expect(page.getByText("Khách hàng mới", { exact: true })).toBeVisible();
    await page.locator("#new-phone").fill(newCustomerPhone);

    await page.locator("#ship-address").fill(`Inline shipping address ${runId}`);
    await addVariantBySku(page, `CREATE-B-${runId}`);

    const orderId = await submitOrderAndCaptureId(page);
    orderIds.push(orderId);
    const order = await getOrderDetails(page, orderId);
    customerIds.push(order.customer.id);

    expect(order.customer.fullName).toBe(newCustomerName);
    expect(order.customer.phone).toBe(newCustomerPhone);
    expect(order.shippingAddress).toBe(`Inline shipping address ${runId}`);
    expect(order.items).toHaveLength(1);
  });

  test("adds products by pasted SKU list, merges duplicates, searches the cart, and removes a row", async ({
    page,
  }) => {
    const customer = await createOrderCustomer(page, runId);
    customerIds.push(customer.id);
    await createOrderProduct(page, runId);

    await gotoCreateOrder(page);
    await selectExistingCustomer(page, customer);

    await page.getByRole("button", { name: "Dán SKU" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Dán danh sách SKU" })).toBeVisible();
    await dialog
      .locator("textarea")
      .fill(`CREATE-A-${runId},2\nCREATE-A-${runId},1\nCREATE-B-${runId},4\nNO-SUCH-SKU,9`);
    await dialog.getByRole("button", { name: "Phân tích" }).click();
    await expect(dialog.getByText("2 hợp lệ", { exact: false })).toBeVisible();
    await expect(dialog.getByText("1 không tìm thấy", { exact: false })).toBeVisible();
    await expect(dialog.getByText("1 trùng", { exact: false })).toBeVisible();
    await dialog.getByRole("button", { name: "Thêm tất cả (2)" }).click();

    await expect(page.getByText("2 dòng · 7 sản phẩm", { exact: true })).toBeVisible();
    await expect(
      page
        .getByRole("row")
        .filter({ hasText: `CREATE-A-${runId}` })
        .getByRole("textbox", { name: "Số lượng" }),
    ).toHaveValue("3");
    await expect(
      page
        .getByRole("row")
        .filter({ hasText: `CREATE-B-${runId}` })
        .getByRole("textbox", { name: "Số lượng" }),
    ).toHaveValue("4");

    await page.getByLabel("Tìm trong giỏ").fill(`CREATE-B-${runId}`);
    await expect(page.getByRole("row").filter({ hasText: `CREATE-B-${runId}` })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: `CREATE-A-${runId}` })).toHaveCount(0);

    await page.getByLabel("Tìm trong giỏ").fill("");
    await page
      .getByRole("row")
      .filter({ hasText: `CREATE-A-${runId}` })
      .getByLabel("Xoá khỏi đơn")
      .click();
    await expect(page.getByText("1 dòng · 4 sản phẩm", { exact: true })).toBeVisible();
  });
});
