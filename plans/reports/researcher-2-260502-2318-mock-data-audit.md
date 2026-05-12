---
title: Unconnected API Calls & TODO Integrations Audit
date: 2026-05-02
researcher: researcher-2
scope: apps/admin + apps/main
---

# Executive Summary

Audited `apps/admin` and `apps/main` for unconnected API integrations, orphaned service methods, dead UI components, and feature placeholders. **No traditional `TODO/FIXME/HACK` comments exist** — but plenty of evidence of incomplete wiring.

Key categories of finding:
1. **Hardcoded placeholder data in UI** with explicit "kept as static placeholder" notes (admin dashboard charts).
2. **Orphaned admin client methods** — defined in `services/admin.client.ts` but never invoked from any UI (16 methods).
3. **Orphaned backend API routes** — Next.js API handlers exist with full DB service support, but no UI consumes them (supplier-orders CRUD, inventory/movements/adjust, settings/customer-tier, customers/[id]/status, users/[id]/reset-password).
4. **Dead UI component** `customer-table.tsx` with toggle-status & delete actions defined but never imported.
5. **Storefront placeholder pages** — `account/`, `account/orders/`, `account/chat/` are empty "coming soon" stubs.
6. **Wishlist** is localStorage-only; no server persistence (no API integration at all).
7. **No cart/checkout/login UI in storefront** — pure browse-only; storefront has no purchase flow.
8. **Unhandled action buttons** — Export buttons (`Xuất Excel`, `Xuất danh sách`) lack onClick handlers.

---

# Findings By Feature Area

## 1. Admin Dashboard (`/admin`)

### F-1.1 Hardcoded 7-day chart data
- **File:** `apps/admin/app/(dashboard)/_content.tsx:38-56`
- **Current:** `REVENUE_DATA` and `ORDERS_DATA` are static arrays.
- **Evidence:** Comment line 38 — `// 7-day series — kept as static placeholder until backend exposes time-series endpoint.`
- **Missing API:** No time-series endpoint exists on the backend. The hardcoded arrays drive both `BarChartMini` charts.
- **State:** Fake.

### F-1.2 Hardcoded "+18% tuần trước" pill
- **File:** `apps/admin/app/(dashboard)/_content.tsx:155`
- **Current:** `<TonePill tone="green">+18% tuần trước</TonePill>` — hardcoded delta string.
- **Missing:** Week-over-week comparison metric not provided by backend.
- **State:** Fake.

## 2. Admin Customers (`/admin/customers`)

### F-2.1 Customer tier inferred client-side
- **File:** `apps/admin/app/(dashboard)/customers/_content.tsx:35-40`
- **Current:** `customerTier()` hardcodes thresholds `5_000_000` / `1_000_000`.
- **Evidence:** Comment line 35 — `/** Tier inference from totalSpent — replicates business rule until tier-config is wired. */`
- **Available API:** `adminClient.getCustomerTierConfig()` and `updateCustomerTierConfig()` exist (`admin.client.ts:481`, `:495`); backend route `/api/admin/settings/customer-tier` is implemented; no UI page or hook consumes them.

### F-2.2 Export button no handler
- **File:** `apps/admin/app/(dashboard)/customers/_content.tsx:100-102`
- **Current:** `<Button variant="outline">Xuất danh sách</Button>` — no onClick, no disabled state.

### F-2.3 No customer block/unblock UI
- **File:** `apps/admin/app/(dashboard)/customers/[id]/_content.tsx`
- **Current:** Only `Edit` action; no toggle-status or delete action despite:
  - Backend route `/api/admin/customers/[id]/status` (active)
  - Backend `DELETE /api/admin/customers/[id]` (active)
  - `adminClient.toggleCustomerStatus()`, `adminClient.deleteCustomer()` defined (`admin.client.ts:472`, `:657`)
  - `CustomerProfileHeader` already shows "Đã bị khóa" badge (read-only).

### F-2.4 Dead component `customer-table.tsx`
- **File:** `apps/admin/components/admin/customers/customer-table.tsx`
- **Current:** Full table with `onToggleStatus`/`onDelete` props, "Chặn/Mở chặn khách hàng" actions (line 182-185).
- **Evidence:** Never imported (grep returned 0 external usage). The current `customers/_content.tsx` builds its own table inline without these actions.
- **Probable cause:** Replaced by inline table during redesign; old component left behind.

### F-2.5 No customer stats widget
- **Available API:** `adminClient.getCustomerStats()` (`admin.client.ts:427`); route `/api/admin/customers/stats` exists.
- **Current:** Method orphaned — no UI consumes total/withOrders/withoutOrders/totalSpent aggregate.

