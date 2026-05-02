import {
  FULFILLMENT_STATUS,
  INTERNAL_CHAT_ROLES,
  INTERNAL_ROLES,
  PRODUCT_SORT,
  ROLE,
  VARIANT_ID_PREFIX,
} from "@workspace/shared/constants";
import { describe, expect, it } from "vitest";

describe("constants", () => {
  it("should expose role constants", () => {
    expect(ROLE.OWNER).toBe("owner");
    expect(ROLE.STAFF).toBe("staff");
  });

  it("should align internal roles", () => {
    expect(INTERNAL_ROLES).toEqual(INTERNAL_CHAT_ROLES);
    expect(INTERNAL_ROLES).toContain(ROLE.OWNER);
  });

  it("should expose order and product constants", () => {
    expect(FULFILLMENT_STATUS.PENDING).toBe("pending");
    expect(PRODUCT_SORT.PRICE_DESC).toBe("price-desc");
  });

  it("should expose variant id prefixes", () => {
    expect(VARIANT_ID_PREFIX.GENERATED).toBe("gen-");
    expect(VARIANT_ID_PREFIX.TEMP).toBe("temp-");
  });
});
