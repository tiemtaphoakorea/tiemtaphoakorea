---
title: "Inventory Report Sections"
status: pending
created: "2026-05-07T12:09"
branch: dev
brainstorm: plans/reports/brainstorm-260507-1209-inventory-report.md
---

# Inventory Report Sections

Thêm 3 section báo cáo vào trang `/analytics/inventory`:
1. Tồn kho theo danh mục (chart + table)
2. Xuất nhập tồn — XNT (date range + table)
3. Lịch sử biến động kho (log table)

## Phases

| # | Phase | File | Status |
|---|-------|------|--------|
| 1 | DB & API (XNT endpoint) | [phase-01-db-api.md](phase-01-db-api.md) | pending |
| 2 | UI Components | [phase-02-ui-components.md](phase-02-ui-components.md) | pending |
| 3 | Wire-up & Integration | [phase-03-wire-up.md](phase-03-wire-up.md) | pending |

## Key Dependencies

- Phase 2 blocks on Phase 1 (XNT component needs API + client method)
- Phase 3 blocks on Phase 2 (content page wires up components)

## Context

- Brainstorm: `plans/reports/brainstorm-260507-1209-inventory-report.md`
- Existing analytics page: `apps/admin/app/(dashboard)/analytics/inventory/_content.tsx`
- Existing movement API: `GET /api/admin/inventory/movements` (no changes needed)
- Existing valuation API: `GET /api/admin/analytics/inventory-valuation` (no changes needed)
