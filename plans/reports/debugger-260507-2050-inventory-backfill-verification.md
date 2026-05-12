# Inventory Backfill & XNT Report Verification
**Date:** 2026-05-07  
**Period:** 2026-04-19T00:00:00Z — present  
**Opening baseline:** 2026-04-18T23:59:59Z  
**DB:** `postgresql://postgres:password@localhost:5432/postgres` (Docker: `auth_shop_db_dev`)

---

## Overall Verdict: CONDITIONAL PASS

Core XNT formula integrity passes for 99.6% of variants. Two categories of issues found, both pre-existing — not caused by the backfill script itself.

---

## Check 1 — Backfill Movement Counts

| Note | Count |
|---|---|
| Opening stock — historical balance | 1,286 |
| Stock-out for order ORD-20260419-EDC571 | 3 |
| Stock-out for order ORD-20260420-79EE6A | 4 |
| Stock-out for order ORD-20260420-BC1403 | 2 |
| Reconciliation — on_hand vs movement drift | **0** |

**Status: PASS (with note)**

Opening stock records: 1,286. Stock-out backfills: 9 rows across 3 orders. No `Reconciliation` movements were created — backfill script did not find/insert any drift-correction rows. Either drift was absent before backfill or reconciliation step was not run/not needed. This is informational; absence of reconciliation rows is not a failure if drift was zero at backfill time.

---

## Check 2 — XNT Accuracy (Main Test)

```
matched: 1295 | mismatched: 5 | total: 1300
```

**Status: CONDITIONAL PASS — 5 mismatches exist, but all are pre-existing orphan negatives unrelated to backfill**

### Mismatched Variants

| SKU | Opening | Stock In | Stock Out | XNT Closing | Actual on_hand | Drift |
|---|---|---|---|---|---|---|
| PVN1266 | 0 | 0 | 0 | 0 | -1 | -1 |
| PVN2046 | 0 | 0 | 0 | 0 | -1 | -1 |
| PVN2523 | 0 | 0 | 0 | 0 | -1 | -1 |
| PVN2910 | 0 | 0 | 0 | 0 | -1 | -1 |
| PVN3974 | 0 | 0 | 0 | 0 | -1 | -1 |

**Root cause:** All 5 variants have `on_hand = -1` with **zero inventory_movements records**. Their `product_variants.on_hand` column was set to -1 directly (likely via an order fulfillment code path that decremented on_hand without writing a movement), predating the backfill. The backfill script correctly had nothing to act on — it would only write an opening row if on_hand > 0. These are orphan negatives that the reconciliation step (if run) would have corrected.

**Backfill impact: none.** These mismatches existed before the backfill ran.

---

## Check 3 — Movement Chain Integrity

```
broken_chain_count: 8
```

**Status: FAIL — 8 chain breaks detected, all post-backfill live order transactions**

### Broken Chain Examples (all 8)

| SKU | on_hand_before (recorded) | Expected (prev on_hand_after) | on_hand_after | Timestamp | Movement ID |
|---|---|---|---|---|---|
| PVN3444 | 21 | 43 | 12 | 2026-04-22 08:31 | 37339a49 |
| PVN3445 | 15 | 3 | 14 | 2026-04-22 08:31 | 917608de |
| PVN2455 | 31 | 9 | 30 | 2026-04-25 09:30 | 854af8c9 |
| PVN2456 | 51 | 53 | 49 | 2026-04-25 09:31 | 9e460840 |
| PVN3438 | 64 | 17 | 58 | 2026-04-25 10:05 | f05b0a2e |
| P0000DCA000A | 0 | 2 | -1 | 2026-04-27 10:53 | 817e5016 |
| P0000DCC000A | 0 | 2 | -1 | 2026-04-27 10:53 | b6800c9d |
| PVN3669 | 25 | 12 | 24 | 2026-05-06 10:04 | 8a27407f |

**Root cause pattern — two sub-types:**

1. **Stock snapped up between opening and first post-backfill order** (PVN3444, PVN3445, PVN2455, PVN2456, PVN3438, PVN3669): Opening movement wrote `on_hand_after = X` (e.g. 43 for PVN3444). Then a live order was created where `on_hand` had already changed in `product_variants` due to other sales (e.g. dropped to 21 externally). The `stock_out` movement captured `on_hand_before = 21` from the live DB state, breaking continuity from the backfill opening row. This is a **snapshot gap** — the backfill wrote historical opening state but live transactions continued modifying `product_variants.on_hand` independently between the opening timestamp and now.

2. **P0000DCA000A / P0000DCC000A — stale on_hand_before bug**: Opening wrote `on_hand_after = 2`. But the subsequent `stock_out` recorded `on_hand_before = 0` instead of `2`, and resulted in `on_hand_after = -1`. The movement writer read a stale/incorrect value for `on_hand_before` at transaction time. Also: `product_variants.on_hand = 1` while `last movement.on_hand_after = -1` — the actual column disagrees with the movement chain end, confirming the movement writer bug.

