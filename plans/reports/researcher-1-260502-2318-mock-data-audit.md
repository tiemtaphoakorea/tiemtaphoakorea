# Mock & Hardcoded Static Data Audit

**Scope**: `apps/main`, `apps/admin`, `packages/`
**Date**: 2026-05-02
**Branch**: dev

## Executive Summary

Codebase is largely API-wired. The big mock-data file (`mock-data.ts`) is mostly **dead code** — only its `formatVnd` helper is imported. However, several **production-affecting hardcoded values** remain:

1. **Analytics service** (`packages/database`) returns a hardcoded conversion rate and `Math.random()` fake growth percentages — visible to admin users.
2. **Admin dashboard** charts driven by static 7-day arrays.
3. **Storefront flash-sale** invents countdown timer, sold counts, and original/discount prices via formulas.
4. **`mock-data.ts`** still exports 8 unused `MOCK_*` arrays (~560 LOC) that should be deleted.
5. **Stub pages**: `/account/orders`, `/account/chat` are placeholder text only.
6. **Compat status types** (`new`, `processing`, `delivering`, `done`) in `status-badge.tsx` exist solely to satisfy `mock-data.ts`.

## Findings by Severity

### Severity: HIGH — Production-visible mock/synthetic data

| # | File | Line | Issue |
|---|------|------|-------|
| 1 | `packages/database/src/services/analytics.server.ts` | 121 | `conversionRate: ANALYTICS_DEFAULT_CONVERSION_RATE` — hardcoded constant returned to admin analytics dashboard. Comment: "Mocked for now as we don't track visits". |
| 2 | `packages/database/src/services/analytics.server.ts` | 130 | `topProducts.growth` set via `Math.floor(Math.random() * RANGE) + OFFSET` — fake growth %. Admin sees random numbers each request. |
| 3 | `apps/main/components/sections/flash-sale.tsx` | 55 | Countdown initialized to literal `2 * 3600 + 14 * 60 + 37` seconds — every page load shows the same fake "2h 14m 37s". |
| 4 | `apps/main/components/sections/flash-sale.tsx` | 109 | `originalPrice ?? Math.round(p.price * 1.45)` — fakes a 45% inflated MSRP if real one missing. Drives the "−X% discount" badge. |
| 5 | `apps/main/components/sections/flash-sale.tsx` | 111-113 | `sold = (i * 23 + 38) % 200`, `pct` derived — purely formula-based "ĐÃ BÁN N" label and progress bar. |
| 6 | `apps/admin/app/(dashboard)/_content.tsx` | 38-56 | `REVENUE_DATA` & `ORDERS_DATA` 7-day series rendered into BarChartMini. Comment: "kept as static placeholder until backend exposes time-series endpoint". |

### Severity: MEDIUM — Dead mock code that should be deleted

| # | File | Line | Issue |
|---|------|------|-------|
| 7 | `apps/admin/components/admin/shared/mock-data.ts` | 22-554 | 8 exported arrays (`MOCK_PRODUCTS`, `MOCK_ORDERS`, `MOCK_SUPPLIERS`, `MOCK_STAFF`, `MOCK_WAREHOUSE`, `MOCK_DEBTS`, `MOCK_EXPENSES`, `MOCK_MESSAGES`) — verified via grep: **zero usages** outside this file. Only `formatVnd` (line 557) is used externally. |
| 8 | `apps/admin/components/admin/shared/status-badge.tsx` | 10-14 | `StatusType` aliases `new \| processing \| delivering \| done` — only consumed by `mock-data.ts:147,157,167,177,187,207`. Dead once mocks are removed. |
| 9 | `apps/admin/app/(dashboard)/customers/_content.tsx` | 35-40 | `customerTier()` inlines tier thresholds (5M / 1M VND). Not mock per se, but explicit comment "until tier-config is wired" flags it as temporary. |
| 10 | `apps/admin/app/(dashboard)/layout.tsx` | 114-125 | Top-bar quick-search input — comment "visual only for now (no global search wired)". Non-functional UI. |

