import type { Page } from "@playwright/test";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  apiGet,
  cleanupTestCategories,
  cleanupTestProducts,
  createCategory,
  createProductWithVariants,
  waitForProductVisible,
} from "../helpers/api";

type ProductDetailResponse = {
  product: {
    id: string;
    name: string;
    description: string | null;
    categoryId: string | null;
    basePrice: string | number;
    isActive: boolean;
    isFeatured: boolean;
    variants: Array<{
      id: string;
      name: string;
      sku: string;
      price: string | number;
      costPrice: string | number | null;
      onHand: number;
      lowStockThreshold: number | null;
    }>;
  };
};

function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function gotoProductDetail(page: Page, productId: string) {
  await page.goto(`/products/${productId}/edit`);
  await expect(page).toHaveURL(new RegExp(`/products/${productId}/edit$`));
  await expect(page.getByRole("heading", { name: "Chỉnh sửa sản phẩm" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lưu thay đổi" })).toBeVisible();
}

async function getProductDetail(page: Page, productId: string) {
  const { data } = await apiGet<ProductDetailResponse>(page, `/api/admin/products/${productId}`);
  return data.product;
}

async function createDetailProduct(page: Page, runId: string, categoryId?: string) {
  const created = await createProductWithVariants(page, {
    name: `E2E Detail Product ${runId}`,
    description: `Initial detail description ${runId}`,
    categoryId,
    basePrice: 150000,
    isActive: true,
    variants: [
      {
        sku: `DETAIL-A-${runId}`,
        attributes: { Color: "Black", Size: "M" },
        price: 175000,
        costPrice: 90000,
        onHand: 24,
        lowStockThreshold: 5,
      },
      {
        sku: `DETAIL-B-${runId}`,
        attributes: { Color: "White", Size: "L" },
        price: 185000,
        costPrice: 95000,
        onHand: 8,
        lowStockThreshold: 4,
      },
    ],
  });

  await waitForProductVisible(page, created.product.id);
  return created.product;
}

test.describe("Products - Detail page automation coverage", () => {
  test.describe.configure({ mode: "serial" });

  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-DETAIL-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestProducts(page, runId);
    await cleanupTestCategories(page, runId);
  });

  test("renders the edit page shell, product sections, variant table, and media controls", async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);
    const category = await createCategory(page, {
      name: `E2E Detail Category ${runId}`,
      slug: `e2e-detail-category-${runId.toLowerCase()}`,
    });
    const product = await createDetailProduct(page, runId, category.id);

    await gotoProductDetail(page, product.id);

    await expect(page.getByText(`E2E Detail Product ${runId}`, { exact: true })).toBeVisible();
    await expect(page.getByText("Thông tin chung", { exact: true })).toBeVisible();
    await expect(page.getByText("Bộ tạo biến thể tự động", { exact: true })).toBeVisible();
    await expect(page.getByText("Danh sách biến thể (2)", { exact: true })).toBeVisible();
    await expect(page.getByText("Hình ảnh sản phẩm", { exact: true })).toBeVisible();
    await expect(page.getByText("Phân loại", { exact: true })).toBeVisible();
    await expect(page.getByText("Trạng thái", { exact: true })).toBeVisible();

    await expect(page.locator('input[name="name"]')).toHaveValue(`E2E Detail Product ${runId}`);
    await expect(page.locator('textarea[name="description"]')).toHaveValue(
      `Initial detail description ${runId}`,
    );
    await expect(page.getByRole("combobox").filter({ hasText: category.name })).toBeVisible();

    for (const header of [
      "Tên biến thể",
      "SKU",
      "Giá bán",
      "Giá vốn",
      "Tồn kho",
      "Đang giữ",
      "Có thể bán",
      "Ngưỡng cảnh báo",
    ]) {
      await expect(page.getByRole("columnheader", { name: header })).toBeVisible();
    }
    const skuInputs = page.locator('input[placeholder="SKU-..."]');
    await expect(skuInputs).toHaveCount(2);
    await expect(page.locator(`input[value="DETAIL-A-${runId}"]`)).toHaveCount(1);
    await expect(page.locator(`input[value="DETAIL-B-${runId}"]`)).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Hủy bỏ" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Lưu thay đổi" })).toBeEnabled();
    await expect(page.locator("text=Unhandled Runtime Error")).toHaveCount(0);
    await expect(page.locator("text=Build Error")).toHaveCount(0);
    expect(consoleErrors).toEqual([]);
  });

  test("protects unsaved edits before navigating away", async ({ page }) => {
    const product = await createDetailProduct(page, runId);

    await gotoProductDetail(page, product.id);
    await page.locator('input[name="name"]').fill(`E2E Detail Unsaved ${runId}`);
    await page.getByRole("button", { name: "Hủy bỏ" }).click();

    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Có thay đổi chưa lưu" })).toBeVisible();
    await page.getByRole("button", { name: "Tiếp tục chỉnh sửa" }).click();
    await expect(page).toHaveURL(new RegExp(`/products/${product.id}/edit$`));

    await page.getByRole("button", { name: "Hủy bỏ" }).click();
    await page.getByRole("button", { name: "Rời khỏi trang" }).click();
    await expect(page).toHaveURL(/\/products$/);
  });

  test("updates product info, category, and status flags from the detail page", async ({
    page,
  }) => {
    const originalCategory = await createCategory(page, {
      name: `E2E Detail Original ${runId}`,
      slug: `e2e-detail-original-${runId.toLowerCase()}`,
    });
    const nextCategory = await createCategory(page, {
      name: `E2E Detail Next ${runId}`,
      slug: `e2e-detail-next-${runId.toLowerCase()}`,
    });
    const product = await createDetailProduct(page, runId, originalCategory.id);
    const updatedName = `E2E Detail Updated ${runId}`;

    await gotoProductDetail(page, product.id);
    await page.locator('input[name="name"]').fill(updatedName);
    await page.locator('textarea[name="description"]').fill(`Updated detail description ${runId}`);
    await page.locator('input[name="basePrice"]').fill("199000");

    await page.getByRole("combobox").filter({ hasText: originalCategory.name }).click();
    await page.getByLabel("Tìm danh mục").fill(nextCategory.name);
    await page.getByRole("button", { name: nextCategory.name }).click();

    await page
      .getByText("Hiển thị sản phẩm", { exact: true })
      .locator("..")
      .locator("..")
      .getByRole("switch")
      .click();
    await page
      .getByText("Bán chạy / Nổi bật", { exact: true })
      .locator("..")
      .locator("..")
      .getByRole("switch")
      .click();

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/admin/products/${product.id}`) &&
          response.request().method() === "PUT" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Lưu thay đổi" }).click(),
    ]);
    await expect(page).toHaveURL(/\/products$/);

    const updated = await getProductDetail(page, product.id);
    expect(updated.name).toBe(updatedName);
    expect(updated.description).toBe(`Updated detail description ${runId}`);
    expect(Number(updated.basePrice)).toBe(199000);
    expect(updated.categoryId).toBe(nextCategory.id);
    expect(updated.isActive).toBe(false);
    expect(updated.isFeatured).toBe(true);
  });

  test("edits existing variants and adds a manual variant from the detail page", async ({
    page,
  }) => {
    const product = await createDetailProduct(page, runId);
    const newVariantSku = `DETAIL-C-${runId}`;

    await gotoProductDetail(page, product.id);

    const firstVariantRow = page
      .locator(`input[value="DETAIL-A-${runId}"]`)
      .locator("xpath=ancestor::tr");
    await firstVariantRow.locator("input").nth(0).fill("Black - XL");
    await firstVariantRow.getByTestId("variant-price-0").fill("210000");
    await firstVariantRow.getByTestId("variant-cost-0").fill("120000");
    await firstVariantRow.getByTestId("variant-stock-0").fill("31");
    await firstVariantRow.getByTestId("variant-low-stock-threshold-0").fill("7");

    await page.getByRole("button", { name: "Thêm thủ công" }).click();
    const newVariantRow = page.locator("table tbody tr").nth(2);
    await expect(newVariantRow).toBeVisible();
    const newVariantInputs = newVariantRow.locator("input");
    await newVariantInputs.nth(0).fill("Manual Variant");
    await newVariantInputs.nth(1).fill(newVariantSku);
    await newVariantRow.getByTestId("variant-price-2").fill("230000");
    await newVariantRow.getByTestId("variant-cost-2").fill("130000");
    await newVariantRow.getByTestId("variant-stock-2").fill("12");
    await newVariantRow.getByTestId("variant-low-stock-threshold-2").fill("3");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/admin/products/${product.id}`) &&
          response.request().method() === "PUT" &&
          response.status() === 200,
      ),
      page.getByRole("button", { name: "Lưu thay đổi" }).click(),
    ]);
    await expect(page).toHaveURL(/\/products$/);

    const updated = await getProductDetail(page, product.id);
    const editedVariant = updated.variants.find((variant) => variant.sku === `DETAIL-A-${runId}`);
    const addedVariant = updated.variants.find((variant) => variant.sku === newVariantSku);

    expect(editedVariant).toMatchObject({
      name: "Black - XL",
      onHand: 31,
      lowStockThreshold: 7,
    });
    expect(Number(editedVariant?.price)).toBe(210000);
    expect(Number(editedVariant?.costPrice)).toBe(120000);
    expect(addedVariant).toMatchObject({
      name: "Manual Variant",
      sku: newVariantSku,
      onHand: 12,
      lowStockThreshold: 3,
    });
    expect(Number(addedVariant?.price)).toBe(230000);
    expect(Number(addedVariant?.costPrice)).toBe(130000);
  });
});
