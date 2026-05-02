import { defineConfig, devices } from "@playwright/test";
import { ADMIN_BASE_URL } from "@workspace/shared/constants";

/**
 * E2E Test Configuration
 * Based on qa-testing skill guidelines
 */
export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Workers can be increased now that product (and other) specs use testRunId and isolate data
  workers: process.env.CI ? 2 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: ADMIN_BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  //   webServer: {
  //     command: "npm run dev",
  //     url: "http://localhost:3000",
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120000,
  //   },
});
