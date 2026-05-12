import { describe, expect, it } from "vitest";
import { sqlTimestamp } from "@/services/report-shared.server";

describe("report shared SQL helpers", () => {
  it("binds raw SQL timestamp params as strings for postgres-js", () => {
    const date = new Date("2026-05-12T00:00:00.000Z");
    const query = sqlTimestamp(date) as unknown as { queryChunks: unknown[] };

    expect(query.queryChunks).toContain("2026-05-12T00:00:00.000Z");
    expect(query.queryChunks.some((chunk) => chunk instanceof Date)).toBe(false);
  });
});
