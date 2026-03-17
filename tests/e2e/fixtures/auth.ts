import { test as base, expect, type Page } from "@playwright/test";
import { expectAdminSubdomain } from "../helpers/url";

/**
 * Auth fixtures for E2E tests
 * Provides pre-authenticated page contexts
 */

// Test credentials from environment or defaults for testing
const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "password123";
const STAFF_USERNAME = process.env.E2E_STAFF_USERNAME || "staff";
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD || "password123";
const MANAGER_USERNAME = process.env.E2E_MANAGER_USERNAME || "manager";
const MANAGER_PASSWORD = process.env.E2E_MANAGER_PASSWORD || "password123";

type AuthFixtures = {
  adminPage: Page;
  staffPage: Page;
  managerPage: Page;
};

/**
 * Extended test with authentication helpers
 */
export const test = base.extend<AuthFixtures>({
  adminPage: async ({ page }, use) => {
    await login(page, ADMIN_USERNAME, ADMIN_PASSWORD);
    await use(page);
  },
  staffPage: async ({ page }, use) => {
    await login(page, STAFF_USERNAME, STAFF_PASSWORD);
    await use(page);
  },
  managerPage: async ({ page }, use) => {
    await login(page, MANAGER_USERNAME, MANAGER_PASSWORD);
    await use(page);
  },
});

export { expect };

/**
 * Helper: Login as admin
 */
export async function loginAsAdmin(
  page: Page,
  username = ADMIN_USERNAME,
  password = ADMIN_PASSWORD,
) {
  await login(page, username, password);
}

export async function loginAsStaff(page: Page) {
  await login(page, STAFF_USERNAME, STAFF_PASSWORD);
}

export async function loginAsManager(page: Page) {
  await login(page, MANAGER_USERNAME, MANAGER_PASSWORD);
}

export async function login(page: Page, username: string, password: string) {
  await page.goto("/login");
  expectAdminSubdomain(page);
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);

  // Wait for login API response instead of networkidle
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/admin/login") && response.status() === 200,
    { timeout: 30000 },
  );

  await page.click('button[type="submit"]');
  const response = await responsePromise;

  // Verify the API response is successful
  const responseBody = await response.json();
  if (!responseBody.success) {
    throw new Error(`Login API returned success=false: ${responseBody.error || "Unknown error"}`);
  }

  // Wait for navigation to complete after successful login
  // Use waitForURL instead of networkidle to avoid timeout issues
  await page.waitForURL(/\/(dashboard)?$/, { timeout: 30000 }).catch(() => {
    // If URL doesn't change, that's okay - might already be on dashboard
  });
  await page.waitForTimeout(1000);

  // Verify cookie with retry logic - increased retries and delay
  let retries = 10;
  let cookies = await page.context().cookies();
  while (retries > 0 && !cookies.find((c) => c.name === "admin_session")) {
    await page.waitForTimeout(1000);
    cookies = await page.context().cookies();
    retries--;
  }

  if (!cookies.find((c) => c.name === "admin_session")) {
    throw new Error(
      "admin_session cookie not set after login. Available cookies: " +
        cookies.map((c) => c.name).join(", "),
    );
  }
}
