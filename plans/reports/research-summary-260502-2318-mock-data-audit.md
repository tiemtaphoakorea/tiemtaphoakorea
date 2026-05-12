# Mock Data & Unconnected API Audit — Synthesis Report

**Date:** 2026-05-02 | **Branch:** dev | **Team:** mock-data-audit (3 researchers)  
**Sources:** researcher-1, researcher-2, researcher-3 individual reports

---

## Executive Summary

Admin app is largely production-grade (all 64 API routes are real). Storefront (`apps/main`) is missing entire commerce subsystems — no cart, no checkout, no customer auth. Six production-visible fake/synthetic data sites exist today and should be treated as urgent.

**Total findings:** 29 distinct issues across 3 severity tiers.

---

## P1 — Production-Visible Fake Data (fix now)

These are shown to real users or admin operators today.

| # | File | Line | Issue |
|---|------|------|-------|
| 1 | `packages/database/src/services/analytics.server.ts` | 121 | `conversionRate` hardcoded constant — returned to admin analytics. Comment: "Mocked for now as we don't track visits". |
| 2 | `packages/database/src/services/analytics.server.ts` | 130 | `topProducts.growth` = `Math.random()` — random % on every request. Admin sees different numbers each refresh. |
| 3 | `apps/main/components/sections/flash-sale.tsx` | 55 | Countdown always `2h 14m 37s` on every page load. |
| 4 | `apps/main/components/sections/flash-sale.tsx` | 109 | `originalPrice ?? Math.round(p.price * 1.45)` — fakes 45% inflated MSRP, drives "−X% discount" badge. |
| 5 | `apps/main/components/sections/flash-sale.tsx` | 111-113 | `sold = (i * 23 + 38) % 200` formula drives "ĐÃ BÁN N" label and progress bar. |
| 6 | `apps/admin/app/(dashboard)/_content.tsx` | 38-56, 155 | `REVENUE_DATA`/`ORDERS_DATA` 7-day static arrays drive dashboard charts. Hardcoded `"+18% tuần trước"` pill. Comment: "kept as static placeholder until backend exposes time-series endpoint." |

