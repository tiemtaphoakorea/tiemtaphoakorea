# Review Summary — Hardcode & API Chưa Nối (toàn codebase)

**Branch:** dev · **Date:** 2026-05-03 · **Team:** review-hardcode-api (3 reviewers)

Reports gốc:
- Admin: `plans/reports/reviewer-1-260503-0004-admin-hardcode-api.md`
- Main:  `plans/reports/reviewer-2-260503-0004-main-hardcode-api.md`
- Packages: `plans/reports/reviewer-3-260503-0004-packages-config.md`

## Tổng số phát hiện

| Phạm vi | CRITICAL | IMPORTANT | MODERATE |
|---|---:|---:|---:|
| apps/admin | 6 | 4 | 4 |
| apps/main | 6 | 7 | 7 |
| packages + config | 6 | 5 | 5 |
| **Tổng** | **18** | **16** | **16** |

## CRITICAL — phải fix trước khi production

### Bảo mật (packages)
1. `Math.random()` sinh password — `packages/database/src/services/user.server.ts:75,185` (createUser & resetUserPassword). Predictable, đổi sang `crypto.randomBytes`/`randomUUID`.
2. `SESSION_SECRET=default_secret` — `.env.example:6`. Guard ở `security.ts` chỉ check truthy → JWT ký bằng key public-known.
3. `scripts/create-admin.ts:14-16` hardcode `password = "password123"`, không có env override.
4. `scripts/seed-admin.ts:13-20` guard production `unreachable` (`|| "password123"` luôn truthy).
5. `pnpm db:seed:e2e` (`scripts/seed-e2e.ts:16` + `package.json:14`) seed admin với `password123`, chỉ guard DATABASE_URL.
6. Plaintext password log ra stdout — `scripts/update-admin-password.ts:42-45`, `scripts/create-admin.ts:54`.

### Storefront e-commerce flow chưa làm (apps/main)
7. **Không có add-to-cart / cart / checkout** ở bất kỳ page nào (chỉ design-system demo). `ProductStickyBuy` là `return null`.
8. **Không có route auth** (login/register/logout). Navbar đọc `localStorage.store_customer_logged_in`. CustomerSidebar logout → POST `/logout` không tồn tại.
9. Wishlist 100% localStorage (`hooks/use-wishlist.ts`), không sync server, mất khi đổi thiết bị.
10. 2 newsletter form (`newsletter-cta.tsx:30`, `footer.tsx:67-78`) chỉ `setSubmitted(true)` hoặc dead button — không gọi API.
11. ProductReviewsPane là static empty state, button "Viết đánh giá" no-op.
12. `/account`, `/account/orders`, `/account/chat` đều placeholder text "đang hoàn thiện".

### Admin có data giả/UI fake (apps/admin)
13. Dashboard 7-day chart cứng — `_content.tsx:38-56` (`REVENUE_DATA`/`ORDERS_DATA`) + `+18% tuần trước` cứng (line 155). Endpoint `getDailyFinancialStats` đã có sẵn.
14. Customer profile email bịa từ `customerCode + @shop.internal` — `customer-profile-header.tsx:64-67`.
15. Customer "Tỉ lệ hoàn 0%" cứng cho mọi khách — `customer-financial-stats.tsx:35`.
16. `customerTier()` dùng 5M/1M cứng, BỎ QUA `getCustomerTierConfig` API (Settings đã wire) — `customers/_content.tsx:35-40`.
17. Settings → Branding tab fake hoàn toàn — button "Lưu nhận diện" không có onClick, inputs uncontrolled, FileUploader logo không có mutation (`settings/_content.tsx:131-183`).
18. Customer/Order export silent truncate ở 5000 dòng, không check total — `api/admin/{customers,orders}/export/route.ts:6,30`.

## IMPORTANT — nên fix sớm

