# Phase 07 — Testing, Polish, Performance, Accessibility

## Context Links
- Plan: [plan.md](./plan.md)
- All phases 01-06

## Overview
- **Priority**: P1 (gate trước khi merge)
- **Status**: pending
- **Brief**: Cross-cutting QA pass: typecheck/lint/build, smoke 21 báo cáo mới + 4 cũ, export verify, a11y, cross-report data consistency, perf check.

## Key Insights
- Báo cáo Sapo phải có "tổng cross-check" (Sales by-time tổng = Sales by-staff tổng = Sales by-product tổng).
- Export CSV mở chuẩn Excel (UTF-8 BOM + delimiter check).
- XLSX dùng `exceljs` — verify currency format không vỡ.
- Sidebar collapse/expand vẫn ok với 1 link `Báo cáo`.

## Requirements
**Functional**
- 21 báo cáo mới + 4 báo cáo cũ (= 25) load < 3s với dataset hiện tại.
- Empty state hiển thị đúng (no data trong kỳ).
- Loading state hiển thị skeleton.
- Error state hiển thị toast `useToast`.

**Non-functional**
- `pnpm --filter admin typecheck` + `pnpm --filter admin lint` + `pnpm --filter admin build` pass.
- Lighthouse a11y > 90.

## Architecture
N/A — verification phase.

## Related Code Files

**Modify (potential, on findings)**
- Service files (composite index proposals, query optimization)
- UI pages (a11y fixes, loading skeleton)

**Create (if needed)**
- `packages/database/drizzle/{NNNN}_reports_indexes.sql` migration (qua `pnpm db:generate`) — chỉ nếu thiếu index cần thiết

## Implementation Steps
1. **Static checks**:
   - `pnpm --filter admin typecheck`
   - `pnpm --filter admin lint`
   - `pnpm --filter database typecheck`
   - `pnpm --filter admin build`
2. **Smoke 25 báo cáo** (manual checklist):
   - Load page, KPI hiển thị, chart render, table render.
   - Date range thay đổi → refetch.
   - Compare toggle (where applicable).
   - Search/filter functional.
   - Pagination chuyển trang.
   - Drill-down sheet mở + render.
   - Export CSV download + open Excel.
   - Export XLSX download + open Excel với currency format.
3. **Cross-check data consistency**:
   - Sum(Sales by-time.revenue) ≡ Sum(Sales by-staff.revenue) ≡ Sum(Sales by-product.revenue) ≡ Sum(Sales by-customer.revenue) trong cùng kỳ
   - Sum(Sales payments-by-method.total) ≡ Sum(Sales payments-by-staff.total) ≡ Sum(Sales payments-by-time.total) — 3 chiều cùng số
   - Sum(Sales payments-by-method.total) ≤ Sum(Sales by-time.revenue) (vì có đơn còn nợ)
   - Sum(Purchases by-time.payable) ≡ Sum(Purchases by-supplier.payable) ≡ Sum(Purchases by-staff.payable)
   - Customers (new + returning).count = distinct customers having orders in period
   - Sum(Customers by-product.revenue) ≡ Sum(Sales by-product.revenue) cùng kỳ
   - Inventory ledger 5.2 (per-variant): SUM(qty_in) - SUM(qty_out) + opening = closing
   - Inventory in-out-movement 5.3 KPI tổng nhập/xuất khớp với SUM ledger 5.2 cùng kỳ
   - Inventory current-stock KPI "Tổng giá trị" = SUM(onHand × costPrice) sample query
   - Inventory stock-value total = SUM(onHand × costPrice) qua query thẳng DB
4. **Performance check**:
   - `EXPLAIN ANALYZE` các báo cáo nặng (5.2 in-out-movement, 3.3 by-product, 6.3 new-vs-returning)
   - Note query mất >500ms; đề xuất index nếu cần (e.g. composite `(created_at, cancelled_at) WHERE cancelled_at IS NULL`)
   - **NẾU CẦN INDEX MIGRATION**: dùng `pnpm db:generate` (theo memory feedback)
5. **A11y**:
   - Tab navigation các form filter
   - Aria-labels cho icon-only buttons
   - Color contrast cho TonePill + chart colors (verify dark text on light background)
6. **Responsive**:
   - Mobile (< 768px): table scroll horizontal, KPI grid stack
   - Sidebar collapse: tooltip "Báo cáo" hiển thị
7. **Docs sync**:
   - Update `docs/codebase-summary.md` — thêm section Reports module
   - Update `docs/project-changelog.md` — entry feat(reports) expand to 5 groups
8. **Polish**:
   - Vietnamese copy review (date labels, KPI titles)
   - Empty state copy mỗi báo cáo
   - Footer disclaimer "Số liệu không trừ hoàn hàng" cho sales reports

## Todo List
- [ ] `pnpm --filter admin typecheck`
- [ ] `pnpm --filter admin lint`
- [ ] `pnpm --filter database typecheck`
- [ ] `pnpm --filter admin build`
- [ ] Smoke 21 reports — manual checklist
- [ ] Data consistency cross-check
- [ ] EXPLAIN ANALYZE 3 báo cáo nặng
- [ ] Index migration nếu cần (`pnpm db:generate`)
- [ ] A11y check
- [ ] Responsive check
- [ ] `docs/codebase-summary.md` update
- [ ] `docs/project-changelog.md` entry
- [ ] Vietnamese copy review
- [ ] Empty state copy review

## Success Criteria
- Build green, typecheck green, lint green.
- 21 báo cáo render đúng với seed dataset.
- Data consistency checks pass.
- A11y > 90.
- No console errors.
- Export CSV + XLSX open trong Excel không lỗi format.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Query chậm > 2s với prod dataset | M | H | EXPLAIN + index proposal; lazy-load chart vs table; cache (TanStack 60s staleTime) |
| Inconsistent revenue numbers giữa báo cáo | M | H | Centralized revenue expression in `report-shared.server.ts` (đã plan phase 03) |
| Sidebar regression (label change) | L | M | Smoke test sidebar render + role-based visibility |
| Export file encoding (Vietnamese characters) | M | M | UTF-8 BOM trong csvResponse (verify) |
| Migration file mistakenly created without `pnpm db:generate` | L | H | Memory feedback noted — chỉ qua CLI |

## Security
- Final review: confirm `requireApiUser(_, "owner")` ở mọi route mới.
- Confirm cost/profit data không leak qua role manager (nếu mở rộng).

## Rollback
- Per-phase rollback strategy đã plan ở mỗi phase 01-06.
- Polish-only changes (docs, copy) → revert commit.

## Next Steps
- Code review (delegate `code-reviewer` agent).
- Merge sau review approve.
- Post-merge: monitor production query latency tuần đầu.
