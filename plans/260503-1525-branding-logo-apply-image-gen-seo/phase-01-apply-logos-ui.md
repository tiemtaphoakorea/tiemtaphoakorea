---
phase: 1
title: "Apply logos to UI (navbar, sidebar, favicon)"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Apply logos to UI

## Overview
Đọc `logoMainUrl` và `logoSquareUrl` từ branding config (DB) và áp dụng vào: Navbar storefront, Admin Sidebar, và favicon động cả hai app.

## Requirements
- Storefront Navbar: thay `Zap` icon + "K-SMART" text bằng `<img src={logoMainUrl}>` nếu có, fallback về design hiện tại
- Admin Sidebar: thay "A" box bằng `<img src={logoSquareUrl}>` nếu có, fallback về "A"
- Favicon động: cả `main` và `admin` layout dùng `logoSquareUrl` làm icon trong metadata

## Architecture
- `(store)/layout.tsx` fetch thêm `branding` config (getSetting) → pass `logoMainUrl` xuống Navbar prop
- `navbar.tsx` nhận prop `logoUrl?: string`, render `<Image>` nếu có
- `admin-sidebar.tsx` đang có sẵn `useQuery` cho shop-info, thêm query cho branding → dùng `logoSquareUrl`
- `main/app/layout.tsx` và `admin/app/layout.tsx`: `generateMetadata()` fetch branding → set `icons.icon`

## Related Code Files
- Modify: `apps/main/app/(store)/layout.tsx`
- Modify: `apps/main/components/layout/navbar.tsx`
- Modify: `apps/admin/components/layout/admin-sidebar.tsx`
- Modify: `apps/main/app/layout.tsx`
- Modify: `apps/admin/app/layout.tsx`

## Implementation Steps
1. `main/app/layout.tsx`: chuyển thành `generateMetadata()` async, fetch `getSetting<BrandingConfig>("branding")` + `getSetting<ShopInfoConfig>("shop_info")`, set `icons.icon = logoSquareUrl`
2. `admin/app/layout.tsx`: tương tự, set favicon từ logoSquareUrl
3. `(store)/layout.tsx`: thêm `getSetting<BrandingConfig>("branding")` vào Promise.all, pass `logoMainUrl` xuống `<Navbar>`
4. `navbar.tsx`: thêm prop `logoUrl?: string`; trong desktop header, nếu có logoUrl thì render `<Image src={logoUrl} alt="Logo" width={120} height={36} className="h-9 w-auto object-contain">`, else fallback về `Zap + K-SMART`; mobile cũng tương tự
5. `admin-sidebar.tsx`: thêm useQuery cho branding (key: `queryKeys.settings.branding`), trong SidebarHeader: nếu có `branding?.logoSquareUrl` thì `<Image src={logoSquareUrl} width={34} height={34} className="h-[34px] w-[34px] rounded-[9px] object-contain">`, else giữ "A" box

## Success Criteria
- [ ] Logo hiện ở Navbar desktop + mobile
- [ ] Logo hiện ở Admin Sidebar header
- [ ] Favicon tab browser dùng logoSquareUrl (cả admin và storefront)
- [ ] Fallback về design cũ khi chưa upload logo
- [ ] No TypeScript errors

## Risk Assessment
- `main/app/layout.tsx` hiện là plain export, cần refactor thành `generateMetadata` — low risk
- Next.js Image cần domain được add vào `next.config.ts` nếu URL là external (Supabase)
