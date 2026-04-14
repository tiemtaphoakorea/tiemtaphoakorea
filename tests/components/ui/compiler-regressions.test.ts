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

  it("verifies the chart wrapper uses static recharts import via ChartStyle component", async () => {
    const source = await readFile(
      path.join(repoRoot, "packages/ui/src/components/chart.tsx"),
      "utf8",
    );

    // chart.tsx uses static recharts import (not dynamic lazy-loading)
    expect(source).toContain('from "recharts"');
    expect(source).not.toContain('import("recharts")');
    // ChartStyle handles CSS injection
    expect(source).toContain("ChartStyle");
    expect(source).toContain("__html");
  });
});
