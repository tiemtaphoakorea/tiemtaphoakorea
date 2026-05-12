# Phase 02 — Split `report.server.ts` into Domain Files

## Context Links
- Plan: [plan.md](./plan.md)
- Current file: `packages/database/src/services/report.server.ts` (812 LOC — vi phạm rule 200 LOC)
- Import sites: 11 (all in `apps/admin/app/api/admin/reports/`)

## Overview
- **Priority**: P1 (gate cho phase 03-06; viết logic mới sẽ thêm vào các file đã split)
- **Status**: pending
- **Brief**: Refactor 812-LOC `report.server.ts` → 1 shared helper + 5 domain files. **NO logic change**. Tất cả import sites cập nhật theo. Build PHẢI pass sau phase này.

## Key Insights
- 11 import sites, đều `apps/admin/app/api/admin/reports/{slug}/route.ts` và `{slug}/export/route.ts`.
- Symbol map hiện tại:
  - `getProfitLossReport` + types `PnLMetrics`, `ProfitLossReport` → financial
  - `getCustomerDebtsReport`, `getCustomerDebtTransactions` + types → financial (debts)
  - `getSupplierDebtsReport`, `getSupplierDebtTransactions` + types → financial (debts)
  - `getCashFlowReport`, `getCashFlowTransactions` + types → financial
  - Helpers `normalizeRange`, `previousPeriod`, `deltaPct`, `TRUNC_FMT` → shared
- Hiện cả 4 báo cáo tài chính là financial → cleaner là gom toàn bộ vào `report-financial.server.ts` + tách helper ra `report-shared.server.ts`. Group khác (sales/purchases/...) sẽ được TẠO ở phase 03-06.
- Re-export barrel ở `report.server.ts` để zero breakage (giữ import path cũ HOẠT ĐỘNG).

## Requirements
**Functional**
- Tất cả 11 import sites compile + chạy không đổi behavior.
- File `report-financial.server.ts` chứa 4 báo cáo tài chính + types.
- File `report-shared.server.ts` chứa helpers + constants chung.
- `report.server.ts` thành barrel re-export (`export * from "./report-financial.server"` + `report-shared.server`) → backward compat.

**Non-functional**
- Mỗi file <200 LOC. `report-financial.server.ts` dự kiến ~700 LOC → **MUST split tiếp** thành 4 sub:
  - `report-financial-profit-loss.server.ts`
  - `report-financial-customer-debts.server.ts`
  - `report-financial-supplier-debts.server.ts`
  - `report-financial-cash-flow.server.ts`
  - `report-financial.server.ts` = barrel re-export 4 files trên.

## Architecture
```
packages/database/src/services/
├── report-shared.server.ts                       (~40 LOC: helpers, TRUNC_FMT, types)
├── report-financial-profit-loss.server.ts        (~90 LOC)
├── report-financial-customer-debts.server.ts     (~200 LOC)
├── report-financial-supplier-debts.server.ts     (~200 LOC)
├── report-financial-cash-flow.server.ts          (~200 LOC)
├── report-financial.server.ts                    (~20 LOC barrel)
├── report-sales.server.ts                        (phase 03)
├── report-purchases.server.ts                    (phase 04)
├── report-inventory.server.ts                    (phase 05)
├── report-customers.server.ts                    (phase 06)
└── report.server.ts                              (~30 LOC: re-export barrel — DEPRECATED, sẽ remove sau khi update import sites)
```

**Migration approach**: GIỮ `report.server.ts` làm re-export barrel TRONG phase này → ZERO import-site change cần thiết. Phase 07 (polish) sẽ chuyển import sites sang file domain & xóa barrel cũ nếu time cho phép (optional).

## Related Code Files

**Modify**
- `packages/database/src/services/report.server.ts` — thay nội dung bằng barrel re-export (~30 LOC).

**Create**
- `packages/database/src/services/report-shared.server.ts`
- `packages/database/src/services/report-financial-profit-loss.server.ts`
- `packages/database/src/services/report-financial-customer-debts.server.ts`
- `packages/database/src/services/report-financial-supplier-debts.server.ts`
- `packages/database/src/services/report-financial-cash-flow.server.ts`
- `packages/database/src/services/report-financial.server.ts`

**Delete**: none (yet)

## Implementation Steps
1. Tạo `report-shared.server.ts` — extract `normalizeRange`, `previousPeriod`, `deltaPct`, `TRUNC_FMT` + export typed.
2. Tạo `report-financial-profit-loss.server.ts` — move `PnLMetrics`, `ProfitLossReport`, `toPnLMetrics`, `getProfitLossReport`. Import từ `report-shared.server.ts` + `finance.server.ts`.
3. Tạo `report-financial-customer-debts.server.ts` — move `CustomerDebtRow`, `CustomerDebtsReport`, `DebtTransaction`, `getCustomerDebtsReport`, `getCustomerDebtTransactions`.
4. Tạo `report-financial-supplier-debts.server.ts` — move `SupplierDebtRow`, `SupplierDebtsReport`, `SupplierDebtTransaction`, `getSupplierDebtsReport`, `getSupplierDebtTransactions`.
5. Tạo `report-financial-cash-flow.server.ts` — move `CashFlowPeriodRow`, `CashFlowReport`, `CashFlowTransaction`, `getCashFlowReport`, `getCashFlowTransactions`.
6. Tạo `report-financial.server.ts` — `export * from` 4 sub-files.
7. Replace `report.server.ts` nội dung = `export * from "./report-financial.server";` + `export * from "./report-shared.server";`.
8. Strip junk: bỏ `void asc; void lt; void or; void ilike;` dòng cuối file gốc.
9. `pnpm --filter database typecheck` + `pnpm --filter admin typecheck` + `pnpm --filter admin build` pass.

## Todo List
- [ ] Create `report-shared.server.ts`
- [ ] Create 4 `report-financial-{slug}.server.ts`
- [ ] Create `report-financial.server.ts` barrel
- [ ] Rewrite `report.server.ts` as barrel
- [ ] Strip unused `void asc` etc.
- [ ] `pnpm --filter database typecheck` pass
- [ ] `pnpm --filter admin typecheck` pass
- [ ] `pnpm --filter admin build` pass
- [ ] Smoke test 4 báo cáo hiện có: load page + click export CSV

## Success Criteria
- Build pass, no behavior change.
- 4 báo cáo hiện có vẫn render data + export đúng.
- Mỗi file mới <200 LOC.
- `report.server.ts` <50 LOC barrel.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Forgotten symbol breaks import | M | H | Grep tất cả symbol names sau move; `tsc` catch |
| Circular import giữa shared và financial | L | M | Shared chỉ phụ thuộc drizzle + schema, không phụ thuộc finance |
| Behavior drift do refactor (e.g. sai SQL paste) | L | H | Diff line-by-line; smoke test load page profit-loss + export CSV |
| `finance.server.getFinancialStats` cycle | L | M | Profit-loss file import finance.server (one-way), OK |

## Security
- No auth change. Service file vẫn server-only (`.server.ts` suffix).

## Rollback Plan
- `git revert` toàn bộ commit — barrel approach giữ tương thích, revert là one-shot.

## Next Steps
- Phase 03-06 viết logic mới (mỗi phase tạo file `report-{group}.server.ts` riêng, không động vào financial).
