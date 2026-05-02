# Backlog — Storefront E-commerce Flow

**Trạng thái:** Hoãn (chưa làm trong phase này — quyết định ngày 2026-05-03)

## Bối cảnh

Audit ngày 2026-05-03 (xem `plans/reports/review-summary-260503-0004-hardcode-api-audit.md`) phát hiện apps/main thiếu hoàn toàn flow mua hàng. Catalog/banner/PDP đã wired DB nhưng các tính năng sau đây CHƯA TỒN TẠI:

## Hạng mục cần làm khi mở phase tiếp

### 1. Cart / Checkout / Add-to-cart
- Hiện chỉ có demo trong `apps/main/app/design-system/_components/sections/buttons-section.tsx:57`.
- `ProductCard` (`apps/main/components/products/product-card.tsx:139`) chỉ có "Xem chi tiết".
- `ProductInfoActions` (`product-info-actions.tsx:82-86`) không render CTA mua khi `canOrder`.
- `ProductStickyBuy` là stub `return null`.
- **Cần:** schema cart (DB hoặc localStorage+sync), API add/remove/update, trang `/cart`, flow `/checkout` → tạo order.

### 2. Auth (login/register/logout)
- Không có route `/login`, `/register`, `/auth/*`, `/logout` trong `apps/main/app/`.
- `Navbar` đọc cờ `localStorage.store_customer_logged_in === "1"` thủ công (`navbar.tsx:37-47`) — không phải session thật.
- `CustomerSidebar` POST tới `/logout` không tồn tại (`customer-sidebar.tsx:118-127`).
- API `/api/chat`, `/api/upload` đã yêu cầu `getInternalUser()` nhưng không có UI tạo session.
- **Cần:** route login/register, session cookie, middleware auth, redirect.

### 3. Wishlist server-sync
- Hiện 100% localStorage (`apps/main/hooks/use-wishlist.ts`), mất khi đổi thiết bị/xóa cookie.
- **Cần:** schema `wishlists` (customer_id, product_id), API CRUD, hook sync local↔server khi đăng nhập.

### 4. Product reviews
- `ProductReviewsPane` (`product-reviews-pane.tsx`) là static empty state, button "Viết đánh giá" no-op.
- **Cần:** schema `reviews` (product_id, customer_id, rating, comment, status), form viết review (yêu cầu auth), API moderation cho admin.

### 5. Account pages
- `/account` (placeholder "đang hoàn thiện").
- `/account/orders` (placeholder).
- `/account/chat` (stub redirect).
- 4 component sẵn `components/account/order-detail/*` đầy đủ logic nhưng không có page nào import (chờ route `/account/orders/[id]`).
- **Cần:** trang account overview, lịch sử đơn hàng (list + detail), profile edit.

### 6. Newsletter API
- 2 form không gọi API: `newsletter-cta.tsx:30-34` (chỉ `setSubmitted(true)`), `footer.tsx:67-78` (button dead).
- **Cần:** quyết định Mailchimp/Klaviyo/internal table, tạo endpoint `/api/newsletter` hoặc `/api/subscribe`.

### 7. Footer link đích thực + dynamic copyright
- 7 link `<FooterLink>` đều `href="/"`: Giới thiệu, Liên hệ, Vận chuyển, Đổi trả, Kiểm tra đơn hàng, Điều khoản, Bảo mật.
- Button "Tiếng Việt"/"VND" không có handler.
- Copyright cứng "© 2024".
- **Cần:** trang static cho từng policy, i18n/currency switch, `new Date().getFullYear()`.

### 8. Marketing copy → settings (USP/policy/announcement)
- `TrustStrip.ITEMS` 4 USP cứng (Freeship 299k, hàng Hàn, giao 2H, đổi trả 7 ngày).
- `AnnouncementBar` hotline `1900 0099` cứng.
- `ProductPerksGrid` + `ProductPolicyPane` 4 perks/4 policy cứng cho mọi sản phẩm.
- `ProductDescriptionPane` + `ProductInfoActions` cứng "🇰🇷 Hàn Quốc / Chính ngạch · có tem phụ".
- `Hero.DEFAULT_SLIDES` (5 slide), `HeroThreeCol.FALLBACK_SLIDES` (2 slide), `HERO_FALLBACK_IMAGES` (5 ảnh).
- **Cần:** drive từ `getSetting("shop_policy")`/`getSetting("announcement_config")`, hoặc render empty state khi DB rỗng.

## Dead code có thể dọn ngay (không cần phase mới)

- `apps/main/components/layout/announcement-bar.tsx` (0 import).
- `apps/main/components/sections/newsletter-cta.tsx` (0 import).
- `apps/main/components/layout/customer-sidebar.tsx` (0 import).
- `apps/main/components/products/detail/product-sticky-buy.tsx` (stub, có 1 no-op import).
- `apps/main/components/account/order-detail/*` 4 file (đợi route `/account/orders/[id]`).

> **Lưu ý:** chưa dọn ở phase admin-ui-fix vì có thể sẽ dùng lại khi mở phase storefront.
