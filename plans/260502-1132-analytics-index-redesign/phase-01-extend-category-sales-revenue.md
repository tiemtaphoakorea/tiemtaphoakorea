# Phase 1 — Backend: Extend `categorySales` với `revenue`

**Why:** Card 1 (donut) cần show "Cơ cấu doanh thu theo danh mục", nhưng hiện `categorySales[].sales` trả số đơn (`count(orderItems.id)`), không phải doanh thu. Extend service để có `revenue` thật.

**Files:**
- Modify: `packages/database/src/services/analytics.server.ts:67-79` (categorySales query)
- Modify: `packages/database/src/types/admin.ts:390-394` (AnalyticsCategorySale interface)

---

## Steps

- [ ] **Step 1: Extend `AnalyticsCategorySale` type với `revenue`**

Edit `packages/database/src/types/admin.ts` tại `AnalyticsCategorySale` interface:

```ts
export interface AnalyticsCategorySale {
  category: string;
  sales: number;
  revenue: number;
  color?: string;
}
```

- [ ] **Step 2: Sửa query `categorySales` để aggregate revenue**

Edit `packages/database/src/services/analytics.server.ts`. Thay block `categorySales` query (dòng ~67-79) bằng:

```ts
// 3. Category Distribution (sales count + revenue)
const categorySales = await db
  .select({
    category: sql<string>`coalesce(${categories.name}, 'Uncategorized')`,
    sales: sql<number>`count(${orderItems.id})`.mapWith(Number),
    revenue: sql<number>`coalesce(sum(${orderItems.lineTotal}), 0)`.mapWith(Number),
  })
  .from(orderItems)
  .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
  .innerJoin(products, eq(productVariants.productId, products.id))
  .leftJoin(categories, eq(products.categoryId, categories.id))
  .groupBy(sql`coalesce(${categories.name}, 'Uncategorized')`)
  .orderBy(desc(sql`sum(${orderItems.lineTotal})`));
```

Thay đổi:
- Thêm field `revenue` từ `sum(orderItems.lineTotal)`.
- Đổi `orderBy` từ `count` → `sum revenue` để top-by-revenue (có ý nghĩa hơn cho "cơ cấu doanh thu").

- [ ] **Step 3: Typecheck workspace**

Run:
```bash
pnpm --filter @workspace/database typecheck && pnpm --filter @workspace/admin typecheck
```

Expected: PASS (không error). Nếu fail vì `revenue` thiếu ở consumer khác — fix consumer (tìm `categorySales` trong `apps/admin/components/admin/analytics/category-sales-chart.tsx` và verify còn dùng được — sales/revenue/color đều optional ở consumer hay không).

- [ ] **Step 4: Verify CategorySalesChart không bị vỡ**

Read `apps/admin/components/admin/analytics/category-sales-chart.tsx`. Nếu nó dùng `sales` hoặc `color` field thì vẫn OK (không bị xoá). Nếu cần điều chỉnh thì sửa minimal.

- [ ] **Step 5: Lint admin + database packages**

Run:
```bash
pnpm --filter @workspace/admin lint && pnpm --filter @workspace/database lint
```

Expected: PASS hoặc warning không liên quan.

- [ ] **Step 6: Commit**

```bash
git add packages/database/src/services/analytics.server.ts packages/database/src/types/admin.ts
git commit -m "feat(analytics): add revenue field to categorySales aggregation"
```

---

## Success criteria

- `AnalyticsCategorySale` type có thêm `revenue: number`.
- Query trả về `revenue` per category, sorted theo revenue desc.
- `pnpm typecheck` admin + database PASS.
- `CategorySalesChart` ở `/overview` không bị vỡ runtime.

## Risks

- **Existing CategorySalesChart breakage:** mitigated bằng Step 4 verify.
- **Order changed:** trước sort theo `count`, giờ theo `revenue`. Nếu UI nào dependence vào thứ tự cũ thì sẽ thay đổi nhẹ — chấp nhận vì semantic đúng hơn.
