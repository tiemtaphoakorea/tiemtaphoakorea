import { expect, loginAsAdmin, test } from "../fixtures/auth";

test.describe("Receipts - supplier payment after completion", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should allow paying supplier debt after receipt is completed", async ({ page }) => {
    const runId = `E2E-RECEIPT-PAY-${Date.now()}`;
    const suppliersResponse = await page.request.get("/api/admin/suppliers?limit=200");
    expect(suppliersResponse.ok()).toBeTruthy();
    const suppliersBody = await suppliersResponse.json();
    const supplier = suppliersBody.data?.find((s: any) => s.id && s.name);
    expect(supplier?.id).toBeTruthy();

    const productsResponse = await page.request.get("/api/admin/products?include=variants");
    expect(productsResponse.ok()).toBeTruthy();
    const productsBody = await productsResponse.json();
    const product = productsBody.products?.find(
      (p: any) => Array.isArray(p.variants) && p.variants.length > 0,
    );
    const variant = product?.variants?.find((v: any) => v.sku) ?? product?.variants?.[0];
    expect(variant?.id).toBeTruthy();

    const createReceiptResponse = await page.request.post("/api/admin/receipts", {
      data: {
        supplierId: supplier.id,
        invoiceRef: `INV-${runId}`,
        note: `Receipt ${runId}`,
        items: [
          {
            variantId: variant.id,
            quantity: 1,
            unitCost: "10000",
          },
        ],
      },
    });
    expect(createReceiptResponse.ok()).toBeTruthy();
    const { receipt } = await createReceiptResponse.json();
    expect(receipt?.id).toBeTruthy();

    const completeReceiptResponse = await page.request.post(
      `/api/admin/receipts/${receipt.id}/complete`,
    );
    expect(completeReceiptResponse.ok()).toBeTruthy();

    await page.goto(`/receipts/${receipt.id}`);
    await expect(page.getByRole("heading", { name: receipt.code })).toBeVisible();
    await expect(page.getByText("Hoàn thành")).toBeVisible();
    await expect(page.getByText("Còn phải trả")).toBeVisible();

    await page.getByRole("button", { name: "Thanh toán" }).click();
    await expect(page.getByRole("heading", { name: "Ghi nhận thanh toán" })).toBeVisible();

    await page.getByRole("button", { name: "Chuyển khoản" }).click();
    await page.getByPlaceholder("Số giao dịch / mã CK").fill(`REF-${runId}`);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/admin/payouts") && response.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Xác nhận" }).click(),
    ]);

    await expect(page.getByText("Đã thanh toán")).toBeVisible();
    await expect(page.getByText("0đ").last()).toBeVisible();
  });
});
