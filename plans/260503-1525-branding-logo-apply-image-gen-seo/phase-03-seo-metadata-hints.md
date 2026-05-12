---
phase: 3
title: "SEO metadata + settings hints"
status: pending
priority: P2
effort: "2h"
dependencies: [1, 2]
---

# Phase 3: SEO metadata + settings hints

## Overview
Thêm dynamic SEO metadata vào cả hai app dựa trên branding + shop_info. Thêm gợi ý SEO trong Settings UI cho từng trường upload.

## Requirements
- `main/app/layout.tsx`: dynamic `<title>`, `<meta description>`, Open Graph tags, Twitter Card
- `admin/app/layout.tsx`: dynamic title từ shopInfo.name
- Settings UI: thêm trường `seoDescription` + `seoKeywords` vào shop_info hoặc branding
- Hint text ngắn gọn dưới mỗi upload field giải thích kích thước tối ưu + tác động SEO

## Architecture

### New fields trong ShopInfoConfig
```ts
type ShopInfoConfig = {
  name: string;
  address: string;
  phone: string;
  taxId: string;
  // new
  seoDescription: string;  // <meta description> — tối đa 160 ký tự
  seoKeywords: string;     // <meta keywords> — comma-separated
}
```

### generateMetadata() cho main/app/layout.tsx
```ts
export async function generateMetadata(): Promise<Metadata> {
  const [shopInfo, branding] = await Promise.all([
    getSetting<ShopInfoConfig>("shop_info"),
    getSetting<BrandingConfig>("branding"),
  ]);
  return {
    title: { default: shopInfo?.name || "K-SMART", template: `%s | ${shopInfo?.name || "K-SMART"}` },
    description: shopInfo?.seoDescription || "K-SMART Pure Beauty",
    keywords: shopInfo?.seoKeywords || undefined,
    openGraph: {
      title: shopInfo?.name || "K-SMART",
      description: shopInfo?.seoDescription || "",
      images: branding?.ogImageUrl ? [{ url: branding.ogImageUrl, width: 1200, height: 630 }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: shopInfo?.name || "K-SMART",
      description: shopInfo?.seoDescription || "",
      images: branding?.ogImageUrl ? [branding.ogImageUrl] : [],
    },
    icons: {
      icon: branding?.faviconUrl || branding?.logoSquareUrl || "/favicon.ico",
      apple: branding?.appleIconUrl || branding?.logoSquareUrl || "/apple-icon.png",
    },
  };
}
```

### Hint text trong Settings UI
Mỗi upload field thêm `<p className="text-xs text-muted-foreground mt-1">` với nội dung:
- Logo chính: "PNG/SVG ngang, tối thiểu 200×60px. Hiển thị trên thanh điều hướng website."
- Logo vuông: "PNG vuông 512×512px. Dùng để tạo favicon và icon ứng dụng."
- Favicon: "PNG 32×32px. Hiện ở tab trình duyệt — tự động tạo từ logo vuông."
- Apple Icon: "PNG 180×180px. Icon khi thêm vào màn hình chính iOS."
- OG Image: "PNG/JPG 1200×630px. Hiện khi chia sẻ link lên mạng xã hội (Facebook, Zalo, Twitter)."

## Related Code Files
- Modify: `apps/admin/app/api/admin/settings/shop-info/route.ts` — thêm seoDescription, seoKeywords
- Modify: `apps/main/app/layout.tsx` — generateMetadata() với full SEO tags
- Modify: `apps/admin/app/layout.tsx` — generateMetadata() với title động
- Modify: `apps/admin/app/(dashboard)/settings/_content.tsx` — thêm SEO fields + hint text

## Implementation Steps
1. `shop-info/route.ts`: thêm `seoDescription` (max 160 chars trim) + `seoKeywords` vào type + handler
2. `main/app/layout.tsx`: refactor `metadata` const → `generateMetadata()` async function, fetch shop_info + branding, build full Metadata object
3. `admin/app/layout.tsx`: tương tự, chỉ cần `title` + `icons` (đơn giản hơn)
4. Settings `_content.tsx`: thêm Textarea cho `seoDescription` (maxLength=160, counter hiển thị số ký tự còn lại) + Input cho `seoKeywords`; thêm hint text dưới mỗi ImageUpload field
5. Kiểm tra next.config.ts có `images.remotePatterns` cho Supabase domain chưa, thêm nếu thiếu

## Success Criteria
- [ ] `<title>` và `<meta name="description">` render đúng từ DB
- [ ] OG tags hiện khi inspect page source
- [ ] Favicon dùng đúng URL từ DB
- [ ] SEO fields lưu/load đúng trong Settings
- [ ] Hint text hiển thị dưới mỗi upload field
- [ ] Character counter cho seoDescription

## Risk Assessment
- `generateMetadata()` là async server function — không ảnh hưởng client bundle
- next.config.ts remote patterns: cần thêm Supabase domain để Next.js Image optimize hoạt động
