import { expect, type Page } from "@playwright/test";

export function expectAdminSubdomain(page: Page) {
  const { hostname } = new URL(page.url());
  expect(hostname, `Expected admin host localhost or admin subdomain but got: ${hostname}`).toMatch(
    /^(localhost|127\.0\.0\.1|admin\.)/,
  );
}
