import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  apiDelete,
  apiGet,
  apiPost,
  cleanupTestProducts,
  createProductWithVariants,
  findVariantIdBySku,
} from "../helpers/api";

test.describe("Inventory - Opening Stock UI", () => {
  test.describe.configure({ mode: "serial", timeout: 90000 });

  let runId: string;
  const createdUserIds: string[] = [];

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `opening-stock-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    for (const userId of createdUserIds.splice(0)) {
      await apiDelete(page, `/api/admin/users/${userId}`).catch(() => {});
    }
    await cleanupTestProducts(page, runId);
  });

  test("opening-stock owner can navigate, edit inline, and persist after reload", async ({
    page,
  }) => {
    const sku = `OS-UI-${runId}`;
    await createProductWithVariants(page, {
      name: `Opening Stock UI ${runId}`,
      variants: [{ sku, stockQuantity: 0, retailPrice: 120000, costPrice: 0 }],
    });

    await page.goto("/inventory");
    await expect(page.getByTestId("inventory-opening-stock-link")).toBeVisible();
    await expect(page.getByTestId("inventory-opening-stock-link")).toHaveAttribute(
      "href",
      "/inventory/opening-stock",
    );
    await page.goto("/inventory/opening-stock");
    await expect(page).toHaveURL(/\/inventory\/opening-stock$/);

    await page.getByTestId("opening-stock-search").fill(sku);
    await expect(page.getByTestId(`opening-stock-row-${sku}`)).toBeVisible({ timeout: 10000 });
    await page.getByTestId("opening-stock-effective-date").fill("2026-04-01");
    await page.getByTestId(`opening-stock-quantity-${sku}`).fill("10");
    await page.getByTestId(`opening-stock-unit-cost-${sku}`).fill("50000");
    await page.getByTestId(`opening-stock-note-${sku}`).fill("E2E opening count");
    const applyResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/api/admin/inventory/opening-stock/bulk") &&
        res.request().method() === "PATCH",
      { timeout: 30000 },
    );
    await page.getByTestId(`opening-stock-apply-${sku}`).click();
    expect((await applyResponse).ok()).toBe(true);

    await page.reload();
    await page.getByTestId("opening-stock-search").fill(sku);
    await expect(page.getByTestId(`opening-stock-quantity-${sku}`)).toHaveValue("10");
    await expect(page.getByTestId(`opening-stock-unit-cost-${sku}`)).toHaveValue("50000");

    const { data } = await apiGet<any>(
      page,
      `/api/admin/inventory/opening-stock/list?search=${encodeURIComponent(sku)}`,
    );
    expect(data.data[0]).toMatchObject({
      sku,
      openingQuantity: 10,
      openingUnitCost: 50000,
      currentOnHand: 10,
    });
  });

  test("opening-stock CSV preview applies valid files and blocks invalid rows", async ({
    page,
  }) => {
    const validSku = `OS-CSV-${runId}`;
    const invalidTargetSku = `OS-CSV-ERR-${runId}`;
    await createProductWithVariants(page, {
      name: `Opening Stock CSV ${runId}`,
      variants: [
        { sku: validSku, stockQuantity: 0, retailPrice: 90000, costPrice: 0 },
        { sku: invalidTargetSku, stockQuantity: 0, retailPrice: 90000, costPrice: 0 },
      ],
    });

    await page.goto("/inventory/opening-stock");
    await page.getByTestId("opening-stock-effective-date").fill("2026-04-01");
    await page.getByTestId("opening-stock-file-input").setInputFiles({
      name: "opening-stock-valid.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        `sku,openingQuantity,openingUnitCost,note\n${validSku},7,45000,CSV import\n`,
      ),
    });
    await expect(page.getByTestId("opening-stock-preview-modal")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("1 dòng hợp lệ · 0 dòng lỗi")).toBeVisible();
    await expect(page.getByTestId("opening-stock-preview-apply")).toBeEnabled();
    const applyResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/api/admin/inventory/opening-stock/bulk") &&
        res.request().method() === "PATCH",
      { timeout: 30000 },
    );
    await page.getByTestId("opening-stock-preview-apply").click();
    expect((await applyResponse).ok()).toBe(true);

    await page.getByTestId("opening-stock-file-input").setInputFiles({
      name: "opening-stock-invalid.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        [
          "sku,openingQuantity,openingUnitCost,note",
          `${invalidTargetSku},5,10000,ok`,
          `${invalidTargetSku},6,10000,duplicate`,
          `missing-${runId},3,10000,missing`,
          `${validSku},-1,10000,negative`,
        ].join("\n"),
      ),
    });
    await expect(page.getByTestId("opening-stock-preview-modal")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("opening-stock-error-row")).toHaveCount(3);
    await expect(page.getByTestId("opening-stock-preview-apply")).toBeDisabled();

    const { data } = await apiGet<any>(
      page,
      `/api/admin/inventory/opening-stock/list?search=${encodeURIComponent(invalidTargetSku)}`,
    );
    expect(data.data[0].openingQuantity).toBeNull();
  });

  test("opening-stock APIs are owner-only for manager and staff sessions", async ({ page }) => {
    const sku = `OS-ROLE-${runId}`;
    await createProductWithVariants(page, {
      name: `Opening Stock Role ${runId}`,
      variants: [{ sku, stockQuantity: 0, retailPrice: 100000, costPrice: 0 }],
    });
    const variantId = await findVariantIdBySku(page, sku);
    expect(variantId).toBeTruthy();
    const managerUsername = `manager-${runId}`;
    const staffUsername = `staff-${runId}`;
    const password = "password123";
    const managerCreate = await apiPost<{ success: boolean; profile: { id: string } }>(
      page,
      "/api/admin/users",
      {
        username: managerUsername,
        fullName: `Manager ${runId}`,
        role: "manager",
        password,
      },
    );
    const staffCreate = await apiPost<{ success: boolean; profile: { id: string } }>(
      page,
      "/api/admin/users",
      {
        username: staffUsername,
        fullName: `Staff ${runId}`,
        role: "staff",
        password,
      },
    );
    createdUserIds.push(managerCreate.data.profile.id, staffCreate.data.profile.id);

    const managerContext = await page.context().browser()!.newContext();
    const managerPage = await managerContext.newPage();
    const managerLogin = await managerPage.request.post("/api/admin/login", {
      data: { username: managerUsername, password },
    });
    expect(managerLogin.ok()).toBe(true);
    await managerPage.goto("/inventory/opening-stock");
    await expect(managerPage).not.toHaveURL(/\/inventory\/opening-stock$/, { timeout: 10000 });
    const managerRes = await managerPage.request.patch("/api/admin/inventory/opening-stock/bulk", {
      data: {
        entries: [{ variantId, quantity: 1, unitCost: 1, effectiveDate: "2026-04-01" }],
      },
    });
    expect(managerRes.status()).toBe(403);
    await managerContext.close();

    const staffContext = await page.context().browser()!.newContext();
    const staffPage = await staffContext.newPage();
    const staffLogin = await staffPage.request.post("/api/admin/login", {
      data: { username: staffUsername, password },
    });
    expect(staffLogin.ok()).toBe(true);
    await staffPage.goto("/inventory/opening-stock");
    await expect(staffPage).not.toHaveURL(/\/inventory\/opening-stock$/, { timeout: 10000 });
    const staffRes = await staffPage.request.get("/api/admin/inventory/opening-stock/list");
    expect(staffRes.status()).toBe(403);
    await staffContext.close();
  });
});
