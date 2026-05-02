# Review apps/main — hardcode & API chưa nối

## Tóm tắt

Storefront (`apps/main/`) đã có data thật cho danh mục, sản phẩm, banner, homepage collections (qua `@workspace/database/services/*`) và search autocomplete (`/api/products`). **Tuy nhiên các luồng e-commerce cốt lõi đều chưa làm**:

- KHÔNG có cart / checkout / add-to-cart ở bất kỳ page nào ngoài design-system.
- KHÔNG có route login/register/auth/logout — `isCustomerLoggedIn` ở navbar đang đọc cờ `localStorage` thủ công.
- Wishlist 100% client-side localStorage, không sync server, mất khi đổi thiết bị.
- Reviews pane là static empty state, không có form viết review.
- Order history (`/account/orders`), account overview (`/account`), `/account/chat` đều là placeholder text.
- Newsletter forms (2 nơi) chỉ `setSubmitted(true)` hoặc dead button, không gọi API.
- Footer link "Giới thiệu/Liên hệ/Vận chuyển/Đổi trả/Kiểm tra đơn hàng/Điều khoản/Bảo mật" tất cả đều `href="/"`.

Ngoài ra một số UI hardcode marketing copy (USP, hotline, freeship, perks, policy) chưa tách config; có dead components/dead code (CustomerSidebar, AnnouncementBar, NewsletterCta, ProductStickyBuy, components/account/order-detail/*).

Phạm vi review: 80+ file `.ts/.tsx` trong `apps/main` (loại trừ `design-system/` & `.next/`).

---

## CRITICAL

### 1. Không có flow add-to-cart / cart / checkout
- **Bằng chứng**: `grep -rn` cho `cart|addtocart|thêm vào giỏ|mua ngay` chỉ trả về:
  - `apps/main/app/design-system/_components/sections/buttons-section.tsx:57` (demo "Add to Cart")
  - `apps/main/components/sections/hero.tsx:18`, `hero-three-col.tsx:23` (label hero banner "Mua ngay")
- ProductCard chỉ có button "Xem chi tiết" (`apps/main/components/products/product-card.tsx:139`).
- ProductInfoActions render text "Sản phẩm tạm hết hàng" khi `!canOrder` nhưng KHÔNG render bất kỳ "Thêm vào giỏ" / "Mua ngay" CTA nào khi `canOrder` (`product-info-actions.tsx:82-86`).
- `ProductStickyBuy` là stub: `export function ProductStickyBuy() { return null; }` (`apps/main/components/products/detail/product-sticky-buy.tsx:1-3`).
- **Tác động**: Storefront không thể đặt hàng. Nghiệp vụ chính của shop chưa hoạt động.

### 2. Không có auth UI (login / register / logout route)
- **Bằng chứng**: `find apps/main/app -path "*/login*" -o -path "*/register*" -o -path "*/auth/*" -o -path "*/logout*"` → 0 kết quả.
- `apps/main/components/layout/navbar.tsx:37-47`: `isCustomerLoggedIn` đọc `window.localStorage.getItem("store_customer_logged_in") === "1"` — không phải session thật, có thể giả lập tay từ DevTools. Đây là kiểu placeholder cho UI demo.
- `apps/main/components/layout/customer-sidebar.tsx:118-127`: Logout dùng `<form method="post" action="/logout">` nhưng route `/logout` không tồn tại trong `apps/main/app/`.
- **Tác động**: Khách hàng không thể đăng nhập / đăng ký / đăng xuất qua storefront. API routes (`/api/chat`, `/api/upload`) yêu cầu `getInternalUser()` nhưng không có UI để khách lấy session.

### 3. Wishlist chỉ lưu localStorage — không sync server
- **Bằng chứng**: `apps/main/hooks/use-wishlist.ts:5-29`
  ```ts
  const STORAGE_KEY = "k_smart_wishlist";
  function loadFromStorage(): WishlistItem[] { ... }
  function saveToStorage(items: WishlistItem[]) { ... }
  ```
- Toàn bộ `add/remove/toggle/clear` chỉ thao tác state + localStorage, không gọi API.
- **Tác động**: Khách đăng ký rồi mà mất danh sách yêu thích khi đổi thiết bị / xóa cookie. Không thể chạy chiến dịch remarketing dựa trên wishlist.

### 4. Newsletter form không gọi API (2 nơi)
- **`apps/main/components/sections/newsletter-cta.tsx:30-34`**:
  ```tsx
  onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
  ```
  → submit chỉ đổi state, email mất hút.
- **`apps/main/components/layout/footer.tsx:67-78`**:
  ```tsx
  <Input type="email" placeholder="Email của bạn..." />
  <button type="button" aria-label="Đăng ký nhận ưu đãi">Đăng ký</button>
  ```
  → button `type="button"`, không có `onClick`, không có form, hoàn toàn dead.
- **Tác động**: Chiến dịch "voucher 50k khi đăng ký" không thu được email nào.

### 5. Product reviews pane chỉ là static empty
- **`apps/main/components/products/detail/product-reviews-pane.tsx:1-22`**: render fixed copy "Chưa có đánh giá" + button "Viết đánh giá" KHÔNG có `onClick`/`href`. Không nhận `product` prop, không fetch reviews, không có form viết review.
- **Tác động**: Tab "Đánh giá" trên PDP là decoration, không có review thật cho sản phẩm nào.

### 6. Trang `/account`, `/account/orders`, `/account/chat` chỉ là placeholder
- **`apps/main/app/(store)/account/page.tsx:5-27`**: "Khu vực tài khoản đang được hoàn thiện."
- **`apps/main/app/(store)/account/orders/page.tsx:6-19`**: "Tính năng lịch sử đơn hàng sẽ sớm được cập nhật."
- **`apps/main/app/(store)/account/chat/page.tsx:1-10`**: stub redirect tới FAB.
- **Tác động**: Khu vực tài khoản chưa có gì ngoài wishlist (mà wishlist cũng chỉ local).

---

## IMPORTANT

### 7. Hardcoded fallback banner slides 5-element (5 slide marketing copy + ảnh)
- **`apps/main/components/sections/hero.tsx:8-109`**: `DEFAULT_SLIDES` array 5 slides với title/subtitle/CTA/discountTag bằng tiếng Việt + ảnh `/banners/k-smart-hero-*.png`. Dùng làm fallback khi `getBanners()` rỗng.
- **`apps/main/components/sections/hero-three-col.tsx:13-54`**: `FALLBACK_SLIDES` 2 slides, copy gần trùng.
- **`apps/main/components/sections/hero-banner-carousel.tsx:12-18`**: `HERO_FALLBACK_IMAGES` 5 ảnh.
- **Vấn đề**: Khi DB không có banner → user thấy "NÂNG TẦM VẺ ĐẸP HÀN" với "Ưu đãi 50%" / "voucher 50k cho đơn đầu tiên" — copy marketing cứng, có thể sai sự thật.
- **Khuyến nghị**: Hoặc render empty state khi DB rỗng, hoặc seed DB rồi xóa fallback content (giữ ảnh fallback only).

### 8. TrustStrip USP hoàn toàn hardcode
- **`apps/main/components/sections/trust-strip.tsx:13-46`**: `ITEMS` 4 USP cứng:
  - "Freeship 299k", "Hàng Hàn chính hãng", "Giao 2H nội thành HCM & Hà Nội", "Đổi trả 7 ngày"
- Hiện trên homepage cho cả mobile (3 item) & desktop (4 item).
- Ngưỡng freeship "299k" và phạm vi giao 2H phải khớp config thật (settings/shipping rules), không nên cứng trong component.

### 9. AnnouncementBar hardcode hotline + freeship
- **`apps/main/components/layout/announcement-bar.tsx:1-14`**:
  - `FREESHIP đơn từ 299k toàn quốc`
  - `Hotline 1900 0099`
  - `Giao 2H trong nội thành HCM & HN`
- Component không được import ở đâu (xem MODERATE bên dưới) nhưng nếu sau này dùng, các giá trị này phải đến từ `getSetting("shop_info")` / `announcement_config`.

### 10. ProductPerksGrid + ProductPolicyPane hardcode toàn bộ cam kết
- **`apps/main/components/products/detail/product-perks-grid.tsx:12-41`**: 4 perks "Giao hàng 2H / Đổi trả 7 ngày / Hàng chính hãng / Quà tặng kèm khi mua từ 3 hộp".
- **`apps/main/components/products/detail/product-policy-pane.tsx:10-31`**: 4 policy với chi tiết cứng:
  - Freeship 299k, đổi trả 500k, COD/Momo/ZaloPay/VNPay/thẻ, trả góp 0%.
- Mọi sản phẩm đều show cùng 1 nội dung. Chính sách không khớp DB sẽ gây hiểu nhầm pháp lý/thanh toán.

### 11. ProductDescriptionPane hardcode "🇰🇷 Hàn Quốc" + "Chính ngạch · có tem phụ"
- **`apps/main/components/products/detail/product-description-pane.tsx:11-18`**:
  ```ts
  ["Xuất xứ", "🇰🇷 Hàn Quốc"],
  ["Nhập khẩu", "Chính ngạch · có tem phụ"],
  ```
- Đoạn "Cam kết" (line 33-39) cũng cứng cùng nội dung cho mọi sản phẩm.
- Vấn đề: Không phải sản phẩm nào trên shop cũng từ Hàn (ngay cả nếu shop K-SMART → vẫn nên đến từ field `product.origin`/`product.attributes`).

### 12. Footer 100% link chết / link sai
- **`apps/main/components/layout/footer.tsx:124-136`**: tất cả `<FooterLink label="..." />` render `<Link href="/">` (line 220-228). Affected:
  - "Giới thiệu", "Liên hệ" (phần Về chúng tôi)
  - "Vận chuyển & Giao hàng", "Chính sách đổi trả", "Kiểm tra đơn hàng" (phần Hỗ trợ)
- **`apps/main/components/layout/footer.tsx:152-163`**: "Điều khoản sử dụng" và "Chính sách bảo mật" cũng `href={PUBLIC_ROUTES.HOME}`.
- **`footer.tsx:166-179`**: nút "Tiếng Việt" và "VND" là `<button type="button">` không có handler.
- **`footer.tsx:34`**: `DEFAULTS.copyright = "© 2024 K-SMART VN"` — năm cứng (giờ là 2026).
- **`footer.tsx:32-33`**: `office: "Hồ Chí Minh, Việt Nam"`, `officeDetail: "Quận 1, TP. Hồ Chí Minh"` cứng (chỉ override nếu setting có value).

### 13. ProductInfoActions hardcode "🇰🇷 Nhập khẩu chính ngạch" badge
- **`apps/main/components/products/detail/product-info-actions.tsx:42-44`**:
  ```tsx
  <span ...>🇰🇷 Nhập khẩu chính ngạch</span>
  ```
- Hiện trên mọi sản phẩm bất kể origin thật.

---

## MODERATE

### 14. PRICE_RANGES hardcoded VND tiers
- **`apps/main/components/category/category-sidebar.tsx:29-35`**: `[<100k, 100-299k, 300-499k, >500k]`. Hợp lý cho UX nhưng không dynamic theo category (skincare khác snack rất nhiều).

### 15. Component dead code / không dùng
- **`apps/main/components/layout/announcement-bar.tsx`**: 0 import.
- **`apps/main/components/sections/newsletter-cta.tsx`**: 0 import (chỉ comment ở `footer.tsx:58` đề cập).
- **`apps/main/components/layout/customer-sidebar.tsx`**: 0 import (chỉ tự reference trong file, không được render bất kỳ layout nào).
- **`apps/main/components/products/detail/product-sticky-buy.tsx`**: stub `return null`, có import ở `product-client-container.tsx:48` (no-op).
- **`apps/main/components/account/order-detail/customer-order-{header,items-table,status-card}.tsx`** + **`customer-info-summary.tsx`**: 4 component đầy đủ với type `order: any` nhưng KHÔNG có page nào import (chỉ self-reference trong cùng folder qua interface). Đang chờ trang order detail.

### 16. Default avatar trỏ ra external
- **`apps/main/components/layout/customer-sidebar.tsx:99`**:
  ```tsx
  <AvatarImage src={profile?.avatarUrl || "https://github.com/shadcn.png"} />
  ```
- (Component dead nhưng nếu sau này dùng phải đổi sang `/avatars/default.png` local hoặc DiceBear.)

### 17. ChatWidget mặc định title "Chat voi AI Agent" / "Store Support" không có dấu
- **`apps/main/components/store/chat-widget.tsx:53`**: `title = "Chat voi AI Agent"` (typo / thiếu dấu).
- **`apps/main/components/store/chat-widget-initializer.tsx:29`**: truyền `title="Store Support"` (English) → override default.

### 18. CustomerSidebar prop `profile: any`, `order: any` ở các file order-detail
- **`apps/main/components/layout/customer-sidebar.tsx:39`**: `{ profile }: { profile: any }`.
- **`apps/main/components/account/order-detail/customer-order-items-table.tsx:23`**: `{ order: any }`.
- Mất type safety, sẽ vỡ khi nối API thật.

### 19. Hardcoded DEFAULT_SEO ở homepage
- **`apps/main/app/(store)/page.tsx:20-24`**: ổn vì là fallback metadata, nhưng `homepage_config.seo` từ DB sẽ override.

### 20. CustomerSidebar dropdown "Hồ sơ" item dead
- **`apps/main/components/layout/customer-sidebar.tsx:114-116`**:
  ```tsx
  <DropdownMenuItem className="...">
    <User className="mr-2 h-4 w-4" /> Hồ sơ
  </DropdownMenuItem>
  ```
- Không có `onClick`/`onSelect`/`asChild Link` → click không làm gì.

---

## Các câu hỏi chưa giải đáp

1. **Cart/Checkout/Auth có nằm ở app khác chưa migrate, hay là feature chưa làm bao giờ?** Nếu storefront không có purchase flow là intentional MVP scope thì OK; nếu là feature thiếu thì phải lập kế hoạch.
2. **Order detail page**: 4 component `components/account/order-detail/*` đã có sẵn — có plan tạo route `/account/orders/[id]` hay đang chờ task khác?
3. **Wishlist server-side sync**: cần customer auth trước → block bởi finding #2.
4. **Reviews**: có API/schema cho reviews chưa? Có cần guest review hay phải đăng nhập?
5. **Newsletter**: gửi email/Mailchimp/Klaviyo? Hiện không có API endpoint `/api/newsletter` hay `/api/subscribe`.
6. **Footer copyright "2024"**: nên dynamic theo year.
7. **TrustStrip / AnnouncementBar**: ngưỡng freeship 299k và phạm vi giao 2H có khớp với business rule thật không? Có nên drive từ `settings.shop_policy` không?

---

**Status**: DONE
**Summary**: Storefront có data thật cho catalog/banner/homepage nhưng thiếu hoàn toàn cart, checkout, auth, server-side wishlist, reviews, order history; nhiều copy marketing/USP/policy/footer hardcode; một số component dead code.
