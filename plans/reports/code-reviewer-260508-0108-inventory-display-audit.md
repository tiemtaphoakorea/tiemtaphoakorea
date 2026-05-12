# Inventory Display Audit — "Có thể bán" Column

**Goal:** Audit every admin UI surface that shows inventory and decide where to add a prominent **"Có thể bán"** (= `onHand − reserved`) column. Customer mental model: "Tồn kho" should mean *sellable*. Plan keeps physical "Tồn kho" as secondary; sellable becomes the primary number for sales-facing surfaces.

**Schema reminder:** `product_variants.onHand` (physical) + `product_variants.reserved` (held by pending orders). `available = max(0, onHand − reserved)`.

---

## TL;DR — Recommendation matrix

| # | File | Currently shows | Use case | Action |
|---|------|-----------------|----------|--------|
| 1 | `components/admin/orders/order-product-sheet.tsx` | `Kho: {onHand}` only | Add product to order (legacy sheet) | **ADD "Có thể bán"** + use `available` for low-stock & disable when 0 |
| 2 | `components/admin/products/product-table.tsx` | `totalStock = Σ onHand` only | Product list (standalone Card view) | **ADD "Có thể bán"** column; "Hết hàng" should fire on `available === 0` |
| 3 | `components/admin/products/product-form/variants-tab.tsx` | "Tồn kho" (input) + "Đang giữ" (read-only) | Edit/create variants — physical control | **KEEP** (physical edit context). Optionally add a derived **"Có thể bán"** read-only cell to reduce mental math. |
| 4 | `components/admin/inventory/movements-tab.tsx` | "Tồn kho" col = `onHandBefore → onHandAfter`; dialog: `Tồn {v.onHand}` | Stock-movement audit log + adjust dialog | **KEEP** for log (physical history is correct). For adjust dialog Select, append `· có thể bán {available}` to help operator. |
| 5 | `components/admin/shared/variant-search-picker.tsx` | "Tồn: N | Có thể bán: N" (already there) | Generic picker (purchases, supplier orders) | **KEEP** — already correct. Used by purchases (P1) and `_create-dialog` (see #21). |
| 6 | `components/admin/orders/create/product-multi-select-dialog.tsx` | "Tồn: N | Có thể bán: N" (already) | Order create — bulk select | **KEEP** — already correct. |
| 7 | `components/admin/orders/create/order-add-row.tsx` | "Tồn: N | Có thể bán: N" (already) | Order create — search-and-add | **KEEP** — already correct. |
| 8 | `components/admin/orders/create/order-builder.tsx` | Builds `available = onHand − reserved` per item | Order create root | **KEEP** — already passes `available` through to cart row. Server is the auth boundary anyway. |
| 9 | `components/admin/orders/create/paste-skus-dialog.tsx` | Shows only matched SKU + qty (no stock display) | Order create — paste SKUs | **OPTIONAL ADD**: show `Có thể bán: N` next to each matched row so user spots over-sells before submit. Server still validates. |
| 10 | `components/admin/analytics/inventory-valuation-table.tsx` | "Tồn kho" col = `onHand`; `stockValue = onHand × cost` | Stock valuation (financial reporting) | **KEEP** — physical inventory is the correct base for accounting. |
| 11 | `components/admin/analytics/low-stock-list.tsx` | `{item.onHand} còn lại` | Dashboard widget — alerts | **REPLACE** field source: should drive off `available` (a SKU with `onHand=10, reserved=10` is effectively unsellable). Requires extending `StockAlertVariant` type with `reserved` / `available` (server-side change). |
| 12 | `components/admin/analytics/inventory-movement-log.tsx` | "Trước/Sau" cols = `onHandBefore/After` | Movement audit | **KEEP** — physical audit trail. |
| 13 | `components/admin/analytics/inventory-category-chart.tsx` | Aggregates `qty += item.onHand`; charts `value` (cost-based) | Category bar chart for valuation | **KEEP** — financial aggregate. |
| 14 | `components/admin/analytics/inventory-stats.tsx` | `totalCostValue / totalRetailValue / lowStockCount / outOfStockCount` | Inventory KPI strip | **KEEP** values; **REVIEW** that low/out counts are computed from `available` not `onHand` server-side (see Q1). |
| 15 | `components/admin/products/product-stats.tsx` | `total / outOfStock / lowStock / totalValue` (already aggregated upstream) | Product KPIs | **KEEP** UI; verify upstream uses `available` for `outOfStock/lowStock`. |
| 16 | `app/(dashboard)/products/[id]/edit/_content.tsx` | Maps `onHand`, `reserved` into form | Product edit page | **KEEP** — already passes `reserved` to form (table renders "Đang giữ"). |
| 17 | `app/(dashboard)/products/_content.tsx` | Cols: "Có thể bán" (`totalAvailable`) + "Tồn kho" (`totalOnHand`) | Product list | **KEEP** — already implements the target pattern. ✅ |
| 18 | `app/(dashboard)/inventory/_content.tsx` | Stock table cols: "Có thể bán", "Đang giữ", "Tồn kho"; Low/out tabs show only `onHand` | Warehouse dashboard | **PARTIAL KEEP / FIX**: stock tabs already correct ✅; low/out tabs show `v.onHand` → should show `available` (paired with #11). |
| 19 | `app/(dashboard)/analytics/inventory/_content.tsx` | Composes child tables only | Analytics page shell | **KEEP** — no display logic of its own. |
| 20 | `app/(dashboard)/receipts/[id]/_content.tsx` | Receipt items: SKU/qty/cost (no stock col) | Goods receipt detail | **KEEP** — no current/sellable stock displayed; not relevant. |
| 21 | `app/(dashboard)/purchases/new/_content.tsx` | Uses `VariantSearchPicker` (#5) | Create PO | **KEEP** — already shows sellable in picker. |
| 22 | `app/(dashboard)/supplier-orders/_create-dialog.tsx` | `<Select>` of products — only `name (sku)`, no stock | Quick supplier-order dialog | **OPTIONAL ADD**: append `Có thể bán: N` per option to help the operator decide quantity. Low priority; PO operator usually checks elsewhere. |

Legend: **ADD** = file shows physical only, needs sellable column. **REPLACE** = file shows physical but should be sellable. **KEEP** = correct as-is for its physical context. **RENAME** = (none in this audit — every label found is semantically accurate for its current source field).

---

## Detail by file (only the non-trivial ones)

### #1 — `order-product-sheet.tsx` (legacy "Thêm sản phẩm" sheet)
**Currently:** line 80 — `<div className="text-xs text-slate-500">Kho: {variant.onHand}</div>`. No `reserved` consumed.
**Use case:** Add to order. Must validate against sellable.
**Change:**
```tsx
const available = Math.max(0, Number(variant.onHand) - Number(variant.reserved ?? 0));
// ...
<div className="text-xs text-slate-500">
  Tồn: {variant.onHand} · <span className={available === 0 ? "text-red-500" : "text-emerald-600"}>Có thể bán: {available}</span>
</div>
// also disable the + button when available === 0
```
**Note:** This component appears to be unused by the current order-create flow (`order-builder.tsx` uses `OrderAddRow` instead). Verify before changing — if dead code, delete instead. (See Q3.)

### #2 — `product-table.tsx` (custom Card-based product table)
**Currently:** `totalStock = Σ onHand`; "Hết hàng" badge fires on `totalStock === 0`.
**Use case:** Browsing/managing products.
**Change:**
- New header `<TableHead className="text-center">Có thể bán</TableHead>` between price and "Tồn kho".
- Compute `totalAvailable = Σ max(0, onHand − reserved)` per product.
- Switch the "Hết hàng" badge logic to `totalAvailable === 0` (a fully-reserved product *is* effectively out from the seller's perspective).
- Keep `totalStock` cell as physical reference.
**Note:** This component is the older bespoke table; `app/(dashboard)/products/_content.tsx` (#17) already implements the target pattern via the server-aggregated `totalAvailable / totalOnHand`. Confirm whether `product-table.tsx` is still referenced; if dead code, delete. (See Q4.)

### #3 — `variants-tab.tsx` (product form, edit mode)
**Currently:** "Tồn kho" (editable `NumberInput` for `onHand`) + "Đang giữ" (read-only `reserved`, edit mode only).
**Use case:** Editing physical stock per variant. The user is *setting* `onHand` — sellable is derived.
**Recommendation:** **KEEP**. Adding an editable "Có thể bán" would confuse the data model (it's derived). At most, add a small derived read-only cell (`onHand − reserved`) right after "Đang giữ" for parity. Header label could become "Tồn kho thực" to disambiguate from sellable, but only if it doesn't break consistency with other places.

### #4 — `movements-tab.tsx` (inventory movements log + adjust dialog)
**Log table:** "Tồn kho" column = `{onHandBefore} → {onHandAfter}`. This is a physical-history table; **KEEP** semantics. Optional: tooltip clarifying "tồn vật lý".
**Adjust dialog Select option (line 232):** `{v.sku} · Tồn {v.onHand ?? 0}`. Adjustments target `onHand`, so this is also correct, but operator usefulness improves with sellable hint:
```tsx
{v.sku} · Tồn {v.onHand ?? 0} · CTB {Math.max(0, (v.onHand ?? 0) - (v.reserved ?? 0))}
```
(CTB = "có thể bán" abbreviation; or spell it out.)

### #11 — `low-stock-list.tsx` (dashboard widget)
**Currently:** badge `{item.onHand} còn lại`.
**Problem:** A SKU with `onHand=20, reserved=20` is invisible here (server filter is on `onHand` thresholds — see Q1) but functionally cannot be sold. Customer wants "sắp hết" to mean "sắp không bán được nữa".
**Change:**
- Server: extend `StockAlertVariant` with `reserved`, `available`, or compute the alert against `available` directly.
- UI: render `{available} còn lại` (where `available = onHand − reserved`); optionally `{onHand} (giữ {reserved})` as secondary line.

### #18 — `inventory/_content.tsx` (warehouse dashboard)
**Stock/in-stock tabs (lines 180-189):** already show "Có thể bán | Đang giữ | Tồn kho". ✅
**Low/out tabs (lines 281-308):** show only `v.onHand`. Inconsistent with the rest of the page.
**Change:** When extended `StockAlertVariant` carries `reserved`/`available` (paired with #11), render "Có thể bán" instead of (or alongside) `onHand` here.

### Order-create flow (P0) — overall verdict
The flow is **already correct** for sellable validation:
- `order-builder.tsx::buildItem` sets `available = variant.onHand - variant.reserved` (line 37).
- `order-cart-row.tsx` shows the `available` column ("Tồn") and renders an amber `shortage` warning when `quantity > available` (lines 29, 60-66, 102-107).
- Pickers (`order-add-row`, `product-multi-select-dialog`) display both "Tồn" and "Có thể bán".

**Caveats to confirm:**
1. The cart "Tồn" column header (`order-items-table.tsx` line 90) reads "Tồn" but displays `available`. Rename header to **"Có thể bán"** for consistency with pickers. Width may need a small bump.
2. `available` in the cart is a snapshot at add-time — not refreshed if reserved changes elsewhere. Server is still the authority on submit; UI should not pretend otherwise. (See Q5.)
3. `useVariantSearch` calls API with `inStockOnly: true`. Verify this filter is `available > 0`, not `onHand > 0`, otherwise pickers can surface unsellable variants. (See Q1.)

---

## Implementation Priority

### P0 — Order-create over-sell prevention
Already wired; only nits remain.
1. `order-items-table.tsx` line 90: rename "Tồn" header to **"Có thể bán"**.
2. Verify server `inStockOnly` filter (in `getProductsWithVariants`) uses `onHand − reserved > 0`. (Q1)
3. Verify server `createOrder` rejects when any line item's `quantity > available` (server-side safety net). (Q2)

### P1 — Primary listings & dashboards
4. `low-stock-list.tsx` + server `getStockAlerts` + `inventory/_content.tsx` low/out tabs: switch to `available`-based threshold and display.
5. `product-table.tsx`: add "Có thể bán" column OR delete file if unused (Q4).
6. `order-product-sheet.tsx`: add "Có thể bán" + disable when 0 OR delete if unused (Q3).
7. `paste-skus-dialog.tsx`: show `Có thể bán` per matched row (nice-to-have but cheap).

### P2 — Analytics / supporting surfaces
8. `movements-tab.tsx` adjust-dialog `<Select>`: append sellable hint per option.
9. `variants-tab.tsx`: add read-only derived "Có thể bán" cell (edit mode only).
10. `supplier-orders/_create-dialog.tsx`: append sellable per option.
11. Tooltip pass on physical-only labels ("Tồn kho" in valuation/movement-log/category-chart) clarifying "vật lý" to avoid customer confusion when they land on those reports.

---

## Suggested terminology / variant snippets

```tsx
// helper (place in a shared util — already inlined in 4+ files)
export function sellable(onHand: number, reserved: number | null | undefined): number {
  return Math.max(0, onHand - (reserved ?? 0));
}
```

```tsx
// canonical "Tồn / Có thể bán" pair (matches order-add-row.tsx style)
<div className="text-xs text-muted-foreground">
  Tồn: <span className="font-medium text-foreground tabular-nums">{onHand}</span>
  {" | "}
  Có thể bán:{" "}
  <span className={cn("font-medium tabular-nums", available === 0 ? "text-red-500" : available <= 5 ? "text-amber-600" : "text-primary")}>
    {available}
  </span>
</div>
```

---

## Unresolved questions

1. **Server low-stock filter.** Does `getStockAlerts` (and `stockStatus` filter on `getProducts`) compare against `onHand` or `available`? If `onHand`, the dashboard widgets in #11/#14/#18 give wrong signals when reservations are heavy. Need a backend audit before relabeling UI to "có thể bán".
2. **Server-side over-sell guard.** Does the order-create endpoint reject `quantity > available` per line, or rely on client-side `shortage` indicator? UI never blocks submission today (see `order-summary-bar`/`order-builder`). Either add a hard block client-side or confirm server enforces it.
3. **Is `order-product-sheet.tsx` still used?** `OrderBuilder` uses `OrderAddRow`, not this sheet. Grep references and either fix or delete.
4. **Is `product-table.tsx` still used?** `app/(dashboard)/products/_content.tsx` already inlines its own `<Table>` and uses server-aggregated `totalAvailable`/`totalOnHand`. Confirm `product-table.tsx` is dead code before adding a new column to it.
5. **`available` snapshot freshness.** `OrderBuilderItem.available` is set at add-time and never refreshed. Decide: refresh on focus / before submit / leave as advisory and rely on server. Affects whether the shortage UX is trustworthy in long-running cart sessions.
6. **`StockAlertVariant` shape change.** Adding `reserved`/`available` is a server type change touching `analytics.server.ts` + admin client + 2 consumers. Cheap, but needs to ship together with #4.
7. **Label "Tồn kho thực" vs "Tồn kho".** Should physical contexts (valuation, movement log, variants form) switch to "Tồn kho thực" to fully eliminate ambiguity, or is the current "Tồn kho" label acceptable now that "Có thể bán" carries the primary sales meaning? Customer feedback was specifically about expectations for the *primary* number — verify with PM whether the secondary label needs to change too.

---

**Status:** DONE
**Summary:** Audited 22 files. Order-create flow already enforces `available` end-to-end (only minor header rename needed). Real gaps are in `low-stock-list.tsx` + server `StockAlertVariant`, the legacy `product-table.tsx` / `order-product-sheet.tsx` (likely dead code — confirm), and a couple of nice-to-have hints in supplier-order/paste-skus dialogs.
**Concerns/Blockers:** 7 unresolved questions above; biggest is whether server low-stock thresholds compute against `available` (Q1) and whether order-create has a server-side over-sell guard (Q2) — both must land alongside any UI relabeling to avoid drift.
