# Phase 01 — Routes, Sidebar, Hub UI

## Context Links
- Plan: [plan.md](./plan.md)
- Routes file: `packages/shared/src/routes.ts:78-83`
- Sidebar: `apps/admin/components/layout/admin-sidebar.tsx:67-73`
- Hub: `apps/admin/app/(dashboard)/reports/_content.tsx`

## Overview
- **Priority**: P1 (gate cho phase 03-06)
- **Status**: pending
- **Brief**: Bổ sung 21 route constants + sidebar relabel + hub UI grouped theo 5 nhóm Sapo Tier 1.

## Key Insights
- Sidebar hiện chỉ 1 link `Báo cáo tài chính` → đổi label thành `Báo cáo` (giữ visibleForRole owner).
- Hub `_content.tsx` đang flat list 4 cards — refactor thành 5 sections, mỗi section 1 grid sub-cards.
- Route constants follow camelCase keys + `REPORTS_{GROUP}_{SLUG}` pattern, slug short single-noun (per CLAUDE.md).
- Slug naming chốt: `by-time | by-staff | by-product | by-customer | by-order | payments-by-method | payments-by-staff | payments-by-time | by-supplier | payouts-by-method | current-stock | ledger | in-out-movement | low-stock | top-by-revenue | top-by-orders | new-vs-returning`.
- Đã bỏ `inventory/stock-value` (gộp KPI value vào `current-stock`).
- KHÔNG có route theo chi nhánh (single-branch decision).

## Requirements
**Functional**
- 21 route constants thêm mới cho group `sales/purchases/inventory/customers`.
- Sidebar label `Báo cáo` (single link → hub).
- Hub `/reports` render 5 sections; mỗi card link tới sub-report (chỉ link, page sẽ stub TBD trong phase tiếp).

**Non-functional**
- Backward compat: 4 routes tài chính cũ giữ nguyên hoạt động (constants không đổi tên).
- File <200 LOC.

## Architecture
```
ADMIN_ROUTES
├── REPORTS                              (hub)
├── REPORTS_PROFIT_LOSS                  (existing)
├── REPORTS_CUSTOMER_DEBTS               (existing)
├── REPORTS_SUPPLIER_DEBTS               (existing)
├── REPORTS_CASH_FLOW                    (existing)
│   # Sales (8)
├── REPORTS_SALES_BY_TIME
├── REPORTS_SALES_BY_STAFF
├── REPORTS_SALES_BY_PRODUCT
├── REPORTS_SALES_BY_CUSTOMER            ⭐ NEW
├── REPORTS_SALES_BY_ORDER
├── REPORTS_SALES_PAYMENTS_BY_METHOD
├── REPORTS_SALES_PAYMENTS_BY_STAFF      ⭐ NEW
├── REPORTS_SALES_PAYMENTS_BY_TIME       ⭐ NEW
│   # Purchases (5)
├── REPORTS_PURCHASES_BY_TIME
├── REPORTS_PURCHASES_BY_SUPPLIER
├── REPORTS_PURCHASES_BY_PRODUCT
├── REPORTS_PURCHASES_BY_STAFF           ⭐ NEW
├── REPORTS_PURCHASES_PAYOUTS_BY_METHOD
│   # Inventory (4)
├── REPORTS_INVENTORY_CURRENT_STOCK
├── REPORTS_INVENTORY_LEDGER             ⭐ NEW (sổ kho)
├── REPORTS_INVENTORY_IN_OUT_MOVEMENT
├── REPORTS_INVENTORY_LOW_STOCK
│   # Customers (4)
├── REPORTS_CUSTOMERS_TOP_BY_REVENUE
├── REPORTS_CUSTOMERS_TOP_BY_ORDERS
├── REPORTS_CUSTOMERS_NEW_VS_RETURNING
└── REPORTS_CUSTOMERS_BY_PRODUCT         ⭐ NEW
```
> Đã loại `REPORTS_INVENTORY_STOCK_VALUE` (gộp vào current-stock).

## Related Code Files

**Modify**
- `packages/shared/src/routes.ts` — bổ sung 21 constants vào `ADMIN_ROUTES`.
- `apps/admin/components/layout/admin-sidebar.tsx:72` — label `"Báo cáo tài chính"` → `"Báo cáo"`.
- `apps/admin/app/(dashboard)/reports/_content.tsx` — refactor sang 5 sections.

**Create** (placeholder, content phase 03-06)
- `apps/admin/app/(dashboard)/reports/sales/{by-time,by-staff,by-product,by-customer,by-order,payments-by-method,payments-by-staff,payments-by-time}/{page.tsx,_content.tsx}` (16 file stub)
- Same cho `purchases/{by-time,by-supplier,by-product,by-staff,payouts-by-method}` (10 file stub)
- Same cho `inventory/{current-stock,ledger,in-out-movement,low-stock}` (8 file stub)
- Same cho `customers/{top-by-revenue,top-by-orders,new-vs-returning,by-product}` (8 file stub)
- → tổng 42 file stub. Stub: `_content.tsx` return `<div>Coming soon</div>`; `page.tsx` 1-line import (mirror existing pattern).

**Delete**: none

## Implementation Steps
1. Add 21 constants vào `routes.ts` (sau dòng 83), group bằng comment block per nhóm Sapo.
2. Sidebar: đổi label `"Báo cáo tài chính"` → `"Báo cáo"`; giữ icon `FileBarChart2`; giữ `visibleForRole` owner.
3. Refactor `reports/_content.tsx`: array `REPORT_GROUPS: { label, icon, reports: { href, title, description, icon, iconClass }[] }[]` — render `<section>` per group với `SidebarGroupLabel`-style heading + grid 2 cols. Cards giữ class hiện có (Card + CardContent + hover shadow). Section order: Bán hàng → Nhập hàng → Kho → Khách hàng → Tài chính.
4. Generate 42 file stub: `page.tsx` chỉ chứa `export { default } from "./_content"` hoặc `<XContent />`. `_content.tsx` render heading + breadcrumb-link về `/reports` + placeholder "Đang phát triển" (sẽ overwrite ở phase 03-06).
5. Compile check: `pnpm --filter admin typecheck`.

## Todo List
- [ ] Add 21 constants `routes.ts`
- [ ] Update sidebar label
- [ ] Refactor hub `_content.tsx` 5 sections (order Bán → Nhập → Kho → KH → TC)
- [ ] Generate 42 stub pages (8+5+4+4 reports × 2 files + 5 hub stubs nếu cần)
- [ ] `pnpm --filter admin typecheck` pass

## Success Criteria
- Sidebar render `Báo cáo` link, click → hub hiển thị 5 nhóm.
- Mỗi card link tới route stub render OK (không 404).
- Type-check pass; no console errors.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Stub pages bị Next render thiếu metadata | L | L | Mỗi `_content.tsx` set title cơ bản |
| Constants collision với existing | L | M | Prefix `REPORTS_` + group + slug đảm bảo unique |
| Hub layout vỡ ở mobile | L | M | `grid gap-3 md:grid-cols-2` (already existing pattern) |

## Security
- Hub & sub-routes vẫn nằm trong `(dashboard)` group → đã có server-side auth gate (`requireApiUser` ở API layer).
- `visibleForRole(REPORTS) === owner` — phase 07 review nếu cần mở rộng cho manager.

## Next Steps
- Phase 02 split service trước khi viết logic.
