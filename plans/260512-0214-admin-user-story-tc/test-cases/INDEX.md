# Admin App — User Story Test Cases (INDEX)

> **Walk-through date**: 2026-05-12
> **Branch**: dev (HEAD `6fcc621`)
> **Base URL**: `http://localhost:3001` (admin), `http://localhost:3000` (storefront)
> **Test user**: `admin` / `password123` (Owner role)
> **Coverage scope**: 19 admin modules + login + reports route

## Test case ID convention

- `US-<MODULE>-I###` — **Interaction** test cases (UI/UX behavior)
- `US-<MODULE>-B###` — **Business** test cases (domain rules, server-side invariants)

## Module inventory

| Priority | Module | File | Sidebar label | Coverage hiện tại trong docs/035-QA |
|----------|--------|------|---------------|-------------------------------------|
| P0 | purchases | [02-purchases.md](./02-purchases.md) | Đặt hàng nhập | — (mới) |
| P0 | receipts | [03-receipts.md](./03-receipts.md) | Nhập hàng | — (mới) |
| P0 | payouts | [04-payouts.md](./04-payouts.md) | Phiếu chi NCC | — (mới) |
| P0 | debts | [05-debts.md](./05-debts.md) | Công nợ | — (mới) |
| P0 | inventory | [06-inventory.md](./06-inventory.md) | Quản lý kho | TC-PROD-010,018 chạm |
| P0 | settings | [07-settings.md](./07-settings.md) | Cửa hàng | — (mới) |
| P0 | content | [08-content.md](./08-content.md) | Nội dung website | — (mới) |
| P0 | homepage | [09-homepage.md](./09-homepage.md) | Trang chủ | — (mới) |
| P1 | products | [10-products.md](./10-products.md) | Sản phẩm | TC-PROD-001..022 |
| P1 | orders | [11-orders.md](./11-orders.md) | Đơn hàng | TC-ORD-001..028 |
| P1 | customers | [12-customers.md](./12-customers.md) | Khách hàng | TC-CUST-001..012 |
| P1 | suppliers | [13-suppliers.md](./13-suppliers.md) | Nhà cung cấp | TC-SUP-001..005 |
| P1 | users | [14-users.md](./14-users.md) | Nhân sự | TC-USER-001..005 |
| P1 | expenses | [15-expenses.md](./15-expenses.md) | Chi phí | TC-EXP-001..005 |
| P1 | chat | [16-chat.md](./16-chat.md) | Tin nhắn | TC-CHAT-001..014 |
| P2 | dashboard | [01-dashboard.md](./01-dashboard.md) | Dashboard | TC-DASH-001..012 |
| P2 | analytics | [17-analytics.md](./17-analytics.md) | Phân tích | TC-ANALYTIC-001..002 |
| P2 | categories | [18-categories.md](./18-categories.md) | Danh mục | TC-CAT-001..005 |
| P2 | supplier-orders | [19-supplier-orders.md](./19-supplier-orders.md) | (không có nav) | TC-SUP-ORDER-001..028 |
| P2 | widgets | [20-widgets.md](./20-widgets.md) | Tiện ích | — |
| P2 | reports | [21-reports.md](./21-reports.md) | Báo cáo tài chính | — |
| Public | login | [00-login.md](./00-login.md) | — | TC-AUTH-001..015 |

## Sidebar groupings (observed)

- **Quản trị**: Dashboard, Sản phẩm, Danh mục, Đơn hàng
- **Tài chính**: Công nợ, Chi phí, Phân tích, Báo cáo tài chính
- **Kho vận**: Quản lý kho, Đặt hàng nhập, Nhập hàng, Phiếu chi NCC, Nhà cung cấp
- **Người dùng**: Khách hàng, Nhân sự, Tin nhắn
- **Cài đặt**: Trang chủ, Cửa hàng, Nội dung website, Tiện ích

## Seed state snapshot (2026-05-12)

- Products: 1399 | Categories: 12 | Orders: 219 new | Debts: 7 outstanding
- Top product `Kính Rieti CARTELLA` (1,409 sold), recent orders all status "Chờ xử lý"
- Dashboard widgets: revenue 7d (+17%), orders 7d (0 today), top products, recent orders, KPI cards

## Notes

- `/supplier-orders` không xuất hiện trong sidebar — có thể đã bị deprecated thay bằng `/purchases` + `/receipts`. Cần xác nhận trước khi viết TC.
- `/reports` xuất hiện trong sidebar nhưng KHÔNG có folder `apps/admin/app/(dashboard)/reports/` — có thể route alias hoặc 404. Kiểm tra khi walk.
- `Tiện ích` (`/widgets`) — chưa rõ public-facing hay dev/test page. Xác nhận khi walk.

## Status (2026-05-12)

✅ **Walk-through complete for all 22 files.**

- 8 P0 modules (new, no prior TC): purchases, receipts, payouts, debts, inventory, settings, content, homepage
- 7 P1 modules (existing TC extended): products, orders, customers, suppliers, users, expenses, chat
- 5 P2 modules: dashboard, analytics, categories, supplier-orders, widgets
- Plus: login (`00-login.md`), reports (`21-reports.md`)

**Totals**: ~290 user stories (~190 Interaction, ~100 Business).

**Bugs uncovered while writing**: 6 — see `../GAP-REPORT.md` section D.

## Linked artifacts

- Plan: `../plan.md`
- Source: `apps/admin/app/(dashboard)/<module>/`
- Services: `packages/database/src/services/<module>.server.ts`
- Schemas: `packages/database/src/schema/`
- Existing TC docs: `docs/035-QA/Test-Cases/`
- Gap report: `../GAP-REPORT.md`