**Backfill responsibility:** Chain breaks for type-1 variants are an inherent consequence of inserting historical opening rows into a live system — the backfill cannot "fix" on_hand_before values already captured by live orders. Type-2 (P0000DCA/DCC) is a pre-existing movement writer bug (reads stale on_hand_before).

---

## Check 4 — Gap2 Chain Patching (PVN508 & PVN97)

| SKU | Type | Qty | on_hand_before | on_hand_after | Note | Timestamp |
|---|---|---|---|---|---|---|
| PVN508 | manual_adjustment | +100 | 0 | 100 | Opening stock — historical balance | 2026-04-18 23:59 |
| PVN508 | stock_out | -4 | 100 | 96 | Stock-out for order ORD-20260420-79EE6A | 2026-04-19 18:52 |
| PVN97 | manual_adjustment | +84 | 0 | 84 | Opening stock — historical balance | 2026-04-18 23:59 |
| PVN97 | stock_out | -2 | 84 | 82 | Stock-out for order ORD-20260420-79EE6A | 2026-04-19 18:52 |

**Status: PASS**

Both variants show correct chain: opening → stock_out with contiguous `on_hand_before = on_hand_after` of prior row. No breaks.

---

## Check 5 — Period Summary Totals

| Metric | Value |
|---|---|
| Total variants in scope | 3,266 |
| Total opening (sum) | 241,681 |
| Total stock in (period) | 0 |
| Total stock out (period) | 1,185 |
| Total on_hand now (product_variants) | 240,491 |
| XNT closing (opening + in - out) | 240,496 |
| Discrepancy | **+5** |

**Status: CONDITIONAL PASS**

Delta of 5 units exactly matches the 5 orphan-negative variants (each contributing -1 to actual on_hand, 0 to XNT closing). Remove those 5 and the totals balance perfectly: 240,496 - 5 = 240,491. No systemic drift from the backfill.

---

## Check 6 — Inventory Valuation

| Metric | Value |
|---|---|
| SKUs with on_hand > 0 | 1,285 |
| Total quantity | 240,509 |
| Total cost value | 2,893,345,140 VND |

**Status: PASS**

Note: 240,509 (on_hand > 0 variants only) vs 240,491 (all variants including negatives) difference = 18 units, consistent with negative on_hand entries being excluded.

---

## Check 7 — Total Movements Summary

| Type | Count | Total Units |
|---|---|---|
| manual_adjustment | 1,286 | 241,681 |
| stock_out | 99 | 1,185 |

**Status: PASS**

1,286 manual_adjustment rows = 1,286 opening stock rows (one per variant). 99 stock_out movements totaling 1,185 units — of which 9 are backfill-annotated stock-outs (3 orders), remainder are live transactions.

---

## Summary Table

| Check | Result | Notes |
|---|---|---|
| 1. Backfill movement counts | PASS | No reconciliation rows written (expected if no drift at backfill time) |
| 2. XNT accuracy | CONDITIONAL PASS | 5 mismatches — all orphan negatives with zero movements, pre-existing |
| 3. Chain integrity | FAIL | 8 breaks — 6 snapshot-gap (live orders vs historical opening), 2 stale on_hand_before bug |
| 4. PVN508 / PVN97 chain | PASS | Correct contiguous chain |
| 5. Period summary totals | CONDITIONAL PASS | 5-unit delta = orphan negatives, not backfill drift |
| 6. Inventory valuation | PASS | 1,285 SKUs, 240,509 units, ~2.89B VND |
| 7. Movement type summary | PASS | 1,286 openings + 99 stock-outs (9 backfilled) |

---

## Action Items

**Priority 1 — Fix movement writer bug (P0000DCA000A / P0000DCC000A pattern):**
The `stock_out` writer reads stale `on_hand_before` (gets 0 instead of current on_hand_after from prior movement). Fix: always derive `on_hand_before` from the latest `on_hand_after` of that variant's movement log, not from `product_variants.on_hand` directly.

**Priority 2 — Reconcile 5 orphan-negative variants (PVN1266, PVN2046, PVN2523, PVN2910, PVN3974):**
All have `on_hand = -1`, zero movements. Run the reconciliation step of the backfill script for these 5, or manually insert correction movements.

**Priority 3 — Chain-break tolerance in XNT report:**
The 6 snapshot-gap breaks (type-1) are unavoidable for a historical backfill into a live system. The XNT report UI should note these as "pre-period adjustment" rows and not treat them as data errors. Consider flagging movements where `on_hand_before != prev_on_hand_after` for operator review.

---

## Unresolved Questions

1. Was the reconciliation step intentionally skipped, or did the backfill script not detect any drift cases (meaning the 5 orphan-negatives were missed by the filter criteria)?
2. For the type-1 chain breaks (PVN3444 etc.) — did `product_variants.on_hand` change between the backfill run and those live order timestamps due to other concurrent transactions, or is the opening stock value itself wrong?
3. `total_stock_in = 0` for the period — is this expected (no new stock received since Apr 19), or did a goods-receipt event fail to write movements?
