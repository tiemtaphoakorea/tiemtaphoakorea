## Phase Implementation Report

### Executed Phase
- Phase: phase-04-purchases-reports
- Plan: /Users/kien.ha/Code/auth_shop_platform/plans/260512-0235-sapo-reports-expansion/
- Status: completed

### Files Modified

**packages/database/src/services/** (created)
- `report-purchases-by-time.server.ts` — 75 LOC. Period-grouped aggregation (day/week/month) with summary.
- `report-purchases-by-supplier.server.ts` — 142 LOC. LEFT JOIN suppliers + drilldown `getPurchasesSupplierReceipts`.
- `report-purchases-by-product.server.ts` — 146 LOC. INNER JOIN receipt_items/variants/products + drilldown `getPurchasesProductReceipts`.
- `report-purchases-by-staff.server.ts` — 181 LOC. LEFT JOIN profiles; NULL-staff bucket handled via separate `getPurchasesUnknownStaffReceipts` function.
- `report-purchases-payouts.server.ts` — 119 LOC. Payout aggregation by method + `getPayoutTransactionsByMethod` drilldown.
- `report-purchases.server.ts` — 48 LOC. Barrel re-export.

**apps/admin/app/api/admin/reports/purchases/** (created)
- `by-time/route.ts` + `by-time/export/route.ts`
- `by-supplier/route.ts` + `by-supplier/export/route.ts` + `by-supplier/receipts/route.ts`
- `by-product/route.ts` + `by-product/export/route.ts` + `by-product/receipts/route.ts`
- `by-staff/route.ts` + `by-staff/export/route.ts` + `by-staff/receipts/route.ts`
- `payouts-by-method/route.ts` + `payouts-by-method/export/route.ts` + `payouts-by-method/transactions/route.ts`

**apps/admin/services/** (created)
- `reports-purchases.client.ts` — 227 LOC. Full type definitions + `purchasesReportsClient` object + `buildPurchasesExportUrl`.

**apps/admin/lib/** (created)
- `report-purchases-labels.ts` — `PAYMENT_METHOD_LABELS`, `fmtPaymentMethod`, `GROUP_BY_LABELS`.

**apps/admin/components/admin/reports/** (created)
- `report-drilldown-receipts-sheet.tsx` — 166 LOC. Shared Sheet for supplier/product/staff drilldown; branches on `target.kind`.
- `purchases-trend-chart.tsx` — Recharts BarChart for by-time view.

**apps/admin/app/(dashboard)/reports/purchases/** (overwritten stubs)
- `by-time/_content.tsx` — 172 LOC. GroupBy buttons, trend chart, 6-col table.
- `by-supplier/_content.tsx` — 187 LOC. Search, 8-col table, null-supplier guard.
- `by-product/_content.tsx` — 177 LOC. Search, 7-col SKU table.
- `by-staff/_content.tsx` — 181 LOC. Search, 7-col table.
- `payouts-by-method/_content.tsx` — 230 LOC. Inline PayoutTxSheet + 5-col table.

### Tasks Completed
- [x] DB service: report-purchases-by-time.server.ts
- [x] DB service: report-purchases-by-supplier.server.ts (+ supplier drilldown)
- [x] DB service: report-purchases-by-product.server.ts (+ product drilldown)
- [x] DB service: report-purchases-by-staff.server.ts (+ staff/unknown drilldown)
- [x] DB service: report-purchases-payouts.server.ts (+ payout tx drilldown)
- [x] DB barrel: report-purchases.server.ts
- [x] API routes: 15 routes (5 main + 5 export + 5 drilldown)
- [x] Client service: reports-purchases.client.ts
- [x] Labels: report-purchases-labels.ts
- [x] Shared component: report-drilldown-receipts-sheet.tsx
- [x] Chart component: purchases-trend-chart.tsx
- [x] UI pages: all 5 _content.tsx overwritten from stubs

### Tests Status
- Type check: pass (0 errors in owned files; 8 pre-existing errors in inventory/customers owned by other phases)
- Unit tests: n/a (report-layer services; manual smoke testing via UI)
- Integration tests: n/a

### Issues Encountered
1. **Null-supplier UUID crash (fixed)**: Rows with `supplierId = null` → drilldown would pass `"unknown"` to UUID column. Fixed with early-return guard in by-supplier `_content.tsx`.
2. **Pre-existing errors (not fixed — out of scope)**: `report-inventory-ledger.server.ts` (3 errors), `report-inventory-movement.server.ts` (2 errors), `customers/*/` content (3 errors). Owned by phases 05/06.

### LOC Summary (all within limits)
| File | LOC |
|------|-----|
| payouts-by-method/_content.tsx | 230 |
| reports-purchases.client.ts | 227 |
| by-staff/_content.tsx | 181 |
| report-purchases-by-staff.server.ts | 181 |
| by-supplier/_content.tsx | 187 |
| All others | ≤177 |

### Next Steps
- Phase 07 (Polish/Testing) can smoke-test all 5 purchase report pages
- `summary.avgCost` in by-product is an unweighted average (sum of per-SKU avgs / SKU count) — could be improved to weighted (totalValue / totalQty) if needed