## 3. Admin Users / Staff (`/admin/users`)

### F-3.1 No status toggle UI
- **File:** `apps/admin/app/(dashboard)/users/_content.tsx`
- **Current:** Only `Sửa` (Edit) button per row.
- **Available APIs:**
  - `adminClient.toggleUserStatus()` (`admin.client.ts:647`) → `PATCH /api/admin/users/[id]` with `isActive` flag (route exists, line 60).
  - `adminClient.resetUserPassword()` (`admin.client.ts:663`) → `POST /api/admin/users/[id]/reset-password` (route exists, fully implemented).
- **State:** Backend complete, client methods complete, UI does not invoke them.

### F-3.2 Role filter options inconsistent
- Note: `users/_content.tsx:89-93` lists roles `owner/manager/staff` as filter options, omitting `customer` — minor UX issue, not API.

## 4. Admin Orders (`/admin/orders`)

### F-4.1 Export button no handler
- **File:** `apps/admin/app/(dashboard)/orders/_content.tsx:135-137` and `apps/admin/components/admin/orders/order-header.tsx:17-23`
- **Current:** `<Button variant="outline">Xuất Excel</Button>` (twice) — no onClick.
- **Missing:** No corresponding API endpoint or generation logic.

## 5. Admin Inventory (`/admin/inventory`)

### F-5.1 Manual stock-adjustment UI missing
- **File:** `apps/admin/components/admin/inventory/movements-tab.tsx`
- **Available API:** `adminClient.adjustInventory()` (`admin.client.ts:722`) → `POST /api/admin/inventory/movements/adjust` (route exists; service `adjustInventory` from `inventory.server` correctly wired).
- **Current:** Movements tab is read-only; no UI form/button to create a manual_adjustment movement.
- **State:** Backend & client method ready; no UI invocation.

## 6. Admin Suppliers (`/admin/suppliers`)

### F-6.1 Supplier-orders feature has full backend, zero UI
- **Backend (complete):**
  - Route `/api/admin/supplier-orders/route.ts` (GET list, POST create) — line 1-71
  - Route `/api/admin/supplier-orders/[id]/route.ts` (GET, PATCH, DELETE)
  - Service methods in `@workspace/database/services/supplier.server`
  - Client methods `adminClient.getSupplierOrders()`, `createSupplierOrder()`, `updateSupplierOrderStatus()` (`admin.client.ts:678-688`)
- **UI:** No `/admin/supplier-orders` page exists (grep confirmed). Supplier list page does not link to or surface supplier orders.
- **State:** End-to-end orphan. Either UI is unbuilt or feature was deprioritized.

## 7. Admin Chat (`/admin/chat`)

### F-7.1 No image-upload UI for admin replies
- **File:** `apps/admin/app/(dashboard)/chat/_content.tsx`
- **Current:** Chat composer is text-only; admin can only display incoming images (line 180-182).
- **Available API:** `adminClient.uploadChatImage()` (`admin.client.ts:191`) — backend `/api/admin/chat` POST handles `multipart/form-data` (route file lines 7, 75). Storefront uses analogous `chatClient.uploadImage()` for upload.
- **State:** Backend ready; admin UI lacks upload affordance.

### F-7.2 `getChatRoomDetails` orphan
- **Available API:** `adminClient.getChatRoomDetails()` (`admin.client.ts:178`).
- **Current:** Never invoked. Likely intended for "view full room metadata" which the chat list inlines.

## 8. Admin Settings (`/admin/settings`)

### F-8.1 Customer-tier config has no UI page
- **Backend:** `/api/admin/settings/customer-tier/route.ts` exists.
- **Client:** `getCustomerTierConfig()`, `updateCustomerTierConfig()` defined.
- **UI:** No settings sub-page renders/edits tier thresholds. `customers/_content.tsx` hardcodes thresholds (see F-2.1) — direct evidence the wiring is intentionally pending.

### F-8.2 Legacy `getStats` method
- **File:** `admin.client.ts:118`
- **Current:** Returns `DashboardStats` (combined). Superseded by `getDashboardKPIs/getRecentOrders/getTopProducts` which split by `?section=` query param. Old method dead-code; can be deleted.

## 9. Storefront Account (`/apps/main/app/(store)/account/...`)

### F-9.1 Account index — placeholder text
- **File:** `apps/main/app/(store)/account/page.tsx:8-9`
- **Text:** "Khu vực tài khoản đang được hoàn thiện." ("Account area is being completed.")
- **Current:** Two link cards only — no profile data, no auth check, no API.

