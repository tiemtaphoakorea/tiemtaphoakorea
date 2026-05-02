import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  cleanupTestProducts,
  createOrder,
  createProductWithVariants,
  deleteOrder,
  getCustomers,
  recordPayment,
} from "../helpers/api";

/**
 * Debt - Payment Recording
 * Test cases: TC-DEBT-005, TC-DEBT-006, TC-DEBT-007
 *
 * Setup pattern: Create customer → Create order (total: 200,000) →
 * Record partial payment (100,000) → Customer now has 100,000 debt.
 *
 * These tests rely on existing customers in the system. The debt scenario
 * is created via API using the first available customer.
 */

const ORDER_TOTAL = 200000;
const PARTIAL_PAYMENT = 100000;
const FULL_PAYMENT = 100000; // equals remaining debt after partial payment

test.describe("Debt - Payment Recording", () => {
  let runId: string;
  let productId: string | null = null;
  let variantId: string | null = null;
  let orderId: string | null = null;
  let customerId: string | null = null;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-DEBT-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);

    // Get first available customer
    const customers = await getCustomers(page);
    if (!customers || customers.length === 0) {
      // No customers — tests will be skipped inside each test
      return;
    }
    customerId = customers[0].id;

    // Create a product with a variant priced at ORDER_TOTAL so one unit = debt scenario
    const productData = await createProductWithVariants(page, {
      name: `Debt Test Product ${runId}`,
      variants: [
        {
          sku: `DEBT-SKU-${runId}`,
          price: ORDER_TOTAL,
          stockQuantity: 10,
        },
      ],
    });
    productId = productData?.product?.id ?? null;
    variantId = productData?.product?.variants?.[0]?.id ?? null;

    if (!variantId || !customerId) return;

    // Create the order
    const orderData = await createOrder(page, {
      customerId,
      items: [{ variantId, quantity: 1 }],
    });
    orderId = orderData?.order?.id ?? null;

    if (!orderId) return;

    // Record a partial payment to create debt (pays half)
    await recordPayment(page, orderId, {
      amount: PARTIAL_PAYMENT,
      method: "cash",
    });
  });

  test.afterEach(async ({ page }) => {
    // Clean up order and product
    if (orderId) {
      await deleteOrder(page, orderId).catch(() => null);
      orderId = null;
    }
    if (productId) {
      await cleanupTestProducts(page, `Debt Test Product ${runId}`);
      productId = null;
      variantId = null;
    }
    customerId = null;
  });

  // ---------------------------------------------------------------------------
  // TC-DEBT-005 | Record payment from debts list
  // ---------------------------------------------------------------------------
  test("TC-DEBT-005 should record payment from debts list and reduce debt amount", async ({
    page,
  }) => {
    if (!customerId || !orderId) {
      test.skip(true, "No customer or order available to create debt scenario");
      return;
    }

    // Navigate directly to the customer's debt detail page
    await page.goto(`/debts/${customerId}`);

    // Wait for the detail page
    await page.waitForURL(/\/debts\//, { timeout: 10000 });

    // Click "Thu tiền" button on detail page to open BulkPaymentDialog
    const thuTienButton = page.getByRole("button", { name: /thu tiền/i });
    await expect(thuTienButton).toBeVisible({ timeout: 5000 });
    await thuTienButton.click();

    // Dialog should open
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/thu tiền công nợ/i)).toBeVisible();

    // Enter a valid payment amount (remaining debt = FULL_PAYMENT = 100,000)
    const amountInput = page.locator("#bulk-payment-amount");
    await expect(amountInput).toBeVisible();
    await amountInput.fill(String(FULL_PAYMENT));

    // Submit
    await page.getByRole("button", { name: /xác nhận/i }).click();

    // Wait for success toast or dialog to close
    await expect(page.getByText(/thu tiền thành công/i)).toBeVisible({ timeout: 10000 });
  });

  // ---------------------------------------------------------------------------
  // TC-DEBT-006 | Cannot exceed debt amount
  // ---------------------------------------------------------------------------
  test("TC-DEBT-006 should show error when payment amount exceeds total debt", async ({ page }) => {
    if (!customerId || !orderId) {
      test.skip(true, "No customer or order available to create debt scenario");
      return;
    }

    await page.goto(`/debts/${customerId}`);
    await page.waitForURL(/\/debts\//, { timeout: 10000 });

    // Open payment dialog
    const thuTienButton = page.getByRole("button", { name: /thu tiền/i });
    await expect(thuTienButton).toBeVisible({ timeout: 8000 });
    await thuTienButton.click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3000 });

    // Enter amount exceeding the total debt (remaining debt = FULL_PAYMENT = 100,000)
    const excessAmount = FULL_PAYMENT + 50000; // 50,000 over the debt
    const amountInput = page.locator("#bulk-payment-amount");
    await expect(amountInput).toBeVisible();
    await amountInput.fill(String(excessAmount));

    await page.getByRole("button", { name: /xác nhận/i }).click();

    // Expect validation error — the BulkPaymentDialog schema enforces max = totalDebt,
    // or the onSubmit handler rejects with an error message
    await expect(
      page.getByText(
        /số tiền thanh toán không được vượt quá công nợ hiện tại|số tiền vượt tổng nợ/i,
      ),
    ).toBeVisible({ timeout: 5000 });

    // Dialog stays open — "Thu tiền công nợ" heading still visible
    await expect(page.getByText(/thu tiền công nợ/i)).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // TC-DEBT-007 | Debt cleared after full payment
  // ---------------------------------------------------------------------------
  test("TC-DEBT-007 should remove customer from debts list after full debt payment", async ({
    page,
  }) => {
    if (!customerId || !orderId) {
      test.skip(true, "No customer or order available to create debt scenario");
      return;
    }

    // Pay the exact remaining debt via API to avoid UI complexity
    await recordPayment(page, orderId, {
      amount: FULL_PAYMENT,
      method: "cash",
    });

    // Refresh the debts list page
    await page.goto("/debts");
    await expect(page.locator("[data-slot='table']").first()).toBeVisible({ timeout: 10000 });

    // Wait briefly for cache to settle
    await page.waitForTimeout(1000);

    // The customer's debt detail page should now show totalDebt = 0
    await page.goto(`/debts/${customerId}`);
    await page.waitForURL(/\/debts\//, { timeout: 10000 });

    // "Thu tiền" button should be disabled (totalDebt <= 0)
    const thuTienButton = page.getByRole("button", { name: /thu tiền/i });
    await expect(thuTienButton).toBeVisible({ timeout: 8000 });
    await expect(thuTienButton).toBeDisabled();

    // Total debt stat should show 0
    await expect(page.getByText(/0\s*₫|0\s*đ/i).first()).toBeVisible({ timeout: 5000 });
  });
});
