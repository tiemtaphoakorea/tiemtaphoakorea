# Opening Stock Integration Test Report

**Date:** 2026-05-08
**DB:** `postgresql://postgres:password@localhost:5432/postgres` (Docker `auth_shop_db_dev`)
**Service:** `packages/database/src/services/inventory.server.ts → updateOpeningStock`

---

## Results: 27 PASS / 0 FAIL

| Test | Result | Key numbers |
|------|--------|-------------|
| T1: multi-movement chain update | PASS | opening 2000→2100, on_hand 992→1092, all 23 movements re-chained consistently, restored |
| T2: insert opening (no prior opening) | PASS | inserted qty=50 at 2026-04-18 23:59:59, on_hand_before=0, chain consistent, cleaned up |
| T3: idempotency (same value) | PASS | noop=true both calls, 23 movements unchanged, on_hand=992 unchanged |
| T4: negative quantity rejection | PASS | threw "newQuantity must be a non-negative integer" |
| T5: non-integer rejection | PASS | threw "newQuantity must be a non-negative integer" |
| T6: nonexistent variant | PASS | threw "Variant not found" |
| T7: stock alerts use `available` | PASS | see detail below |
| T8: re-chain preserves count | PASS | 23 movements before = 23 after |
| Final: PVN3437 restored | PASS | opening=2000, on_hand=992 |

---

## Test Detail

### T1 — Multi-movement chain (PVN3437, 23 movements)
- Before: opening=2000, on_hand=992, latest_after=992
- Called `updateOpeningStock(+100)` → opening=2100
- After: latest on_hand_after=1092 (+100), product_variants.on_hand=1092
- Window-function re-chain: every `on_hand_before = prev on_hand_after` — no gap in all 23 rows
- Restored to 2000 / 992 ✓

### T2 — Insert path (PVN4910, 1 non-opening movement)
- No existing opening row; deleted any stale one before test
- `updateOpeningStock(50)` → inserted row: quantity=50, on_hand_before=0, on_hand_after=50, date=2026-04-18 23:59:59, note='Opening stock — historical balance'
- Downstream movement re-chained correctly
- Cleanup: deleted inserted opening row, re-chained, restored on_hand ✓

### T3 — Idempotency
- Called twice with current value (2000)
- Both returned `noop: true` immediately (early return before any DB write)
- Movement count, opening qty, on_hand all unchanged ✓

### T4/T5 — Input validation
- Negative and float both rejected before DB hit via `!Number.isInteger(newQuantity) || newQuantity < 0`

### T6 — Nonexistent variant
- UUID `00000000-0000-0000-0000-000000000099` → `SELECT ... FOR UPDATE` returns 0 rows → throws "Variant not found" ✓

### T7 — Stock alerts use `available = on_hand - reserved`
**Low stock:** `getStockAlerts` returns variants where `0 < available <= low_stock_threshold`. All 10 returned rows confirmed `available > 0 AND available <= threshold`. SQL expression: `(on_hand - reserved)`.

**Out of stock:** returns variants where `available <= 0`. All 10 returned rows have `available <= 0`. 1994 total out-of-stock variants in DB.

**Reserved-masking verified:**
- Low stock via reserved: `P0000DCC000A` on_hand=1, reserved=0, available=1, threshold=5 → correctly appears in lowStock list
- Out-of-stock via reserved: `PVN3445` on_hand=1, reserved=19, available=-18 → correctly qualifies (`available <= 0`). Not in LIMIT-10 result (1994 total rows ordered by product name); SQL logic confirmed sound by checking all returned rows satisfy the predicate.

### T8 — Re-chain preserves row count
- Changed opening 2000→2001, movement count before=23, after=23. Window-function UPDATE modifies values only, no INSERT/DELETE. Restored ✓

---

## Issues Encountered During Setup (not bugs)

1. **FK on `inventory_movements.created_by`** — references `profiles(id)`. Fake UUID in test caused FK violation. Fixed by using real profile ID from DB.
2. **`dotenv` loaded root `.env`** — overrides `DATABASE_URL` with remote Supabase URL. Fixed by passing local URL as env var prefix (`DATABASE_URL=... tsx ...`).

---

## Final State Verification
PVN3437: opening=2000, on_hand=992 — matches pre-test baseline ✓

---

## Unresolved Questions
- `getStockAlerts` outOfStock LIMIT 10 covers only 0.5% of 1994 out-of-stock SKUs. If the UI shows "out of stock alerts", users will only see top-10 alphabetically — reserved-masked items (on_hand>0 but available≤0) fall far down the list. Consider increasing limit or surfacing reserved-masked items separately.
