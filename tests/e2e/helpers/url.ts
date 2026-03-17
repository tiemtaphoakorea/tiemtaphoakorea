import { expect, type Page } from "@playwright/test";

export function expectAdminSubdomain(page: Page) {
  const { hostname } = new URL(page.url());
  expect(hostname, `Expected admin subdomain but got: ${hostname}`).toMatch(/^admin\./);
}
