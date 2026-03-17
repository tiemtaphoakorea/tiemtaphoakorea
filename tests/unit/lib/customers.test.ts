import { describe, expect, it } from "vitest";
import { K_CUSTOMERS } from "@/lib/customers";

describe("customers fixtures", () => {
  it("should expose sample customers", () => {
    expect(K_CUSTOMERS.length).toBeGreaterThan(0);
    expect(K_CUSTOMERS[0]).toHaveProperty("email");
    expect(K_CUSTOMERS[0]).toHaveProperty("status");
  });
});
