import { describe, expect, it } from "vitest";
import { calculateMetadata, getPaginationParams, PAGINATION_DEFAULT } from "@/lib/pagination";

describe("pagination", () => {
  it("should parse pagination params", () => {
    const request = new Request("http://localhost?page=2&limit=5");
    const { page, limit, offset } = getPaginationParams(request);
    expect(page).toBe(2);
    expect(limit).toBe(5);
    expect(offset).toBe(5);
  });

  it("should clamp invalid pagination params", () => {
    const request = new Request("http://localhost?page=0&limit=0");
    const { page, limit, offset } = getPaginationParams(request);
    expect(page).toBe(1);
    expect(limit).toBe(1);
    expect(offset).toBe(0);
  });

  it("should calculate metadata", () => {
    const meta = calculateMetadata(55, 2, PAGINATION_DEFAULT.LIMIT);
    expect(meta.total).toBe(55);
    expect(meta.totalPages).toBe(Math.ceil(55 / PAGINATION_DEFAULT.LIMIT));
  });
});
