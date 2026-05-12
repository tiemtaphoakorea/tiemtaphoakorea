# Code Review — db-backfill-supplier-orders.ts

**Scope:** `packages/database/scripts/db-backfill-supplier-orders.ts` (242 LOC, single file)
**Compared against:** `0009_seed_document_sequences_and_backfill_supplier_orders.sql` + `0010_backfill_pending_supplier_orders_to_received.sql` (recovered from `57c7f87^`)
**Verdict:** PASS with 2 Major divergences from original SQL final state.

---

## 1. Code Quality — PASS

| Aspect | Notes |
|---|---|
| Typing | Generic row types declared inline; `LegacyStatus` / `PurchaseOrderStatus` unions correct vs enum definitions in `enums.ts`. |
| Error handling | Top-level `.catch` exits with code 2; per-row failures bubble up and abort run. No defensive NaN check (see Minor 5). |
| Transaction safety | `sql.begin(async tx => …)` per row — header + items + receipt + receipt items are atomic per legacy row. Sequence increment lives inside tx so OSN/PON gaps are impossible on rollback. |
| SQL injection | All values flow through `postgres` tagged-template literals → parameterized. SAFE. |
| Conventions | Matches `db-backfill-inventory-opening-stock.ts` style: `import "dotenv/config"`, raw `postgres({ max: 1 })` client, `await sql.end({ timeout: 3 })` in finally, kebab-case filename, `db:backfill-supplier-orders` script in `package.json`. ✓ |

---

## 2. Correctness vs Original SQL — FAIL (2 Major divergences)

### MAJOR 2.1 — `confirmed_by` differs for pending-converted POs

**Original final state (after 0009 + 0010):**
- 0009 sets `confirmed_by = legacy_row.created_by` only when `status IN ('ordered','received')`. For `pending` rows: `confirmed_by = NULL`.
- 0010 promotes pending→received but does **not** update `confirmed_by`. So pending-derived POs end with `confirmed_by = NULL`.

**TS script (line 157):**
```ts
${newStatus === "ordered" || isReceived ? row.created_by : null}
```
Since `pending → received` (`isReceived = true`), TS sets `confirmed_by = row.created_by` for those rows.

**Impact:** ~ all 227 pending rows (likely majority) gain a non-null `confirmed_by` they didn't have before. Affects audit trail / "who confirmed" UI columns.

**Fix:** Track legacy status separately from mapped status:
```ts
const wasConfirmed = row.status === "ordered" || row.status === "received";
// …
${wasConfirmed ? row.created_by : null}
```

---

### MAJOR 2.2 — PO `updated_at` differs for pending-converted POs

**Original 0010** ends with:
```sql
UPDATE purchase_orders
SET status = 'received', completed_at = created_at, updated_at = now()
```
So pending-derived POs have `updated_at = migration-run timestamp` (not the legacy timestamp).

**TS script (line 158):** uses `row.updated_at` unconditionally → preserves legacy `updated_at`.

**Impact:** Cosmetic / lower than 2.1. Affects "last modified" sorting in admin UI for these legacy records. Original SQL's `now()` was effectively the deploy time; TS preserves the original — arguably more correct, but it IS a divergence from the documented original behavior.

**Recommendation:** Add a comment justifying the choice OR set `updated_at = now()` for `isReceived && row.status === 'pending'` rows. The current behavior is a defensible improvement; just document it.

---

### Other behavioural points checked — match

| Behaviour | Original | TS | Match? |
|---|---|---|---|
| Status mapping `pending → received` (combined effect) | 0009 draft → 0010 received | direct received | ✓ |
| `received_qty = ordered_qty` for received | 0009 sets 0; 0010 sets ordered_qty | sets `row.quantity` directly | ✓ |
| `completed_at` for received POs | 0009 NULL → 0010 sets to `created_at` (since pending `received_at` is null) | `row.received_at ?? row.created_at` | ✓ (assumes pending rows have NULL received_at) |
| `cancelled_at` for cancelled POs | `legacy_row.updated_at` | `row.updated_at` | ✓ |
| OSN code allocation order | chronological by `created_at, id` | same `ORDER BY` | ✓ |
| PON code allocation | sequential within loop | sequential within loop | ✓ |
| Receipt `payment_status = paid` | hardcoded | hardcoded | ✓ |
| Receipt `paid_amount = payable_amount`, `debt = 0` | yes | yes | ✓ |
| Cost fallback chain | `actual ?? variant ?? 0` | `actual ?? variant ?? 0` | ✓ |
| Skip rows with NULL variant_id | `CONTINUE` | `continue` + counter | ✓ |
| Receipt `created_at/updated_at` | `COALESCE(received_at, updated_at, created_at)` (for pending: `created_at`) | `received_at ?? created_at` (for pending: `created_at`) | ✓ for pending; **subtle gap** for status='received' rows where received_at is NULL but updated_at is set — see Minor 5.3 |

---

## 3. Idempotency — PASS with caveat

**Strategy (line 73-80):** `SELECT COUNT(*) FROM purchase_orders > 0` → skip.

**Safe scenarios:**
- Re-running after successful migration → no-op. ✓
- First run after deploy → executes. ✓

**Edge cases (Minor 3.1):**
- If a real `purchase_order` is created via the UI before backfill runs, the entire backfill silently skips — no warning to the operator beyond a log line. Recommend either: (a) gate on `supplier_orders` having unmigrated rows AND `purchase_orders` having zero migration-tagged rows, or (b) document a deploy-time runbook step ensuring the script runs before the new admin UI is exposed.
- If the script crashes mid-loop, partial state remains and re-running is blocked by the count check. Header comment correctly tells the operator to TRUNCATE + reset sequences. Acceptable for one-time use.

