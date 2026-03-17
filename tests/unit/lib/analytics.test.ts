import { describe, expect, it } from "vitest";
import { K_CATEGORY_DATA, K_REVENUE_DATA, K_TOP_PRODUCTS } from "@/lib/analytics";

describe("analytics fixtures", () => {
  it("should expose revenue data", () => {
    expect(K_REVENUE_DATA.length).toBeGreaterThan(0);
    expect(K_REVENUE_DATA[0]).toHaveProperty("month");
    expect(K_REVENUE_DATA[0]).toHaveProperty("revenue");
  });

  it("should expose category data", () => {
    expect(K_CATEGORY_DATA.length).toBeGreaterThan(0);
    expect(K_CATEGORY_DATA[0]).toHaveProperty("category");
    expect(K_CATEGORY_DATA[0]).toHaveProperty("sales");
  });

  it("should expose top products", () => {
    expect(K_TOP_PRODUCTS.length).toBeGreaterThan(0);
    expect(K_TOP_PRODUCTS[0]).toHaveProperty("name");
    expect(K_TOP_PRODUCTS[0]).toHaveProperty("growth");
  });
});