**Recommendation:** For flash-sale (#3-5): hide countdown/sold-count/progress bar until real promo model exists rather than fabricate. For analytics (#1-2): drop `growth` field from API contract or implement real tracking. For dashboard (#6): add time-series backend endpoint.

---

## P1 — Missing Commerce Subsystems (storefront browse-only)

| # | Area | Evidence |
|---|------|----------|
| 7 | **No cart / checkout** | `product-info-actions.tsx:111`, `product-sticky-buy.tsx:53-66` — "Mua ngay" / "+ Giỏ hàng" buttons have **no onClick**. No cart page, no `/api/cart`, no `/api/orders` in storefront. |
| 8 | **No customer auth** | `navbar.tsx:42` reads `localStorage.getItem("store_customer_logged_in")` — never set anywhere. No `/api/auth` routes, no login/register pages. |
| 9 | **Wishlist localStorage-only** | `apps/main/hooks/use-wishlist.ts` — key `k_smart_wishlist`, no server sync, lost on cache clear. |
| 10 | **Newsletter signup fake** | `newsletter-cta.tsx:30-34` sets local state only. `footer.tsx:71-77` mobile button has no onClick at all. |

---

## P2 — Backend Ready, UI Missing (quick wins)

All items below have fully implemented API routes + client methods. Only UI work remains.

| # | Feature | What exists | What's missing |
|---|---------|-------------|----------------|
| 11 | Supplier orders | Full CRUD routes (`/api/admin/supplier-orders`), 3 client methods in `admin.client.ts:678-688` | No `/admin/supplier-orders` UI page |
| 12 | Inventory manual adjustment | `adjustInventory()` client + `/api/admin/inventory/movements/adjust` route | Movements tab is read-only; no form/button |
| 13 | Customer tier config | `/api/admin/settings/customer-tier` route + `getCustomerTierConfig`/`updateCustomerTierConfig` | No settings sub-page; `customers/_content.tsx:35` hardcodes thresholds with "until tier-config is wired" comment |
| 14 | User toggle-status + reset-password | `PATCH /api/admin/users/[id]` + `POST /api/admin/users/[id]/reset-password` + client methods | Users table only shows "Sửa" button |
| 15 | Customer block/delete | `PATCH /api/admin/customers/[id]/status` + `DELETE` + client methods | Customer detail only shows "Edit" |
| 16 | Admin chat image upload | `adminClient.uploadChatImage()` + backend multipart route | Admin composer is text-only; no upload affordance |
| 17 | Customer stats aggregate | `adminClient.getCustomerStats()` + `/api/admin/customers/stats` route | Never called from any UI |

---

## P2 — Stub Pages / Non-functional UI

| # | File | Issue |
|---|------|-------|
| 18 | `apps/main/app/(store)/account/page.tsx:9` | "Khu vực tài khoản đang được hoàn thiện." — 2 link cards only, no data. |
| 19 | `apps/main/app/(store)/account/orders/page.tsx:9` | "Tính năng lịch sử đơn hàng sẽ sớm được cập nhật." No fetch, no API. |
| 20 | `apps/main/app/(store)/account/chat/page.tsx` | Points to FAB only. |
| 21 | `apps/admin/app/(dashboard)/layout.tsx:114` | Top-bar quick-search — comment: "visual only for now (no global search wired)". |
| 22 | `apps/main/components/products/detail/product-reviews-pane.tsx` | Always empty state; "Viết đánh giá" button has no onClick. No reviews DB/API. |
| 23 | `apps/main/components/layout/footer.tsx:218-229` | All 5 `FooterLink` items hardcode `href="/"` — Giới thiệu, Liên hệ, Vận chuyển, Đổi trả, Kiểm tra đơn hàng pages missing. |

---

## P3 — Dead Code (safe to delete)

| # | File | Issue |
|---|------|-------|
| 24 | `apps/admin/components/admin/shared/mock-data.ts:22-554` | 8 `MOCK_*` arrays (~560 LOC), zero external usages. **Only `formatVnd` (line 557) is imported** by 8 callers — extract to `format-vnd.ts`, delete the rest. |
| 25 | `apps/admin/components/admin/shared/status-badge.tsx:10-14` | `new\|processing\|delivering\|done` aliases only used by `mock-data.ts`. Dead once #24 is cleaned. |
| 26 | `apps/admin/components/admin/customers/customer-table.tsx` | Full table with toggle-status/delete props; never imported (grep: 0 hits). Orphaned redesign artifact. |
| 27 | `apps/admin/services/admin.client.ts:118` | `getStats()` legacy combined method — superseded by `getDashboardKPIs`/`getRecentOrders`/`getTopProducts`. |
| 28 | `apps/admin/services/admin.client.ts:178` | `getChatRoomDetails()` — never invoked anywhere. |
| 29 | Dead section components (never imported): `deal-of-day.tsx` (fake combo + testimonials + price), `flash-sale.tsx`, `combo-banners.tsx`, `brand-strip.tsx`, `mobile-category-rail.tsx` |

---

## P3 — Minor Cleanup

| # | File | Issue |
|---|------|-------|
| 30 | `apps/admin/app/(dashboard)/orders/_content.tsx:135-137` + `order-header.tsx:17-23` | "Xuất Excel" buttons — no onClick, no backend endpoint. Either implement or remove. |
| 31 | `apps/admin/app/(dashboard)/customers/_content.tsx:100` | "Xuất danh sách" button — same issue. |
| 32 | `.env.example` | `STOREFRONT_BASE_URL=h` — truncated value, stale entry. |

---

## Items Confirmed NOT Issues

- All 64 admin API `route.ts` files are real (no empty stubs). The 11 `success: true` responses are legitimate DELETE/reorder.
- Hero `DEFAULT_SLIDES`/`FALLBACK_SLIDES` — acceptable fallback when DB returns empty.
- `TrustStrip`, `ProductPerksGrid`, `ProductPolicyPane` — intentional static marketing copy.
- `BRANDS` strip in `brand-strip.tsx` — static but the component itself is a dead orphan.
- Design-system demo data — not user-facing.
- No `isDemo`/`isMock`/`DEV_MODE` flags in production code.

---

## Recommended Fix Order

1. **Flash-sale fakery** — user-visible deception. Hide progress/countdown/MSRP until real promo model.
2. **Analytics fake growth/conversion** — misleads admin operators every page refresh.
3. **Admin dashboard time-series** — build backend endpoint, replace static arrays + hardcoded pill.
4. **Delete `mock-data.ts`** — extract `formatVnd` → `format-vnd.ts`, update 8 importers, drop dead status aliases.
5. **Wire P2 quick wins** — supplier-orders UI, inventory adjustment form, customer/user action buttons, chat image upload (all backend-ready).
6. **Storefront commerce** — cart, checkout, customer auth (scope with PM first; may be intentional MVP deferral).
7. **Stub pages** — either implement or convert to proper empty-states.
8. **Dead code** — `customer-table.tsx`, `getStats`, `getChatRoomDetails`, 5 dead section components.
9. **Export buttons** — implement or remove.

---

## Unresolved Questions

1. Is storefront cart/checkout intentionally deferred (admin-first MVP) or truly missing? Determines scope of #6.
2. Is `localStorage.store_customer_logged_in` ever set (e.g., 3rd-party SSO not found in codebase)? If not, the Tài khoản nav link is dead UI.
3. Is wishlist intended to stay localStorage (privacy-first) or migrate to server storage?
4. Are the 5 footer info pages drafted elsewhere (Notion, CMS) and just unwired?
5. Should reviews be implemented or the "Viết đánh giá" button removed entirely?
6. Export buttons — implement export pipeline or remove? No backend export endpoint exists.
7. Customer-tier config UI placement — settings sub-page or modal in customers list?
8. Is flash-sale section gated by an active promotion record? If not gated, fake data is always visible.
