import type { Page } from "@playwright/test";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { cleanupTestProducts, createProductWithVariants } from "../helpers/api";

const productSearch = (page: Page) => page.getByPlaceholder("Tìm tên, mã SP...");

async function waitForProductsListResponse(
  page: Page,
  params: { search?: string; limit?: string; page?: string },
) {
  await page.waitForResponse((response) => {
    if (response.status() !== 200) return false;
    const url = new URL(response.url());
    if (!url.pathname.endsWith("/api/admin/products")) return false;
    if (params.search !== undefined && url.searchParams.get("search") !== params.search) {
      return false;
    }
    if (params.limit !== undefined && url.searchParams.get("limit") !== params.limit) {
      return false;
    }
    if (params.page !== undefined && url.searchParams.get("page") !== params.page) {
      return false;
    }
    return url.searchParams.get("include") !== "variants";
  });
}

async function gotoProducts(page: Page) {
  await page.goto("/products");
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByRole("tab", { name: "Tất cả" })).toBeVisible();
  await expect(productSearch(page)).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
}

async function searchProducts(page: Page, term: string, limit = "20") {
  const responsePromise = waitForProductsListResponse(page, { search: term, limit });
  await productSearch(page).fill(term);
  await responsePromise;
  await expect(productSearch(page)).toHaveValue(term);
}

async function seedStockStatusProducts(page: Page, runId: string) {
  const products = {
    inStock: `E2E FullPage In Stock ${runId}`,
    lowStock: `E2E FullPage Low Stock ${runId}`,
    outOfStock: `E2E FullPage Out Stock ${runId}`,
  };

  await createProductWithVariants(page, {
    name: products.inStock,
    variants: [
      {
        sku: `FULL-IN-${runId}`,
        stockQuantity: 50,
        onHand: 50,
        lowStockThreshold: 10,
        price: 100000,
      },
    ],
  });
  await createProductWithVariants(page, {
    name: products.lowStock,
    variants: [
      {
        sku: `FULL-LOW-${runId}`,
        stockQuantity: 3,
        onHand: 3,
        lowStockThreshold: 10,
        price: 100000,
      },
    ],
  });
  await createProductWithVariants(page, {
    name: products.outOfStock,
    variants: [
      {
        sku: `FULL-OUT-${runId}`,
        stockQuantity: 0,
        onHand: 0,
        lowStockThreshold: 10,
        price: 100000,
      },
    ],
  });

  return products;
}

