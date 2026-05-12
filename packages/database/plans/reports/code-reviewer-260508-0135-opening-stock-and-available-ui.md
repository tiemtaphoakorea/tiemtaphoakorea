# Code Review — `updateOpeningStock` + "Có thể bán" UI rollout

Date: 2026-05-08
Scope: backend (`inventory.server.ts`, `analytics.server.ts`), API
(`opening-stock/route.ts`), UI (variants tab + edit dialog + 6 surfaces
showing "Có thể bán"). Static review only.

---

## Verdict

**Ship with follow-ups.** No Critical issues. Race-safety, auth boundary,
and type alignment all check out. The biggest concrete bug is the dialog
prefilling **current on-hand** instead of **current opening qty** — the
UX implies "you are editing this number" but the number shown is the
wrong one. Two correctness/edge-case items around the re-chain invariant
and one inflated metric badge round out the Major list.

---

## Critical

_None._

---

## Major

### M1. Dialog prefills `currentOnHand` instead of opening qty — misleading edit

**File:** `apps/admin/components/admin/products/product-form/edit-opening-stock-dialog.tsx:43`
also `variants-tab.tsx:344`.

`useState<number>(currentOnHand)` seeds the input with the variant's
*current physical on-hand*. The dialog is titled "Sửa tồn đầu kỳ" (edit
opening stock). These two values diverge whenever any movement has
happened (which is the entire reason the dialog exists).

Concrete failure mode: on_hand=100, opening=50, user opens the dialog,
sees `100`, intends "leave it alone", clicks Save. Server treats `100`
as the *new opening* → `oldOpening=50, newOpening=100` → re-chain →
on_hand becomes 100 + (100-50) = 150. Silent data corruption.

**Fix:** either
- Add a GET on the same route returning current opening qty, fetch on
  open, prefill that. Show on_hand as a read-only "tồn hiện tại" line
  for context, or
- Include `openingStock` in the variant payload feeding `ProductFormVariant`
  (server already has the row; cheap join), and pass it through the
  prop. Rename the prop (`currentOnHand` → `currentOpening`).

Either way: stop using `onHand` as the prefill.

---

### M2. Re-chain assumes opening is chronologically first — implicit invariant

**File:** `packages/database/src/services/inventory.server.ts:118-131`

```sql
SUM(quantity) OVER (ORDER BY created_at, id) AS new_after
```

Logic only produces correct `on_hand_after` if the very first row in
that ordering is the opening (its `quantity = opening`, so its
`on_hand_after = quantity = opening`, and `on_hand_before = 0`). If
*any* movement carries `created_at < OPENING_STOCK_DATE` (= 2026-04-18
23:59:59Z), the chain skews — opening's `on_hand_before` lands at
non-zero, and every downstream row inherits the offset.

Today no producer inserts movements before that timestamp, so practically
safe. But the invariant is undocumented and load-bearing.

**Fix (one of):**
- Add a code comment at line 118 stating the precondition explicitly.
- Defensive: re-time the opening to `MIN(created_at) - 1ms` of the
  variant's other movements when re-chaining (or detect violation and
  throw).
- Long-term: filter/anchor by the opening row, e.g.
  `SUM(quantity) OVER (ORDER BY (note = 'Opening...') DESC, created_at, id)`.

### M3. Inventory page MetricStatBar over-counts "Còn hàng"

**File:** `apps/admin/app/(dashboard)/inventory/_content.tsx:111`

```tsx
value: Math.max(0, totalSkus - lowStock.length - outOfStock.length)
```

`lowStock` and `outOfStock` come from `getStockAlerts`, which has
`.limit(10)` (`analytics.server.ts:188, 204`). When >10 SKUs are in
either bucket, `lowStock.length` caps at 10, and "Còn hàng" inflates
by the missing count. The "Sắp hết" / "Hết hàng" badges (lines 118,
124) are similarly capped to 10 — they read like absolute counts but
are upper-bounded.

This is partially pre-existing (limit was already there), but the new
re-introduction of the badges next to category-aware tabs makes the
discrepancy more visible.

**Fix:** call a lightweight count endpoint (or extend `getStockAlerts`
to return `{ lowStock, outOfStock, totalLow, totalOut }`) and bind the
badges + the "Còn hàng" subtraction to the totals, not the truncated
arrays.

