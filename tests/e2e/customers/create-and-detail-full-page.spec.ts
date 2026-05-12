import type { Page } from "@playwright/test";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  apiDelete,
  apiPatch,
  apiPost,
  cancelOrder,
  cleanupTestProducts,
  createOrder,
  createProductWithVariants,
  deleteOrder,
  getCustomerDetails,
  getCustomers,
} from "../helpers/api";

const digitsFromRunId = (runId: string) => runId.replace(/\D/g, "").slice(-8).padStart(8, "0");

async function createCustomer(page: Page, runId: string, suffix = "Primary") {
  const suffixDigits = String(Array.from(suffix).reduce((sum, char) => sum + char.charCodeAt(0), 0))
    .slice(-4)
    .padStart(4, "0");
  const phone = `08${digitsFromRunId(runId).slice(0, 4)}${suffixDigits}`;
  const { data } = await apiPost<any>(page, "/api/admin/customers", {
    fullName: `E2E Customer ${suffix} ${runId}`,
    phone,
    address: `${suffix} address ${runId}`,
    customerType: "retail",
  });
  return data?.profile ?? data?.customer ?? data?.data ?? data;
}

async function updateCustomerList(page: Page, action: () => Promise<unknown>) {
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/admin/customers") &&
        response.request().method() === "GET" &&
        response.status() === 200,
    ),
    action(),
  ]);
}

async function createCustomerOrderFixture(page: Page, customerId: string, runId: string) {
  const productData = await createProductWithVariants(page, {
    name: `E2E Customer Detail Product ${runId}`,
    variants: [
      {
        sku: `CUST-DETAIL-${runId}`,
        attributes: { Color: "Black", Size: "M" },
        stockQuantity: 50,
        onHand: 50,
        lowStockThreshold: 5,
        price: 99000,
        costPrice: 45000,
      },
    ],
  });
  const variantId = productData.product.variants[0].id as string;
  const order = await createOrder(page, {
    customerId,
    items: [{ variantId, quantity: 2 }],
    note: `Customer detail order ${runId}`,
  });
  if (!order.order?.id) {
    throw new Error(`Order creation failed: ${JSON.stringify(order)}`);
  }
  return order.order;
}

async function gotoCustomers(page: Page) {
  await page.goto("/customers");
  await expect(page).toHaveURL(/\/customers$/);
  await expect(page.getByPlaceholder("Tìm tên, SĐT, mã KH...")).toBeVisible();
}

async function gotoCustomerDetail(page: Page, customerId: string, fullName?: string) {
  await page.goto(`/customers/${customerId}`);
  await expect(page).toHaveURL(new RegExp(`/customers/${customerId}$`));
  if (fullName) {
    await expect(page.getByRole("heading", { name: fullName })).toBeVisible();
  }
}

