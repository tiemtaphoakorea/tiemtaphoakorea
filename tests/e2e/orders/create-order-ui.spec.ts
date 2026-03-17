import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  apiPost,
  createProductWithVariants,
  getCustomers,
  getProductsWithVariants,
} from "../helpers/api";

/**
 * Order - Create (UI flow)
 * E2E test tạo đơn hàng qua giao diện: /orders/new
 * - Chọn khách hàng (tìm theo SĐT)
 * - Thêm sản phẩm (chọn sản phẩm + phân loại, bấm Thêm)
 * - Bấm "Tạo đơn hàng" và kiểm tra redirect + nội dung trang chi tiết đơn
 */
test.describe("Order - Create (UI)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    // Đảm bảo có customer + product để chọn trên UI (seed e2e chỉ có users)
    const customers = await getCustomers(page, TEST_CUSTOMERS.primary.phone);
    if (customers.length === 0) {
      await apiPost<any>(page, "/api/admin/customers", {
        fullName: TEST_CUSTOMERS.primary.fullName,
        phone: TEST_CUSTOMERS.primary.phone,
        customerType: "retail",
      });
    }
    const products = await getProductsWithVariants(page);
    const hasProduct = products.some((p: any) =>
      p.variants?.some((v: any) => v.sku === TEST_PRODUCTS.testTshirt.sku),
    );
    if (!hasProduct) {
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
  });

  test("should create order via UI: select customer, add product, submit", async ({ page }) => {
    await page.goto("/orders/new");

    await expect(page.getByRole("heading", { name: /Tạo đơn hàng mới/i })).toBeVisible();

    // --- Chọn khách hàng (tìm theo SĐT) ---
    await page.locator('button[role="combobox"]').first().click();
    await page.getByPlaceholder(/Tìm theo tên hoặc SĐT/i).fill(TEST_CUSTOMERS.primary.phone);
    await page.waitForTimeout(500); // debounce 300ms + load
    await page
      .getByRole("option")
      .filter({ hasText: TEST_CUSTOMERS.primary.phone })
      .first()
      .click();

    await expect(page.getByText(TEST_CUSTOMERS.primary.fullName)).toBeVisible();

    // --- Thêm sản phẩm: chọn sản phẩm gốc (sau khi chọn khách, chỉ còn 1 combobox = product) ---
    await page.locator('button[role="combobox"]').first().click();
    await page.getByPlaceholder(/Tìm tên hoặc SKU/i).fill(TEST_PRODUCTS.testTshirt.sku);
    await page.waitForTimeout(500);
    await page
      .getByRole("option")
      .filter({ hasText: TEST_PRODUCTS.testTshirt.name })
      .first()
      .click();

    // Chọn phân loại (biến thể)
    await page
      .getByRole("combobox")
      .filter({ has: page.locator("text=Chọn phân loại") })
      .click();
    await page.getByRole("option").first().click();

    await page.getByRole("button", { name: /^Thêm$/ }).click();

    // Có ít nhất một dòng trong bảng đơn (sản phẩm đã thêm)
    await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(1);

    // --- Tạo đơn hàng ---
    await page.getByRole("button", { name: /Tạo đơn hàng/i }).click();

    // Chuyển sang trang chi tiết đơn: /orders/[id]
    await expect(page).toHaveURL(/\/orders\/[^/]+$/);
    // Trang chi tiết đơn có mã đơn (format ORD-...) hoặc toast thành công
    await expect(
      page.getByText(/ORD-\d{8}-[A-Z0-9]{6}/).or(page.getByText(/Tạo đơn hàng thành công/i)),
    ).toBeVisible({ timeout: 10000 });
  });
});
