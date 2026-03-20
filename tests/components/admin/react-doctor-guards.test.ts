import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

const adminFilesWithoutFinally = [
  "apps/admin/components/image-uploader.tsx",
  "apps/admin/components/layout/admin-sidebar.tsx",
  "apps/admin/app/(dashboard)/analytics/page.tsx",
  "apps/admin/app/(dashboard)/customers/page.tsx",
  "apps/admin/app/(dashboard)/suppliers/page.tsx",
  "apps/admin/app/(dashboard)/products/page.tsx",
  "apps/admin/app/(dashboard)/users/page.tsx",
  "apps/admin/app/(dashboard)/customers/[id]/page.tsx",
  "apps/admin/app/(dashboard)/products/[id]/edit/page.tsx",
  "apps/admin/app/(dashboard)/products/new/page.tsx",
  "apps/admin/components/admin/products/product-form.tsx",
  "apps/admin/app/(dashboard)/categories/page.tsx",
];

describe("admin react-doctor regression guards", () => {
  it("removes compiler-blocking finally clauses from flagged admin client files", async () => {
    const sources = await Promise.all(
      adminFilesWithoutFinally.map((filePath) =>
        readFile(path.join(repoRoot, filePath), "utf8").then((source) => ({ filePath, source })),
      ),
    );

    for (const { filePath, source } of sources) {
      expect(source, filePath).not.toContain("finally");
    }
  });

  it("keeps the analytics page free of effect-driven client fetching", async () => {
    const source = await readFile(
      path.join(repoRoot, "apps/admin/app/(dashboard)/analytics/page.tsx"),
      "utf8",
    );

    expect(source).not.toContain("useEffect");
    expect(source).not.toContain("axios.get");
  });

  it("uses stable form subscriptions in supplier order sheet", async () => {
    const source = await readFile(
      path.join(repoRoot, "apps/admin/components/admin/supplier-order-add-sheet.tsx"),
      "utf8",
    );

    expect(source).not.toContain("watch(");
  });
});