test.describe("Products - Full page automation coverage", () => {
  test.describe.configure({ mode: "serial" });

  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-FULL-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestProducts(page, runId);
  });

  test("renders the products page shell, table columns, and create navigation", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await gotoProducts(page);

    await expect(page.locator('a[href="/products"]').filter({ hasText: "Sản phẩm" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Thêm sản phẩm/i })).toHaveAttribute(
      "href",
      "/products/new",
    );

    for (const tabName of ["Tất cả", "Còn hàng", "Sắp hết", "Hết hàng"]) {
      await expect(page.getByRole("tab", { name: tabName })).toBeVisible();
    }

    for (const header of [
      "Ảnh",
      "Tên sản phẩm",
      "Loại",
      "Nhãn hiệu",
      "Có thể bán",
      "Tồn kho",
      "Ngày tạo",
    ]) {
      await expect(page.getByRole("columnheader", { name: header })).toBeVisible();
    }

    await expect(page.getByRole("button", { name: "Previous page" })).toBeDisabled();
    await expect(
      page.locator("span").filter({ hasText: /\/ trang · Tổng \d+ sản phẩm/ }),
    ).toBeVisible();
    await expect(page.locator("text=Unhandled Runtime Error")).toHaveCount(0);
    await expect(page.locator("text=Build Error")).toHaveCount(0);
    expect(consoleErrors).toEqual([]);
  });

  test("filters by stock status and combines each tab with search", async ({ page }) => {
    const products = await seedStockStatusProducts(page, runId);

    await gotoProducts(page);
    await searchProducts(page, runId);

    await expect(page.getByText(products.inStock, { exact: true })).toBeVisible();
    await expect(page.getByText(products.lowStock, { exact: true })).toBeVisible();
    await expect(page.getByText(products.outOfStock, { exact: true })).toBeVisible();

    await page.getByRole("tab", { name: "Còn hàng" }).click();
    await expect(page.getByText(products.inStock, { exact: true })).toBeVisible();
    await expect(page.getByText(products.lowStock, { exact: true })).toHaveCount(0);
    await expect(page.getByText(products.outOfStock, { exact: true })).toHaveCount(0);

    await page.getByRole("tab", { name: "Sắp hết" }).click();
    await expect(page.getByText(products.lowStock, { exact: true })).toBeVisible();
    await expect(page.getByText(products.inStock, { exact: true })).toHaveCount(0);
    await expect(page.getByText(products.outOfStock, { exact: true })).toHaveCount(0);

    await page.getByRole("tab", { name: "Hết hàng" }).click();
    await expect(page.getByText(products.outOfStock, { exact: true })).toBeVisible();
    await expect(page.getByText(products.inStock, { exact: true })).toHaveCount(0);
    await expect(page.getByText(products.lowStock, { exact: true })).toHaveCount(0);

    await page.getByRole("tab", { name: "Tất cả" }).click();
    await expect(page.getByText(products.inStock, { exact: true })).toBeVisible();
    await expect(page.getByText(products.lowStock, { exact: true })).toBeVisible();
    await expect(page.getByText(products.outOfStock, { exact: true })).toBeVisible();

    await searchProducts(page, `FULL-LOW-${runId}`);
    await expect(page.getByText(products.lowStock, { exact: true })).toBeVisible();
    await expect(page.getByText(products.inStock, { exact: true })).toHaveCount(0);
    await expect(page.getByText(products.outOfStock, { exact: true })).toHaveCount(0);

    await searchProducts(page, `${runId}-NO-MATCH`);
    await expect(page.getByRole("cell", { name: "Không tìm thấy sản phẩm" })).toBeVisible();
  });

  test("supports row selection, select-all on the current page, and clearing selection", async ({
    page,
  }) => {
    const products = await seedStockStatusProducts(page, runId);

    await gotoProducts(page);
    await searchProducts(page, runId);
    await expect(page.getByText(products.inStock, { exact: true })).toBeVisible();
    await expect(page.getByText(products.lowStock, { exact: true })).toBeVisible();
    await expect(page.getByText(products.outOfStock, { exact: true })).toBeVisible();

    await page.getByLabel(`Chọn ${products.inStock}`).check();
    await expect(page.getByText("Đã chọn")).toBeVisible();
    await expect(page.getByRole("button", { name: "Xóa 1 sản phẩm" })).toBeVisible();
    await expect(page.getByLabel("Chọn tất cả")).not.toBeChecked();

    await page.getByLabel("Chọn tất cả").click();
    await expect(page.getByRole("button", { name: "Xóa 3 sản phẩm" })).toBeVisible();
    await expect(page.getByLabel(`Chọn ${products.inStock}`)).toBeChecked();
    await expect(page.getByLabel(`Chọn ${products.lowStock}`)).toBeChecked();
    await expect(page.getByLabel(`Chọn ${products.outOfStock}`)).toBeChecked();

    await page.getByRole("button", { name: "Bỏ chọn" }).click();
    await expect(page.getByText("Đã chọn")).toHaveCount(0);
    await expect(page.getByLabel(`Chọn ${products.inStock}`)).not.toBeChecked();
  });

  test("opens row actions and protects destructive actions behind confirmation", async ({
    page,
  }) => {
    const products = await seedStockStatusProducts(page, runId);

    await gotoProducts(page);
    await searchProducts(page, products.inStock);
    const row = page.getByRole("row").filter({ hasText: products.inStock });
    await expect(row).toBeVisible();

    await row.getByRole("button").click();
    await expect(page.getByRole("menuitem", { name: "Chỉnh sửa" })).toBeVisible();
    await page.getByRole("menuitem", { name: "Xóa" }).click();

    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Xóa sản phẩm?" })).toBeVisible();
    await expect(
      page.getByRole("alertdialog").getByText(products.inStock, { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Hủy" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByText(products.inStock, { exact: true })).toBeVisible();
  });

  test("paginates isolated search results and changes page size", async ({ page }) => {
    const productNames = Array.from(
      { length: 12 },
      (_, i) => `E2E FullPage Page ${String(i + 1).padStart(2, "0")} ${runId}`,
    );

    for (const [index, name] of productNames.entries()) {
      await createProductWithVariants(page, {
        name,
        variants: [
          {
            sku: `FULL-PAGE-${index}-${runId}`,
            stockQuantity: 20,
            onHand: 20,
            lowStockThreshold: 5,
            price: 100000,
          },
        ],
      });
    }

    await gotoProducts(page);
    await searchProducts(page, runId);
    await expect(page.getByText("Tổng 12 sản phẩm")).toBeVisible();

    await Promise.all([
      waitForProductsListResponse(page, { search: runId, limit: "10", page: "1" }),
      page.locator("select").selectOption("10"),
    ]);
    await expect(page.getByText("Tổng 12 sản phẩm")).toBeVisible();
    await expect(page.getByRole("button", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("button", { name: "Next page" })).toBeEnabled();

    await Promise.all([
      waitForProductsListResponse(page, { search: runId, limit: "10", page: "2" }),
      page.getByRole("button", { name: "Next page" }).click(),
    ]);
    await expect(page.getByRole("button", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    const visibleRowsOnSecondPage = await page.locator("table tbody tr").count();
    expect(visibleRowsOnSecondPage).toBe(2);

    await page.locator("select").selectOption("20");
    await expect(page.getByRole("button", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled();
    await expect(page.locator("table tbody tr")).toHaveCount(12);
  });
});