**Sequence reset hazard (Minor 3.2):** The header instructs:
```
UPDATE document_sequences SET last_seq = 0 WHERE prefix IN ('OSN','PON');
```
If the operator already issued real PON/OSN codes before the partial-failed run, this will collide on the unique `code` constraint and corrupt their sequence. Recommend tightening the comment: only reset sequences if no non-migrated codes exist.

---

## 4. Edge cases — PASS

| Field | Risk | Handled? |
|---|---|---|
| `variant_id IS NULL` | FK violation on PO item | skipped + counted ✓ |
| `supplier_id IS NULL` | both PO and goods_receipt FKs are nullable | passes through ✓ |
| `actual_cost_price IS NULL` | numeric coercion | falls back to variant cost, then 0 ✓ |
| `ordered_at IS NULL` | column nullable | passes through ✓ |
| `received_at IS NULL` for legacy `received` rows | could create receipt with NULL `received_at` | falls back to `created_at` ✓ (note: original SQL falls back to `updated_at` first) |
| `created_by IS NULL` | column nullable | passes through ✓ |
| `quantity` invariant | `notNull` on legacy schema | guaranteed ✓ |

---

## 5. Numeric precision — PASS

- 227 rows max, amounts ≤ 2.7M VND, integer quantities → IEEE 754 double has 15-16 significant digits, no representation loss in this range.
- `Number(string).toFixed(2)` round-trips cleanly for VND values (typically integer, scale 0-2).
- Postgres column scale is 2, so any extra fractional bits are truncated on insert anyway.

**Minor 5.1:** No defensive guard against `Number(x) → NaN`. If `actual_cost_price` were a malformed string (shouldn't happen with `decimal` constraint but possible if data hand-edited), `lineTotal.toFixed(2)` would return `"NaN"` and Postgres rejects. Add:
```ts
if (!Number.isFinite(unitCost)) throw new Error(`Invalid cost on legacy ${row.id}`);
```

**Minor 5.2:** `Number(string)` for VND values larger than `Number.MAX_SAFE_INTEGER` (9.007e15) would lose precision. 2.7M VND is 9 orders of magnitude below that limit — safe here, but worth a one-line comment for future scale.

**Minor 5.3:** Receipt `created_at/updated_at` fallback differs from original. Original: `COALESCE(received_at, updated_at, created_at)`. TS: `received_at ?? created_at`. For legacy rows with `status='received'` AND `received_at IS NULL` AND `updated_at != created_at`, the receipt timestamps will be slightly earlier in TS than in the original. Likely zero rows match this profile in practice but worth aligning:
```ts
const receivedAt = row.received_at ?? row.updated_at ?? row.created_at;
```

---

## 6. Project conventions — PASS

| Convention | Status |
|---|---|
| Kebab-case filename | ✓ |
| File under 200 lines (242 actual) | ⚠ slightly over — acceptable for one-shot script with heavy comments |
| Idempotency header doc | ✓ |
| Raw `postgres` client (matches `db-backfill-inventory-opening-stock.ts`) | ✓ |
| `pnpm db:backfill-supplier-orders` registered in `package.json:25` | ✓ |
| YAGNI/KISS — no over-engineering | ✓ |
| No AI references | ✓ |

---

## 7. Behavioral checklist (production-readiness)

- [x] **Concurrency:** `max: 1` connection, per-row tx — no race window.
- [x] **Error boundaries:** top-level catch + finally; per-row tx rolls back cleanly.
- [x] **API contracts:** PO/receipt schema columns/types match. `purchase_order_status` enum values include `received` ✓; `receipt_status` includes `completed` ✓; `payment_status` includes `paid` ✓.
- [x] **Backwards compat:** legacy `supplier_orders` table is read-only; not modified or dropped (header comment confirms intent to keep through transition).
- [x] **Input validation:** legacy values originate from DB constraints; missing variant_id explicitly skipped.
- [x] **Auth/authz:** N/A (offline migration script).
- [x] **N+1:** intentional row-by-row to allow per-row tx + sequence allocation. 227 rows × ~6 inserts = ~1400 round trips. Acceptable for one-time run.
- [x] **Data leaks:** prints counts only — no PII to stdout.

---

## Recommended actions (priority order)

1. **MAJOR 2.1** — Fix `confirmed_by` for pending-converted POs (use legacy status, not mapped status).
2. **MAJOR 2.2** — Decide & document: preserve legacy `updated_at` (current TS behavior) vs `now()` (original SQL). If preserving, add a code comment; otherwise align with original.
3. **Minor 5.3** — Add `updated_at` to the `receivedAt` fallback chain to match original `COALESCE`.
4. **Minor 5.1** — Add `Number.isFinite` guard around `unitCost`.
5. **Minor 3.2** — Tighten header comment about resetting sequences (warn against resetting if real codes already exist).
6. **Minor 3.1** — Optional: enrich idempotency log with row counts in `supplier_orders` so operators can sanity-check before/after.

---

## Unresolved questions

- Does business actually rely on `confirmed_by` being non-null for migrated rows? (If "yes — every received PO must have a confirmer in the UI", the TS behavior is preferable to the original. Confirm with stakeholder before changing.)
- Are there any legacy `received` rows with `received_at IS NULL` AND non-null `updated_at`? A quick `SELECT COUNT(*) FROM supplier_orders WHERE status='received' AND received_at IS NULL AND updated_at <> created_at` would confirm whether Minor 5.3 has any practical effect.
- Should the script also write a one-line provenance marker on each migrated row (e.g. `note = 'migrated from supplier_orders ' || legacy_id`) to allow precise rollback / audit later? Original SQL did not — TS doesn't either — but worth considering.