### F-9.2 Account orders — placeholder
- **File:** `apps/main/app/(store)/account/orders/page.tsx:8-9`
- **Text:** "Tính năng lịch sử đơn hàng sẽ sớm được cập nhật." ("Order history will be added soon.")
- **Missing API:** No customer-facing `/api/orders/me` route exists. Storefront has no orders endpoint at all.

### F-9.3 Account chat — placeholder
- **File:** `apps/main/app/(store)/account/chat/page.tsx`
- **Current:** Just instructional text pointing to floating chat FAB.

### F-9.4 Wishlist — localStorage only
- **File:** `apps/main/hooks/use-wishlist.ts`
- **Current:** All state persisted via `window.localStorage` (key `k_smart_wishlist`); two empty `catch {}` blocks (lines 20, 28).
- **Missing API:** No wishlist endpoint exists in `apps/main/app/api/`. No DB schema for wishlist (out of scope to confirm here).
- **State:** Single-device, single-browser; data lost on cache clear.

## 10. Storefront Cart / Checkout / Auth

### F-10.1 No cart, no checkout, no login UI
- **Search:** `addToCart`, `cart`, `checkout`, `login` — 0 hits in `apps/main/app/(store)/`.
- **CTA labels** (`Mua ngay`) link only to `PUBLIC_ROUTES.PRODUCTS` listing or category pages.
- **State:** Storefront is browse-only. Major missing flow.

## 11. Mock Data Module (Cleanup-ready)

### F-11.1 Dead `MOCK_*` constants
- **File:** `apps/admin/components/admin/shared/mock-data.ts`
- **Lines:** 22 (`MOCK_PRODUCTS`), 140 (`MOCK_ORDERS`), 223 (`MOCK_SUPPLIERS`), 272 (`MOCK_STAFF`), 323 (`MOCK_WAREHOUSE`), 414 (`MOCK_DEBTS`), 471 (`MOCK_EXPENSES`), 530 (`MOCK_MESSAGES`)
- **Current:** Only `formatVnd` utility is imported (8 callers). All `MOCK_*` arrays unused.
- **Note:** File header comment confirms intent — "Used as placeholder content for the redesigned pages until each is wired".
- **Action:** Move `formatVnd` to a util module; delete `mock-data.ts`. (Cross-ref task #1 — coordinate with researcher-1.)

---

# Priority Matrix

| Priority | Finding | Rationale |
|---|---|---|
| **P1 — Block production** | F-9.1, F-9.2, F-9.4 storefront account & wishlist | Server-side persistence required for multi-device shopper accounts. Localstorage wishlist is data-loss risk. |
| **P1** | F-10.1 cart/checkout/auth | Core e-commerce flow absent. |
| **P2 — Backend ready, UI gap** | F-2.3, F-2.5, F-3.1, F-5.1, F-6.1, F-7.1, F-8.1 | All have functioning APIs + client methods; only UI work remains. Quick wins. |
| **P2** | F-1.1, F-1.2 dashboard time-series | Backend endpoint missing; UI honestly placeholder per code comment. |
| **P2** | F-2.1 customer tier hardcoded | Tier-config endpoint already exists — only UI page + wiring needed. |
| **P3 — Cleanup** | F-2.4 customer-table.tsx, F-8.2 getStats, F-7.2 getChatRoomDetails, F-11.1 MOCK_* arrays | Safe to delete; no callers. |
| **P3 — UX polish** | F-2.2, F-4.1 export buttons | Either implement export pipeline or remove buttons. |

---

# Cross-Reference With Other Researchers

- **Task #1 (Mock data audit):** Overlap on `mock-data.ts` MOCK_* constants and dashboard chart static arrays. Recommend coordinating cleanup PR.
- **Task #3 (Stubs/placeholders):** Overlap on storefront account placeholder pages (F-9.x).

---

# Unresolved Questions

1. Are storefront cart/checkout/auth out-of-scope for current sprint, or scheduled for separate epic?
2. Is wishlist intended to remain localStorage (privacy-first design) or to be migrated to authenticated server storage?
3. Should `Xuất Excel`/`Xuất danh sách` buttons be removed, hidden, or implemented? (No backend export endpoint exists.)
4. Is the time-series endpoint for dashboard charts (F-1.1) on the roadmap or out-of-scope?
5. Why was `customer-table.tsx` left behind — is anyone planning to migrate the page back to it (it has more functionality)?
6. Customer-tier config: should the UI surface as a settings sub-page, or inline in customers list as a modal?
