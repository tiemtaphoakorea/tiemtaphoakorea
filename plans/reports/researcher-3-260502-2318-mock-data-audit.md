---
researcher: researcher-3
team: mock-data-audit
date: 2026-05-02
scope: stubs, placeholders, incomplete feature integrations
---

# Stubs, Placeholders & Incomplete Features Audit

## Executive Summary

**Headline**: Storefront (`apps/main`) is missing entire commerce subsystems — no cart, no checkout, no customer authentication, no order history. Buy buttons are decorative. Customer-facing account area is a "coming soon" stub. Wishlist persists in browser localStorage only.

**Admin (`apps/admin`)** is largely production-grade. One concrete static-data stub on the dashboard (`_content.tsx`) with a self-documenting comment admitting the gap.

**API routes**: All scanned routes are real (no empty / stub `success: true`-only endpoints). `success: true` payloads found in 11 files are legitimate DELETE / reorder responses.

**Coordination**: Several findings overlap with researcher-1 (hardcoded data) and researcher-2 (unconnected API). Cross-refs noted inline.

---

## CRITICAL: Missing Storefront Commerce Subsystems

### 1. No cart / checkout flow
- `apps/main/components/products/detail/product-info-actions.tsx:111-113` — "Mua ngay →" button on product detail page has **no onClick handler**. Just `<Button … disabled={!canOrder}>`.
- `apps/main/components/products/detail/product-sticky-buy.tsx:53-66` — Mobile sticky "+ Giỏ hàng" and "Mua ngay →" buttons, both no onClick.
- No cart page exists under `apps/main/app/(store)/`.
- No `/api/cart` or `/api/orders` route in `apps/main/app/api/`.

**Impact**: Storefront is browse-only. Customers cannot transact.

### 2. No real customer authentication
- `apps/main/components/layout/navbar.tsx:37-47` — Customer login state is read from `localStorage.getItem("store_customer_logged_in")`. No actual auth flow, no login/register pages, no session cookie.
- No `/api/auth/*` routes for storefront customers (admin has its own auth at `apps/admin/app/api/admin/login`).

