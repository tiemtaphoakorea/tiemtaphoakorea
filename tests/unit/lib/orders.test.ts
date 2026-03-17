import { describe, expect, it } from "vitest";
import { K_ORDERS } from "@/lib/orders";

describe("orders fixtures", () => {
  it("should expose sample orders", () => {
    expect(K_ORDERS.length).toBeGreaterThan(0);
    expect(K_ORDERS[0]).toHaveProperty("id");
    expect(K_ORDERS[0]).toHaveProperty("customer");
  });
});
