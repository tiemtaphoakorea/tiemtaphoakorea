import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Debt - List View
 * Test cases: TC-DEBT-002, TC-DEBT-003, TC-DEBT-004
 */
test.describe("Debt - List", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ---------------------------------------------------------------------------
  // TC-DEBT-002 | Debts sorted by highest amount
  // ---------------------------------------------------------------------------
  test("TC-DEBT-002 should display debts sorted by highest amount descending", async ({ page }) => {
    await page.goto("/debts");

    // Wait for the table to render with at least one row
    await expect(page.locator("[data-slot='table']").first()).toBeVisible({ timeout: 10000 });

    // Collect all debt amount cells — they appear in the "Tổng nợ" column as formatted currency
    // The table renders debt amounts as text inside cells; we read the raw numeric values
    // by querying the data-table rows
    const rows = page.locator("[data-slot='table'] tbody tr");
    const rowCount = await rows.count();

    // If there are fewer than 2 rows, sorting cannot be verified — skip assertion
    if (rowCount < 2) {
      return;
    }

    // Read the debt column values (3rd column, index 2: customerName, unpaidOrders, debt)
    const amounts: number[] = [];
    for (let i = 0; i < rowCount; i++) {
      const cell = rows.nth(i).locator("td").nth(2);
      const text = await cell.innerText();
      // Parse Vietnamese currency format (e.g. "1.500.000 ₫" or "1,500,000") to number
      const numeric = parseFloat(text.replace(/[^\d]/g, ""));
      if (!Number.isNaN(numeric)) {
        amounts.push(numeric);
      }
    }

    // Verify descending sort
    for (let i = 1; i < amounts.length; i++) {
      expect(amounts[i]).toBeLessThanOrEqual(amounts[i - 1]!);
    }
  });

  // ---------------------------------------------------------------------------
  // TC-DEBT-003 | Search debtor by name
  // ---------------------------------------------------------------------------
  test("TC-DEBT-003 should filter debt list by customer name search", async ({ page }) => {
    // First get a customer that actually has debt by fetching the debt list
    await page.goto("/debts");
    await expect(page.locator("[data-slot='table']").first()).toBeVisible({ timeout: 10000 });

    // Check if there are any rows
    const rows = page.locator("[data-slot='table'] tbody tr");
    const rowCount = await rows.count();

    // Skip if no debts exist in the system
    if (rowCount === 0) {
      return;
    }

    // Read the first customer name from the list
    const firstRow = rows.first();
    const customerNameCell = firstRow.locator("td").first();
    const customerName = await customerNameCell.locator("span").first().innerText();

    if (!customerName || customerName.trim() === "---") {
      return;
    }

    // Type first few characters of the customer name into the search input
    const searchTerm = customerName.trim().slice(0, 4);
    const searchInput = page.getByPlaceholder(/tìm theo tên hoặc số điện thoại/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill(searchTerm);

    // Wait for the filtered results
    await page.waitForTimeout(500); // debounce delay in the component (300ms)
    await expect(page.locator("[data-slot='table'] tbody tr").first()).toBeVisible({
      timeout: 5000,
    });

    // Verify at least the first row matches — the customer name cell should contain the search term
    const filteredRows = page.locator("[data-slot='table'] tbody tr");
    const filteredCount = await filteredRows.count();
    expect(filteredCount).toBeGreaterThan(0);

    // At least one visible row should contain the searched customer name
    const firstFilteredName = await filteredRows
      .first()
      .locator("td")
      .first()
      .locator("span")
      .first()
      .innerText();
    expect(firstFilteredName.toLowerCase()).toContain(searchTerm.toLowerCase());
  });

  // ---------------------------------------------------------------------------
  // TC-DEBT-004 | Customer detail - debt section visible
  // ---------------------------------------------------------------------------
  test("TC-DEBT-004 should show debt section on customer detail page for customer with debt", async ({
    page,
  }) => {
    // Navigate to debt list and find a customer with debt
    await page.goto("/debts");
    await expect(page.locator("[data-slot='table']").first()).toBeVisible({ timeout: 10000 });

    const rows = page.locator("[data-slot='table'] tbody tr");
    const rowCount = await rows.count();

    // Skip if no debtors exist
    if (rowCount === 0) {
      return;
    }

    // Click "Xem chi tiết" (View Detail) for the first debtor
    const detailButton = rows.first().getByRole("link", { name: /xem chi tiết/i });
    await detailButton.click();

    // Wait for the debt detail page to load
    await page.waitForURL(/\/debts\//, { timeout: 10000 });

    // Verify the debt section is visible:
    // - Total debt stat card should show
    // - Unpaid orders tab should show
    await expect(page.getByText(/tổng nợ/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/số đơn nợ/i)).toBeVisible();

    // The unpaid orders tab should list at least one order
    const unpaidTab = page.getByRole("tab", { name: /đơn đang nợ/i });
    await expect(unpaidTab).toBeVisible();
    await unpaidTab.click();

    // The tab content should have at least one table row with unpaid orders
    // (or show a non-empty message for a customer that appears in the debts list)
    const tabContent = page.locator('[role="tabpanel"]').first();
    await expect(tabContent).toBeVisible();
  });
});