### Severity: LOW — Static fallback / decorative content (intentional)

| # | File | Line | Notes |
|---|------|------|-------|
| 11 | `apps/main/components/sections/hero.tsx` | 8-109 | `DEFAULT_SLIDES` (5 banners) — used only when `getBanners()` returns empty. Acceptable fallback. |
| 12 | `apps/main/components/sections/hero-three-col.tsx` | 13-54 | `FALLBACK_SLIDES` — same pattern, 2 slides. |
| 13 | `apps/main/components/sections/hero-banner-carousel.tsx` | 12-18 | `HERO_FALLBACK_IMAGES` — image fallback list. |
| 14 | `apps/main/components/sections/brand-strip.tsx` | 3-9 | `BRANDS = ["SHIN","PEPERO","COSRX","INNISFREE","3CE"]` — hardcoded brand strip on homepage. Should likely become CMS-driven (no `brands` table found). |
| 15 | `apps/main/components/sections/trust-strip.tsx` | 13-46 | `ITEMS` — 4 hardcoded marketing perks (freeship, đổi trả, etc.). Static UI copy. |
| 16 | `apps/main/components/products/detail/product-perks-grid.tsx` | 12-41 | `PERKS` — 4 hardcoded benefits on product detail. |
| 17 | `apps/main/components/products/detail/product-policy-pane.tsx` | 10-31 | `POLICIES` — 4 hardcoded shipping/return policies. |
| 18 | `apps/main/app/design-system/_data/*.ts` | — | `orderRows`, `colorTokens`, `statusColors`, etc. Demo data on `/design-system` route only — not user-facing. |
| 19 | `apps/main/app/(store)/account/orders/page.tsx` | 1-19 | "Tính năng lịch sử đơn hàng sẽ sớm được cập nhật" — stub page. |
| 20 | `apps/main/app/(store)/account/chat/page.tsx` | 1-10 | Stub page pointing to FAB. |

## Categorical Counts

- **Production-visible synthetic data**: 6 sites (HIGH)
- **Dead mock module / dead types**: ~560 LOC removable
- **Stub pages awaiting real impl**: 2 (`/account/orders`, `/account/chat`)
- **Config-style hardcoded data acceptable / fallback**: 10+ (banners, perks, policies)

## Recommendations (ranked)

1. **Replace `mock-data.ts` with `format-vnd.ts`** — extract the only used export (line 557), delete the rest. Update 8 import sites (already verified above) to point to the new helper module.
2. **Remove dead `StatusType` aliases** (`new`, `processing`, `delivering`, `done`) from `status-badge.tsx` once mock-data deletion lands. Order status flow already uses backend values (`pending`, `stock_out`, `completed`, `cancelled`) per `_content.tsx:59-72`.
3. **Wire real time-series for admin dashboard** — replace `REVENUE_DATA`/`ORDERS_DATA` with backend endpoint. Fix `analytics.server.ts:121,130` (conversion rate + growth) — either drop fields from API contract or implement real tracking.
4. **Replace flash-sale fakery** with persisted promotion model: real `endsAt`, real `originalPrice`, real `soldCount`. If backend isn't ready, hide progress bar / countdown rather than fabricate.
5. **Promote BRANDS list to CMS** if marketing wants editability; otherwise keep as static config (lowest priority).
6. **Implement or hide stub pages** `/account/orders` and `/account/chat` — ship empty-state pages that link to working features rather than placeholder copy.

## Unresolved Questions

- Are admin "growth %" and "conversion rate" being shown on currently-shipped dashboards, or behind a feature flag? If shown, this is misleading data and should be prioritized.
- Is the flash-sale section gated by an active promotion? If it can render with no real promo data, the fake countdown/discounts are user-visible deception.
- Is there a roadmap ticket for the "tier-config" mentioned in `customers/_content.tsx:35`? Affects whether to leave the inline thresholds or replace.
- Should `BRANDS` (`brand-strip.tsx`) be backed by a future `brands` table, or stay hardcoded? No table exists today.
