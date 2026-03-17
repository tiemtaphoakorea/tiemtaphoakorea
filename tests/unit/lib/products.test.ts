import { describe, expect, it } from "vitest";
import { K_PRODUCTS } from "@/lib/products";

describe("products fixtures", () => {
  it("should expose sample products", () => {
    expect(K_PRODUCTS.length).toBeGreaterThan(0);
    expect(K_PRODUCTS[0]).toHaveProperty("name");
    expect(K_PRODUCTS[0]).toHaveProperty("price");
  });
});