### Marketing copy / USP / chính sách hardcode (storefront)
- `Hero.DEFAULT_SLIDES` (5 slide) + `HeroThreeCol.FALLBACK_SLIDES` (2 slide) + `HERO_FALLBACK_IMAGES` (5 ảnh).
- `TrustStrip.ITEMS` 4 USP cứng (Freeship 299k, hàng Hàn, giao 2H HCM/HN, đổi trả 7 ngày).
- `AnnouncementBar` hotline `1900 0099`, freeship 299k, giao 2H — phải đến từ `getSetting`.
- `ProductPerksGrid` + `ProductPolicyPane` 4 perks + 4 policy cứng cho mọi sản phẩm.
- `ProductDescriptionPane` + `ProductInfoActions` cứng "🇰🇷 Hàn Quốc / Chính ngạch · có tem phụ" cho mọi sản phẩm.
- Footer 7 link chết `href="/"` (Giới thiệu, Liên hệ, Vận chuyển, Đổi trả, Kiểm tra đơn hàng, Điều khoản, Bảo mật) + button "Tiếng Việt"/"VND" no-op + copyright "© 2024".

### Admin
- Branding inputs uncontrolled (`defaultValue` thay vì `value/onChange`).
- Inventory adjustment buộc gõ tay variant UUID (`movements-tab.tsx:186-194`) — đã có `getProductsWithVariants`.
- `customerType !== "retail"` ternary gom mọi giá trị khác vào "Khách sỉ" — `customer-profile-header.tsx:79`.
- `product-form.tsx:518,526` dùng `axios.post("/api/admin/products"...)` thay vì `API_ENDPOINTS.*` (codebase đã có 86 chỗ dùng).

### Packages / config
- `packages/shared/src/analytics.ts` export `K_REVENUE_DATA`/`K_CATEGORY_DATA`/`K_TOP_PRODUCTS` mock — 0 consumer, expose qua subpath.
- `homepage-collections.seed.ts:59-64` auto-run on import (không guard `import.meta.url`).
- `ANALYTICS_GROWTH_RANDOM_RANGE/OFFSET/DEFAULT_CONVERSION_RATE` constants — 0 consumer (dấu vết fake growth numbers).
- `.env.example:7` `STOREFRONT_BASE_URL=h` (typo).
- `ADMIN_BASE_URL` / `STOREFRONT_BASE_URL` constants 0 consumer nhưng vẫn liệt kê trong `turbo.json:globalEnv`.

## MODERATE — dọn khi rảnh

### Dead code
- `apps/admin/components/admin/banners/banner-form.tsx` (legacy, 0 import).
- `apps/main/components/layout/announcement-bar.tsx` (0 import).
- `apps/main/components/sections/newsletter-cta.tsx` (0 import).
- `apps/main/components/layout/customer-sidebar.tsx` (0 import).
- `apps/main/components/account/order-detail/*` 4 file (đầy đủ nhưng không page nào dùng).
- `CUSTOMER_EMAIL_DOMAIN` constant.

### Misc
- `UserWithStatus` cast thừa sau diff `packages/database/src/types/admin.ts` — `user-row-actions.tsx:11-19`.
- Dashboard TODO comment "kept as static placeholder until..." không có ticket.
- `toCsv` helper duplicate giữa 2 export route.
- `PRICE_RANGES` VND tiers cố định (chấp nhận được nhưng không dynamic theo category).
- Default avatar `https://github.com/shadcn.png` ở CustomerSidebar.
- `ChatWidget.title = "Chat voi AI Agent"` (typo, thiếu dấu).
- `profile: any`, `order: any` trong components account → mất type safety.
- Customer Sidebar dropdown "Hồ sơ" item không có onClick.
- `Math.random()` cho filename (`storage.server.ts:12`), customer code suffix (`customer.server.ts:135`), order number 6-hex (`db-locking.ts:123,144`) — collision risk dưới tải cao. Đổi sang `crypto.randomUUID()` (đã có pattern đúng ở `chat.server.ts:442`).
- `seed-rieti.ts` / `seed-e2e.ts` chứa product data mẫu + 22 Unsplash URLs (rủi ro nếu chạy nhầm prod, flaky CDN).
- `crawl-rieti.ts` hardcode `https://en.rieti.co.kr`.