test.describe("Customers - Create and detail full-page coverage", () => {
  test.describe.configure({ mode: "serial" });

  let runId: string;
  let customerIds: string[];
  let orderIds: string[];

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-CUST-FULL-${testInfo.workerIndex}-${Date.now()}`;
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

  test("creates a customer from the customers page sheet and lists the saved row", async ({
    page,
  }) => {
    await gotoCustomers(page);

    await page.getByRole("button", { name: "Thêm KH" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("heading", { name: "Thêm khách hàng" })).toBeVisible();

    const fullName = `E2E Created Customer ${runId}`;
    const phone = `08${digitsFromRunId(runId)}`;
    await sheet.locator('input[name="fullName"]').fill(fullName);
    await sheet.locator('input[name="phone"]').fill(phone);
    await sheet.locator('input[name="address"]').fill(`Created customer address ${runId}`);
    await sheet.locator("select").selectOption("wholesale");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/admin/customers") &&
          response.request().method() === "POST" &&
          response.status() === 200,
      ),
      sheet.getByRole("button", { name: "Thêm" }).click(),
    ]);

    const created = await getCustomers(page, phone).then((customers) =>
      customers.find((customer: any) => customer.phone === phone),
    );
    expect(created?.id).toBeTruthy();
    customerIds.push(created.id);

    await page.getByPlaceholder("Tìm tên, SĐT, mã KH...").fill(phone);
    await expect(page.getByRole("row").filter({ hasText: phone })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: fullName })).toBeVisible();
  });

  test("rejects duplicate phone when creating a customer and does not create another record", async ({
    page,
  }) => {
    const existing = await createCustomer(page, runId, "Existing");
    customerIds.push(existing.id);

    await gotoCustomers(page);
    await page.getByRole("button", { name: "Thêm KH" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("heading", { name: "Thêm khách hàng" })).toBeVisible();

    await sheet.locator('input[name="fullName"]').fill(`E2E Duplicate Create ${runId}`);
    await sheet.locator('input[name="phone"]').fill(existing.phone);
    await sheet.locator('input[name="address"]').fill(`Duplicate address ${runId}`);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/admin/customers") &&
          response.request().method() === "POST" &&
          response.status() === 409,
      ),
      sheet.getByRole("button", { name: "Thêm" }).click(),
    ]);

    await expect(sheet.getByRole("heading", { name: "Thêm khách hàng" })).toBeVisible();
    const matches = await getCustomers(page, existing.phone);
    expect(matches.filter((customer: any) => customer.phone === existing.phone)).toHaveLength(1);
    expect(matches[0].fullName).toBe(existing.fullName);
  });

  test("searches customers by name, phone, and customer code, then shows empty results", async ({
    page,
  }) => {
    const nameMatch = await createCustomer(page, runId, "SearchName");
    const phoneMatch = await createCustomer(page, runId, "SearchPhone");
    const codeMatch = await createCustomer(page, runId, "SearchCode");
    customerIds.push(nameMatch.id, phoneMatch.id, codeMatch.id);

    await gotoCustomers(page);
    const searchInput = page.getByPlaceholder("Tìm tên, SĐT, mã KH...");

    await updateCustomerList(page, () => searchInput.fill("SearchName"));
    await expect(page.getByRole("row").filter({ hasText: nameMatch.fullName })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: phoneMatch.fullName })).toHaveCount(0);

    await updateCustomerList(page, () => searchInput.fill(phoneMatch.phone));
    await expect(page.getByRole("row").filter({ hasText: phoneMatch.phone })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: nameMatch.fullName })).toHaveCount(0);

    await updateCustomerList(page, () => searchInput.fill(codeMatch.customerCode));
    await expect(page.getByRole("row").filter({ hasText: codeMatch.customerCode })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: phoneMatch.phone })).toHaveCount(0);

    await updateCustomerList(page, () => searchInput.fill(`NO-MATCH-${runId}`));
    await expect(page.getByText("Chưa có khách hàng", { exact: true })).toBeVisible();
  });

  test("filters customers by active and inactive status and keeps page-size controls usable", async ({
    page,
  }) => {
    const active = await createCustomer(page, runId, "ActiveFilter");
    const inactive = await createCustomer(page, runId, "InactiveFilter");
    customerIds.push(active.id, inactive.id);

    await apiPatch(page, `/api/admin/customers/${inactive.id}/status`, { isActive: false });

    await gotoCustomers(page);
    const searchInput = page.getByPlaceholder("Tìm tên, SĐT, mã KH...");
    const statusSelect = page.locator("select").nth(0);
    const pageSizeSelect = page.locator("select").nth(1);

    await updateCustomerList(page, () => searchInput.fill("Filter"));
    await expect(page.getByRole("row").filter({ hasText: active.fullName })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: inactive.fullName })).toBeVisible();

    await updateCustomerList(page, () => statusSelect.selectOption("active"));
    await expect(page.getByRole("row").filter({ hasText: active.fullName })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: inactive.fullName })).toHaveCount(0);

    await updateCustomerList(page, () => statusSelect.selectOption("inactive"));
    await expect(page.getByRole("row").filter({ hasText: inactive.fullName })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: active.fullName })).toHaveCount(0);

    await statusSelect.selectOption("all");
    await expect(page.getByRole("row").filter({ hasText: active.fullName })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: inactive.fullName })).toBeVisible();

    await pageSizeSelect.selectOption("10");
    await expect(pageSizeSelect).toHaveValue("10");
    await expect(page.getByText(/Tổng \d+ khách hàng/)).toBeVisible();
  });

  test("renders customer detail sections and returns to the customers list", async ({ page }) => {
    const customer = await createCustomer(page, runId);
    customerIds.push(customer.id);

    await gotoCustomerDetail(page, customer.id, customer.fullName);

    await expect(
      page.locator('[data-slot="badge"]').filter({ hasText: "Đang hoạt động" }),
    ).toBeVisible();
    await expect(page.getByText(customer.phone, { exact: true })).toBeVisible();
    await expect(page.getByText(customer.address, { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Thống kê tài chính", { exact: true })).toBeVisible();
    await expect(page.getByText("Tổng chi tiêu", { exact: true })).toBeVisible();
    await expect(page.getByText("Lịch sử đơn hàng", { exact: true })).toBeVisible();
    await expect(page.getByText("Chưa có đơn hàng nào", { exact: true })).toBeVisible();
    await expect(page.locator("text=Unhandled Runtime Error")).toHaveCount(0);
    await expect(page.locator("text=Build Error")).toHaveCount(0);

    await page.getByRole("link", { name: "Quay lại" }).click();
    await expect(page).toHaveURL(/\/customers$/);
    await expect(page.getByPlaceholder("Tìm tên, SĐT, mã KH...")).toBeVisible();
  });

  test("edits customer detail fields and toggles block/unblock state", async ({ page }) => {
    const customer = await createCustomer(page, runId);
    customerIds.push(customer.id);

    await gotoCustomerDetail(page, customer.id, customer.fullName);

    await page.getByRole("button", { name: "Chỉnh sửa" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("heading", { name: "Chỉnh sửa khách hàng" })).toBeVisible();
    await sheet.locator('input[name="fullName"]').fill(`E2E Edited Customer ${runId}`);
    await sheet.locator('input[name="phone"]').fill(`03${digitsFromRunId(runId)}`);
    await sheet.locator('input[name="address"]').fill(`Edited customer address ${runId}`);
    await sheet.locator("select").selectOption("wholesale");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/admin/customers/${customer.id}`) &&
          response.request().method() === "PUT" &&
          response.status() === 200,
      ),
      sheet.getByRole("button", { name: "Lưu thay đổi" }).click(),
    ]);

    await expect(page.getByRole("heading", { name: `E2E Edited Customer ${runId}` })).toBeVisible();
    await expect(page.getByText(`03${digitsFromRunId(runId)}`, { exact: true })).toBeVisible();
    await expect(
      page.getByText(`Edited customer address ${runId}`, { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByText("Khách sỉ", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Chặn" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Huỷ" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(
      page.locator('[data-slot="badge"]').filter({ hasText: "Đang hoạt động" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Chặn" }).click();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/admin/customers/${customer.id}/status`) &&
          response.request().method() === "PATCH" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Xác nhận" }).click(),
    ]);
    await expect(
      page.locator('[data-slot="badge"]').filter({ hasText: "Đã bị khóa" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Mở chặn" })).toBeVisible();

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/admin/customers/${customer.id}/status`) &&
          response.request().method() === "PATCH" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Mở chặn" }).click(),
    ]);
    await expect(
      page.locator('[data-slot="badge"]').filter({ hasText: "Đang hoạt động" }),
    ).toBeVisible();

    const updated = await getCustomerDetails(page, customer.id);
    expect(updated.fullName).toBe(`E2E Edited Customer ${runId}`);
    expect(updated.phone).toBe(`03${digitsFromRunId(runId)}`);
    expect(updated.address).toBe(`Edited customer address ${runId}`);
    expect(updated.customerType).toBe("wholesale");
    expect(updated.isActive).toBe(true);
  });

  test("rejects duplicate phone when editing and preserves the saved customer details", async ({
    page,
  }) => {
    const existing = await createCustomer(page, runId, "Existing");
    const target = await createCustomer(page, runId, "Target");
    customerIds.push(existing.id, target.id);

    await gotoCustomerDetail(page, target.id, target.fullName);

    await page.getByRole("button", { name: "Chỉnh sửa" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("heading", { name: "Chỉnh sửa khách hàng" })).toBeVisible();
    await sheet.locator('input[name="fullName"]').fill(`Should Not Save ${runId}`);
    await sheet.locator('input[name="phone"]').fill(existing.phone);
    await sheet.locator('input[name="address"]').fill(`Should not save address ${runId}`);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/admin/customers/${target.id}`) &&
          response.request().method() === "PUT" &&
          response.status() === 409,
      ),
      sheet.getByRole("button", { name: "Lưu thay đổi" }).click(),
    ]);

    await expect(sheet.getByRole("heading", { name: "Chỉnh sửa khách hàng" })).toBeVisible();
    const unchanged = await getCustomerDetails(page, target.id);
    expect(unchanged.fullName).toBe(target.fullName);
    expect(unchanged.phone).toBe(target.phone);
    expect(unchanged.address).toBe(target.address);
  });

  test("shows order history on customer detail with links to order detail", async ({ page }) => {
    const customer = await createCustomer(page, runId);
    customerIds.push(customer.id);
    const order = await createCustomerOrderFixture(page, customer.id, runId);
    orderIds.push(order.id);

    await gotoCustomerDetail(page, customer.id, customer.fullName);

    await expect(page.getByText("Lịch sử đơn hàng", { exact: true })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: order.orderNumber })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "198.000" })).toBeVisible();

    await page
      .getByRole("link", { name: /Xem chi tiết/ })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`/orders/${order.id}$`));
    await expect(page.getByRole("heading", { name: `#${order.orderNumber}` })).toBeVisible();
  });
});