---

## Minor

### m1. Constants duplicated across two files

**File:** `inventory.server.ts:59-60` and `scripts/db-backfill-inventory-opening-stock.ts:30,32`.

`OPENING_STOCK_NOTE` and `OPENING_STOCK_DATE` exist in both. If anyone
edits one without the other, the upsert in `updateOpeningStock` will
no longer find the row inserted by the backfill script — UI silently
inserts a *second* opening row, and the `LIMIT 1` upsert now points at
whichever was earlier.

**Fix:** export both from `inventory.server.ts` (or a shared
`constants/inventory.ts`) and import in the script.

### m2. `cost_adjustment` enum is a re-chain landmine

**File:** `packages/database/src/services/inventory.server.ts:9-15`,
schema enum at `packages/database/src/schema/enums.ts:41`.

The enum exists; the UI labels it ("Điều chỉnh giá vốn"). No producer
inserts rows of this type today, but if one ever does *with non-zero
quantity* (intentionally or accidentally), the re-chain treats it as a
stock move and corrupts the chain.

**Fix:** either
- Add `WHERE type <> 'cost_adjustment'` to the chain CTE and to the
  `SELECT ... LIMIT 1` for `latest`, plus a unit invariant
  `quantity = 0` on insert; or
- Drop the enum value if WAC-only cost adjustments will live elsewhere.

### m3. No upper bound on `newQuantity`

**File:** `apps/admin/app/api/admin/inventory/opening-stock/route.ts:29`,
also `inventory.server.ts:71`.

Validation accepts any non-negative integer up to `Number.MAX_SAFE_INTEGER`.
PG `integer` column overflows at 2^31-1 (≈ 2.1B). A typo of
`100000000000` would fail the INSERT/UPDATE with an opaque DB error
(or worse, succeed if anything is `bigint`). Recommend cap at e.g.
1_000_000 with a friendly message.

**Fix:**
```ts
if (newQuantity > 1_000_000) return 400 "Số lượng quá lớn";
```

### m4. Role check uses string literals, not `ROLE` constants

**File:** `apps/admin/app/api/admin/inventory/opening-stock/route.ts:17`

```ts
if (role !== "owner" && role !== "manager")
```

Sibling routes typically import `ROLE` from `@workspace/shared/constants`.
Drift risk if the enum is ever renamed.

**Fix:** `if (role !== ROLE.OWNER && role !== ROLE.MANAGER)`.

### m5. Dialog state is only initialized once

**File:** `edit-opening-stock-dialog.tsx:43`

`useState<number>(currentOnHand)` seeds on first mount. The dialog
component remains mounted across open/close cycles in the row (only
`open` toggles). After M1 is fixed, the same prop change won't re-seed
the field — user opens, types `120`, closes, reopens → field still
shows `120` (or whatever was last typed).

**Fix:** reset on open via `useEffect`:
```ts
useEffect(() => { if (open) setNewQuantity(currentOpening); }, [open, currentOpening]);
```

### m6. `noop` early-return doesn't auto-heal drift

**File:** `inventory.server.ts:98-100`

If `variant.onHand` has drifted from `latest.onHandAfter` (e.g., a
direct DB tweak), submitting the same opening returns `noop=true`
without re-syncing. Low likelihood given gap3 reconciliation already
ran, but the function's promise — "ensures on_hand matches latest
movement" — is silently violated.

**Fix:** even when `existing.quantity === newQuantity`, run steps 2–3
to re-converge; or document that noop is by-design and run a separate
reconcile path.

### m7. Insert with quantity=0 when no opening + user submits 0

**File:** `inventory.server.ts:105-116`

If a variant has no opening row and the user submits `newQuantity=0`,
we INSERT a `manual_adjustment` with `quantity=0, on_hand_before=0,
on_hand_after=0`. Harmless but pollutes the movements log and the XNT
report.

**Fix:** if `!existing && newQuantity === 0`, return early as a noop.

### m8. No audit row for opening-stock edit

**File:** `inventory.server.ts:101-104`

UPDATE overwrites `quantity` and stamps `createdBy`; the previous
opening value is lost. For a destructive op gated on owner/manager,
many shops would expect an audit trail.