## Phần đã wired đúng (đối chiếu, không cần fix)

- Admin: chat, customers list/detail header, supplier-orders, homepage banner/collection/footer/social/widget setting, inventory adjustment mutation, settings → cửa hàng + hạng KH tabs.
- Main: catalog, search autocomplete (`/api/products`), banner, homepage collections, category, PDP — đều fetch từ `@workspace/database/services/*`.
- Database services: tất cả `*.server.ts` đều chạy DB query thật, không có stub/mock.
- Supabase clients, `db.ts`, `drizzle.config.ts`, ESLint/TS/biome/knip/turbo configs — không hardcode secret.
- `crypto.randomUUID()` pattern đúng tại `chat.server.ts:442`.

## Khuyến nghị thứ tự xử lý

1. **Security CRITICAL trước (1-6)**: 1 PR fix `Math.random` password + bỏ default `SESSION_SECRET` + bỏ `password123` trong scripts + drop plaintext log.
2. **Storefront e-commerce flow (7-12)**: cần plan riêng — đây là feature thiếu, không phải hardcode. Quyết định scope MVP vs full trước khi code.
3. **Admin data giả (13-18)**: 1 PR per finding (dashboard chart, customer email/return-rate, customerTier sync, Branding tab, export limit). Mỗi cái <100 LOC.
4. **IMPORTANT marketing copy (storefront)**: gom thành 1 task "drive USP/policy/announcement từ settings".
5. **Footer 7 link chết + copyright dynamic**: 1 PR nhỏ.
6. **Dead code / dọn**: 1 PR cuối tổng dọn dẹp.

## Các câu hỏi chưa giải đáp

1. **Dashboard 7-day**: dùng `getDailyFinancialStats` slice 7 entries cuối, hay tạo endpoint mới? (Critical 13)
2. **Customer email**: schema có field `email` thật chưa? Nếu không → label phải đổi sang "Định danh" hoặc hide. (Critical 14)
3. **Customer return rate**: có bảng `order_returns/refunds` chưa? Hay tính từ `order.fulfillmentStatus = cancelled`? (Critical 15)
4. **Branding tab**: design intent là `branding_config` setting key, hay tab pending hẳn? Nếu pending → ẩn TabsTrigger. (Critical 17)
5. **Customer tier**: dùng config từ Settings hay hard rule cho consistency mobile/main? (Critical 16)
6. **Export limit 5000**: business rule hay dev guard? (Critical 18)
7. **Cart/Checkout/Auth**: có nằm ở app khác chưa migrate, hay feature chưa làm bao giờ? Là MVP scope intentional hay backlog? (Critical 7-8)
8. **Order detail page**: 4 component sẵn ở `components/account/order-detail/*` — đang chờ route `/account/orders/[id]`?
9. **Reviews API/schema**: đã có chưa? Guest review hay phải đăng nhập?
10. **Newsletter**: Mailchimp/Klaviyo/internal? Cần endpoint `/api/newsletter` hay `/api/subscribe`.
11. **TrustStrip / AnnouncementBar**: ngưỡng 299k và phạm vi giao 2H có khớp business rule? Nên drive từ `settings.shop_policy`?
12. **`ADMIN_BASE_URL` / `STOREFRONT_BASE_URL`**: đang chờ middleware/cross-domain redirect chưa merge? Nếu không → drop khỏi `turbo.json:globalEnv`.
13. **`homepage-collections.seed.ts`**: thiết kế chạy thủ công bằng `tsx` hay nên consolidate vào `scripts/`?
14. **`seed-e2e.ts`**: pipeline E2E có set `DATABASE_URL` riêng không trùng prod?
15. **`K_REVENUE_DATA`/`K_CATEGORY_DATA`/`K_TOP_PRODUCTS`**: còn dùng cho design system / Storybook?

---

**Status:** DONE — 50 findings (18 CRITICAL / 16 IMPORTANT / 16 MODERATE). Không có blocker mới.
