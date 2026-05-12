---
title: "Sapo-style Reports Expansion (Sales / Purchases / Inventory / Customers + existing Financial)"
description: "Mở rộng /reports thành 5 nhóm báo cáo Sapo-faithful Tier 1, 25 báo cáo con (21 mới + 4 đã có) với filter, KPI, chart, table, drill-down, export."
status: completed
priority: P2
effort: ~40-50h
branch: dev
tags: [reports, admin, sales, purchases, inventory, customers, drizzle, nextjs]
created: 2026-05-12
updated: 2026-05-12
completed: 2026-05-12
---

## Goal
Mở `/reports` từ 4 báo cáo Tài chính → 5 nhóm × 25 báo cáo con (Sapo-faithful Tier 1). Mỗi báo cáo: filter, KPI summary, chart, table phân trang, drill-down, export CSV / XLSX, so sánh kỳ trước nếu phù hợp.

> Tier 2 (returns, channels, shipping, stocktake, RFM, region) note backlog — xem `/Users/kien.ha/.claude/plans/image-1-tr-n-sapo-nifty-hearth.md`.

## Existing assets (giữ nguyên, không đập)
- 4 báo cáo Tài chính: `/reports/profit-loss|customer-debts|supplier-debts|cash-flow`
- `packages/database/src/services/report.server.ts` (812 LOC — **vi phạm rule 200 LOC, MUST split ở phase-02**)
- `apps/admin/services/reports.client.ts`, `apps/admin/lib/{report-formatters,csv-export,xlsx-export}.ts`
- `apps/admin/components/admin/reports/{report-export-menu,debt-transactions-sheet}.tsx`
- `FinanceRangePicker`, `MetricStatBar`, shadcn `chart.tsx`, `data-table.tsx`, `pagination-controls.tsx`

## Architecture decisions
1. **One server file per group**: `report-financial / report-sales / report-purchases / report-inventory / report-customers .server.ts`. Each <200 LOC (split helpers if needed).
2. **One API route per report**: `app/api/admin/reports/{group}/{slug}/route.ts` + `{slug}/export/route.ts`. Mirror existing pattern (auth → parse range → service call → JSON / CSV / XLSX).
3. **One page per report**: `app/(dashboard)/reports/{group}/{slug}/{page.tsx,_content.tsx}` mirroring `profit-loss` shape.
4. **Hub page** = grouped card grid + sidebar pre-populated subitems collapsed by group. Single `/reports` link in sidebar (top-level) — hub shows 5 sections (Bán hàng / Nhập hàng / Kho / Khách hàng / Tài chính).
5. **NO new schema tables**. All aggregates live-derived from existing tables. Indexes added only if missing & needed (note in phase risk section).
6. **No mocks, no fake data**. Aggregate SQL only.

## Phases

| # | Phase | Status | Effort | Blockers |
|---|-------|--------|--------|----------|
| 01 | [Routes + Sidebar + Hub](phase-01-routes-and-sidebar.md) | ✅ completed | 2-3h | — |
| 02 | [Split report.server.ts](phase-02-split-report-service.md) | ✅ completed | 2-3h | 01 |
| 03 | [Sales Reports (8 reports)](phase-03-sales-reports.md) | ✅ completed | 12-14h | 01, 02 |
| 04 | [Purchases Reports (5 reports)](phase-04-purchases-reports.md) | ✅ completed | 7-9h | 01, 02 |
| 05 | [Inventory Reports (4 reports)](phase-05-inventory-reports.md) | ✅ completed | 7-9h | 01, 02 |
| 06 | [Customers Reports (4 reports)](phase-06-customers-reports.md) | ✅ completed | 5-6h | 01, 02 |
| 07 | [Testing + Polish](phase-07-testing-and-polish.md) | ⚠️ partial | 4-5h | 03-06 |

> Phase 07 partial: typecheck + lint pass (cả 2 packages). Build / smoke 25 báo cáo / cross-check data consistency / a11y Lighthouse cần manual testing với dev server + DB seed data — user chạy riêng.

Phases 03-06 đều có thể chạy song song sau phase 02. Phase 07 gate cuối.

## Reports inventory (21 báo cáo mới + 4 hiện có = 25)
- **Bán hàng (8)**: by-time, by-staff, by-product, **by-customer**, by-order, payments-by-method, **payments-by-staff**, **payments-by-time**
- **Nhập hàng (5)**: by-time, by-supplier, by-product, **by-staff**, payouts-by-method
- **Kho (4)**: current-stock, **ledger** (sổ kho per-variant), in-out-movement (xuất-nhập-tồn so kỳ), low-stock
- **Khách hàng (4)**: top-by-revenue, top-by-orders, new-vs-returning, **by-product**
- **Tài chính (4 existing)**: profit-loss, customer-debts, supplier-debts, cash-flow

> **Bold** = báo cáo mới thêm so với plan ban đầu (Tier 1 expansion).
> Đã bỏ `inventory/stock-value` (overlap với current-stock — gộp KPI value vào current-stock).

## Cross-cutting standards
- shadcn-first; không viết `<input>`/`<button>` thô
- File <200 LOC, kebab-case naming, descriptive
- Server queries: parameterized via Drizzle `sql`/`and`/`gte`/`lte`; date inputs normalized via shared `normalizeRange` helper (move to `report-shared.server.ts`)
- Auth: `requireApiUser(request, "owner")` cho mọi route (giống pattern hiện có; phase 07 review nếu cần mở cho manager)
- Export: 3 formats `csv|csv-detail|xlsx` via `csvResponse / csvSectionsResponse / xlsxResponse`
- Pagination: server-side, default 20, max 200 (đồng nhất với `PAGINATION_DEFAULT`)
- Period compare: optional `compare=1` flag, dùng `previousPeriod` helper (move to shared)
- Loading: skeleton rows; Empty: `data-state` helpers; Error: try/catch + 500 JSON

## Decisions (chốt sau brainstorm 2026-05-12)
1. ❌ **Single-branch**: KHÔNG làm báo cáo theo chi nhánh. Bỏ filter "Chi nhánh" mọi nơi.
2. ✅ **Phân quyền**: `requireApiUser(request, "owner")` cho mọi route reports.
3. ✅ **Sổ kho + Xuất-nhập-tồn**: dùng chung helper từ `inventory_movements` (giả định ghi đủ loại).
4. ✅ **Khách hàng by-product**: `COUNT(DISTINCT customer_id)` join `order_items` × `orders`.
5. ✅ **Sidebar**: 1 link flat `/reports` → hub 5 sections (giữ thiết kế phase-01).

## Unresolved questions
1. **Trả hàng / hoàn hàng** (Tier 2): cần schema `returns` + `return_items` + flow admin. Out of scope plan này.
2. **Multi-channel** (Tier 2): cần `orders.channel_id`. Out of scope.
3. **WAC**: dùng `productVariants.costPrice` snapshot (đã là WAC theo supplier receipt logic). Giả định real-time.
4. **Inventory snapshot lịch sử**: không có bảng `daily_inventory_snapshot` → giá trị kho ở `current-stock` chỉ phản ánh **hiện tại**. UI ghi rõ "tại thời điểm xem".
5. **Performance**: 21 báo cáo aggregate SQL. Phase 07 chạy `EXPLAIN ANALYZE`; thêm index nếu N>100k rows.
6. **`orders.created_by` null** ở đơn cũ pre-staff-tracking → bucket "Chưa rõ NV" cho báo cáo by-staff.