**Fix (if domain requires):** insert an additional `manual_adjustment`
movement with `quantity=0`, note containing `oldOpening → newOpening`,
or write to a dedicated audit table. Skip if not required.

### m9. Generic `onHand` field on `ProductFormVariant.onHand` editable in form

**File:** `apps/admin/components/admin/products/product-form/variants-tab.tsx:251-267`

The "Tồn kho" cell remains a free `NumberInput` bound to `onHand`. If
a user types in there *and* uses the new opening-stock dialog, the two
mutate the same display value, but submission paths differ — the
plain form save likely overwrites `productVariants.on_hand` directly,
bypassing movements. That breaks the invariant the new dialog is
trying to restore.

This is technically out of the diff scope, but the dialog now
co-exists with a freely-editable on-hand cell. Recommend: in `edit`
mode, make `onHand` read-only (since opening edit is the canonical way
to change baseline), with the Có thể bán + Đang giữ derived columns as
the user-facing values. In `create` mode, keep editable (initial
seeding).

### m10. Variants tab — top-level `mode` prop optional but used as gate

**File:** `apps/admin/components/admin/products/product-form/variants-tab.tsx:38, 47`

`mode?: "create" | "edit"` is optional; `showReserved={mode === "edit"}`
silently treats `undefined` as create. Callers that omit `mode` get the
non-edit UI. Not a bug per se, but make it required to prevent silent
drift.

### m11. Auth client error mapping in route swallows all errors as 400

**File:** `apps/admin/app/api/admin/inventory/opening-stock/route.ts:43-46`

`updateOpeningStock` can throw "Variant not found" → 400 with the same
shape as validation errors. A non-existent variant should be 404. Internal
SQL errors should arguably be 500.

**Fix:** branch on error type/message and map appropriately.

---

## Verified OK

- **Race condition with concurrent stock_out:** `FOR UPDATE` on
  `productVariants` row at `inventory.server.ts:80` serializes against
  `lockVariantsForUpdate(...)` used by `confirmStockOut` paths
  (`order.server.ts:198-200`). Concurrent stock-out blocks until the
  re-chain transaction commits.
- **Idempotency:** `noop` path on identical value (l. 98). Non-trivial
  edits run the full chain. ✓
- **Re-chain math for normal case:** `SUM(quantity) OVER (ORDER BY
  created_at, id)` produces `on_hand_after`; `new_after - quantity`
  produces `on_hand_before`. Holds when opening is chronologically
  first (see M2).
- **`StockAlertVariant` shape extension:** `analytics.server.ts:156-164`
  adds `reserved` + `available`; `apps/admin/services/admin.client.ts:1`
  re-exports the type so `low-stock-list.tsx:31`, `inventory/_content.tsx:300`
  resolve correctly. ✓
- **Inventory KPI filter switch to `on_hand - reserved`:** semantically
  consistent with `getStockAlerts`; both buckets now agree on the
  "sellable" definition. ✓
- **Auth on the new route:** `getInternalUser` rejects null user,
  inactive profile, and JWT-vs-DB role mismatch. Owner/manager check
  layered on top. ✓
- **Input validation:** integer + non-negative checked at both API
  and service. ✓ (modulo upper bound, m3.)
- **Type alignment for "Có thể bán" surfaces:**
  `paste-skus-dialog.tsx:204` reads `variant.reserved` from
  `OrderProductVariant.reserved: number` (required) — safe.
  `_create-dialog.tsx:121` and `movements-tab.tsx:232` use `?? 0`
  defensively — fine. `variants-tab.tsx:279` reads from
  `ProductFormVariant.reserved?: number` and uses `?? 0`. ✓

---

## Unresolved questions

1. Should `cost_adjustment` movements participate in the chain at all,
   or are they pure cost-side metadata? (Decides whether m2 is a code
   comment or a `WHERE type <> ...` filter.)
2. Is an audit trail required for opening edits (m8)? If yes, table
   structure (extra movement row vs. dedicated audit table) needs a
   product/ops decision.
3. Is in-form `onHand` editability still intended in `edit` mode (m9),
   given the opening dialog now exists? If not, make read-only and
   route all baseline mutations through `updateOpeningStock`.
4. Upper bound for `newQuantity` (m3) — what's a sensible cap for this
   shop? 1M? 10M?