### 3. Customer account area is stub
- `apps/main/app/(store)/account/page.tsx:9` — Hardcoded text: *"Khu vực tài khoản đang được hoàn thiện."* (Account area is being completed). Just shows two link cards.
- `apps/main/app/(store)/account/orders/page.tsx:9` — *"Tính năng lịch sử đơn hàng sẽ sớm được cập nhật"* (Order history feature coming soon). No table, no fetch, no API.
- Account chat (`apps/main/app/(store)/account/chat/page.tsx`) and wishlist (#4) are the only working items.

### 4. Wishlist is localStorage-only
- `apps/main/hooks/use-wishlist.ts` — Entire wishlist persists in `window.localStorage` under key `k_smart_wishlist`. No server sync, no backend table, lost on browser clear, doesn't roam across devices.
- Cross-ref: researcher-2 (unconnected API).

### 5. Newsletter signup is fake
- `apps/main/components/sections/newsletter-cta.tsx:30-34` — Form `onSubmit` only sets local state `submitted=true`. No API call. No backend handler.
- `apps/main/components/layout/footer.tsx:71-77` — Mobile footer newsletter button has **no onClick** at all, no form, no API. Pure decoration.
- Cross-ref: researcher-2.

### 6. Footer info pages all stubbed
- `apps/main/components/layout/footer.tsx:218-229` — `FooterLink` component hardcodes `href="/"`. Every link ("Giới thiệu", "Liên hệ", "Vận chuyển & Giao hàng", "Chính sách đổi trả", "Kiểm tra đơn hàng") routes to homepage. Five missing pages.

---

## Admin App Findings

### 7. Dashboard charts use hardcoded series
- `apps/admin/app/(dashboard)/_content.tsx:38-56` — `REVENUE_DATA` and `ORDERS_DATA` (7-day bar chart series) are static literals.
- Self-documenting comment line 38: *"7-day series — kept as static placeholder until backend exposes time-series endpoint."*
- `_content.tsx:155` — Hardcoded `"+18% tuần trước"` TonePill (fake "+18% vs last week" stat).
- Charts rendered via `<BarChartMini data={REVENUE_DATA}>` (line 157) and `<BarChartMini data={ORDERS_DATA}>` (line 167).
- Cross-ref: researcher-1.

### 8. Mock-data file scoped to formatVnd helper
- `apps/admin/components/admin/shared/mock-data.ts` — Despite name, only `formatVnd` is imported anywhere; `MOCK_PRODUCTS`, `MOCK_ORDERS`, `MOCK_SUPPLIERS`, etc. are exported but unused. Not active mock injection. File comment line 2 admits placeholder origin.
- Cross-ref: researcher-1 (this is their territory).

---

## Orphan / Dead Stubs (defined but never imported)

These section components exist with hardcoded fake data, but are not rendered anywhere. Either delete or wire up:

| File | Stub kind |
|---|---|
| `apps/main/components/sections/deal-of-day.tsx` | Hardcoded combo "Combo Hàn ăn cả tuần", fake testimonials with names "Linh · TP.HCM", "Ngọc · Hà Nội", fake price 579k vs 999k, fake 4.9 rating, fake "Còn 12 hộp" stock |
| `apps/main/components/sections/flash-sale.tsx` | Countdown + tile glyphs, takes `products` prop but never rendered |
| `apps/main/components/sections/combo-banners.tsx` | Unused |
| `apps/main/components/sections/brand-strip.tsx` | Unused |
| `apps/main/components/sections/mobile-category-rail.tsx` | Unused |
| `apps/main/components/sections/hero-banner-carousel.tsx` | Imported by `hero.tsx` and `hero-three-col.tsx` — actually used. Strike from list. |

Verified via `grep -rn "DealOfDay\|FlashSale\|ComboBanners\|BrandStrip\|MobileCategoryRail" apps/main/app` — no hits.

---

## Static Marketing Content (NOT stubs — design intent)

Listed for completeness so other reviewers don't double-flag:

- `apps/main/components/sections/trust-strip.tsx` — 4-USP marketing strip.
- `apps/main/components/products/detail/product-perks-grid.tsx` — 4 fixed perks.
- `apps/main/components/products/detail/product-policy-pane.tsx` — Shipping/returns policy copy.
- `apps/main/components/products/detail/product-description-pane.tsx:16-17` — Hardcoded "🇰🇷 Hàn Quốc" origin and "Chính ngạch · có tem phụ" import label per product.
- `apps/main/components/products/detail/product-info-actions.tsx:47,118-119` — Hardcoded "🇰🇷 Nhập khẩu chính ngạch" badge and "Freeship đơn từ 299k" tagline.
- `apps/main/components/sections/hero.tsx` & `hero-three-col.tsx` — `DEFAULT_SLIDES` / `FALLBACK_SLIDES` only used when DB has no banners.

These are intentional shop-wide copy that could be moved to settings table for admin control, but they are not "stubs" in the audit sense.

### Reviews tab (borderline)
- `apps/main/components/products/detail/product-reviews-pane.tsx` — Always renders empty state "Chưa có đánh giá" with a "Viết đánh giá" button that has **no onClick**. Reviews subsystem completely absent (no DB table reference, no API, no form). Counts as a stub since the button suggests interactivity. Either remove the button or implement reviews.

---

## API Routes — No Empty Stubs Found

Scanned all 64 `route.ts` files under `apps/*/app/api/`. None are empty or fake. The 11 `return NextResponse.json({ success: true })` occurrences are all legitimate DELETE / reorder / set-products responses backed by real DB calls. Smallest route (`apps/admin/app/api/admin/profile/route.ts`) is real.

---

## Environment & Config

- `.env` references are all wired to real services (Supabase, OpenAI, Postgres). No placeholder URLs in `next.config.ts` rewrites (no rewrites configured).
- `.env.example` line `STOREFRONT_BASE_URL=h` is a stray typo / truncated value — minor cleanup item, no functional impact.
- No `isDemo`, `isMock`, or `DEV_MODE` flag drift in production code.

---

## Action Items (priority order)

| # | Item | Files |
|---|---|---|
| 1 | Build cart + checkout subsystem | `apps/main/app/(store)/cart`, `apps/main/app/(store)/checkout`, `apps/main/app/api/cart`, `apps/main/app/api/orders` |
| 2 | Implement customer auth (replace localStorage flag) | `apps/main/components/layout/navbar.tsx:42`, new `/api/auth` routes, login/register pages |
| 3 | Wire "Mua ngay" / "+ Giỏ hàng" buttons | `product-info-actions.tsx:111`, `product-sticky-buy.tsx:53-66` |
| 4 | Replace dashboard fake series with real time-series endpoint | `apps/admin/app/(dashboard)/_content.tsx:38-56,155` (and remove fake "+18%" pill) |
| 5 | Persist wishlist server-side | `apps/main/hooks/use-wishlist.ts` + new API |
| 6 | Implement newsletter signup API + handler | `newsletter-cta.tsx`, `footer.tsx` mobile band |
| 7 | Build customer account dashboard + order history | `account/page.tsx`, `account/orders/page.tsx` |
| 8 | Implement product reviews OR remove "Viết đánh giá" button | `product-reviews-pane.tsx` |
| 9 | Create real footer info pages or remove `FooterLink` items | `footer.tsx:218-229` |
| 10 | Delete dead section components or finish + wire up | `deal-of-day.tsx`, `flash-sale.tsx`, `combo-banners.tsx`, `brand-strip.tsx`, `mobile-category-rail.tsx` |
| 11 | Promote static marketing copy to admin-editable settings (optional) | `trust-strip.tsx`, `product-policy-pane.tsx`, `product-perks-grid.tsx`, "Freeship 299k" / origin badges |
| 12 | Fix `.env.example` `STOREFRONT_BASE_URL=h` truncation | `.env.example` |

---

## Unresolved Questions

1. Is the storefront cart/checkout intentionally deferred (admin-first MVP) or truly missing? Confirm with PM before scoping action #1.
2. Should `mock-data.ts` be renamed `format-utils.ts` since only `formatVnd` is used? Cross-confirm with researcher-1.
3. The customer auth `localStorage.store_customer_logged_in` flag — is it set anywhere on success of an actual login? Couldn't find any setter; likely never set, meaning the gated "Tài khoản" link in navbar is dead UI.
4. `FooterLink` items — does the team have copy/legal pages drafted elsewhere (e.g., in `docs/` or CMS) that just aren't wired up?
5. Are reviews planned (table exists?) or descoped? Determines fix for finding #8.
