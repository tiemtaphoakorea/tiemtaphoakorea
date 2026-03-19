import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

describe("tooling regression guards", () => {
  it("keeps the shared data table free of the react-table hook", async () => {
    const source = await readFile(
      path.join(repoRoot, "packages/ui/src/components/data-table.tsx"),
      "utf8",
    );

    expect(source).not.toContain("useReactTable");
  });

  it("keeps the chart wrapper free of direct recharts imports and injected inner HTML", async () => {
    const source = await readFile(
      path.join(repoRoot, "packages/ui/src/components/chart.tsx"),
      "utf8",
    );

    expect(source).not.toContain('from "recharts"');
    expect(source).not.toContain("dangerouslySetInnerHTML");
    expect(source).toContain('import("recharts")');
  });
});
