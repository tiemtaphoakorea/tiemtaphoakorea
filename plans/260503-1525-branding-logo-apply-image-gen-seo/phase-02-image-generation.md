---
phase: 2
title: "Image generation from source (Canvas resize variants)"
status: pending
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 2: Image generation from source

## Overview
Khi upload logo gốc (logoSquareUrl), Settings UI tự động generate các variant cần thiết dùng Canvas API phía client, rồi upload từng variant lên Supabase storage.

## Requirements
- Variants cần generate từ logoSquareUrl (ảnh vuông):
  - `favicon`: 32×32 PNG (dùng cho browser tab)
  - `apple-icon`: 180×180 PNG (iOS home screen)
  - `og-image`: không resize từ logo vuông — dùng logoMainUrl hoặc upload riêng
- User nhìn thấy preview từng variant + nút "Generate & Save"
- Không cần cài thêm thư viện — dùng `HTMLCanvasElement` browser native

## Architecture

### Client-side flow
```
User upload logoSquare
  → canvas resize → 32×32 PNG blob → POST /api/upload → lưu vào brandingConfig.faviconUrl
  → canvas resize → 180×180 PNG blob → POST /api/upload → lưu vào brandingConfig.appleIconUrl
```

### New fields in BrandingConfig (branding route)
```ts
type BrandingConfig = {
  // existing
  logoMainUrl: string;
  logoSquareUrl: string;
  logoAccent: string;
  brandColor: string;
  accentColor: string;
  // new
  faviconUrl: string;      // 32×32
  appleIconUrl: string;    // 180×180
  ogImageUrl: string;      // 1200×630 (upload thủ công)
}
```

### Utility: `resize-image-canvas.ts`
```ts
export async function resizeImageViaCanvas(
  src: string,
  width: number,
  height: number
): Promise<Blob>
```
- Tạo `<img>`, load URL, vẽ lên canvas `width×height`, export `canvas.toBlob("image/png")`

## Related Code Files
- Modify: `apps/admin/app/api/admin/settings/branding/route.ts` — thêm faviconUrl, appleIconUrl, ogImageUrl
- Modify: `apps/admin/app/(dashboard)/settings/_content.tsx` — thêm "Generate variants" UI section
- Create: `apps/admin/lib/resize-image-canvas.ts` — canvas resize utility

## Implementation Steps
1. Thêm `faviconUrl`, `appleIconUrl`, `ogImageUrl` vào `BrandingConfig` type + DEFAULT_CONFIG + PUT handler
2. Tạo `apps/admin/lib/resize-image-canvas.ts`:
   - `resizeImageViaCanvas(src, w, h): Promise<Blob>` — load img, canvas drawImage, toBlob
   - `blobToFile(blob, name): File` — wrap blob thành File object cho FormData
3. Trong `_content.tsx`:
   - Thêm state `faviconUrl`, `appleIconUrl`, `ogImageUrl`
   - Sau section "Logo vuông", thêm button "Tạo biến thể tự động" (chỉ enable khi có logoSquare)
   - Handler: gọi `resizeImageViaCanvas` cho từng size, upload qua `/api/upload`, cập nhật state
   - Hiển thị preview 3 variants (32px, 180px) với label và kích thước
   - Thêm ImageUpload field riêng cho `ogImageUrl` với gợi ý "1200×630px"
4. Cập nhật save handler để include `faviconUrl`, `appleIconUrl`, `ogImageUrl`
5. Phase 1 dùng `faviconUrl` (nếu có) thay `logoSquareUrl` cho favicon metadata

## Success Criteria
- [ ] Button "Tạo biến thể" generate và upload 32×32 + 180×180 thành công
- [ ] Preview hiện đúng kích thước
- [ ] `faviconUrl` được lưu vào DB và dùng cho favicon
- [ ] `ogImageUrl` upload riêng, lưu vào DB
- [ ] Không lỗi khi logoSquare chưa có (button disabled)

## Risk Assessment
- Canvas CORS: nếu Supabase URL không có CORS header phù hợp, `drawImage` sẽ bị taint canvas → cần `img.crossOrigin = "anonymous"` và Supabase bucket phải có CORS rule `*`
- Canvas chỉ export PNG — không export ICO natively, nhưng browser và Next.js metadata đều chấp nhận PNG favicon
