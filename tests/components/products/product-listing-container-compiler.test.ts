import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

describe("product listing compiler guards", () => {
  it("keeps the client listing container free of effect-driven fetching", async () => {
    const source = await readFile(
      path.join(repoRoot, "apps/main/components/products/listing/product-listing-container.tsx"),
      "utf8",
    );

    expect(source).not.toContain("useEffect");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("finally");
    expect(source).not.toContain("useSearchParams");
  });
});
