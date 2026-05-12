---
title: "Branding Logo Apply + Image Generation + SEO"
status: in-progress
createdAt: "2026-05-03T15:25:00+09:00"
---

# Branding Logo Apply + Image Generation + SEO

## Overview

Logo hiện được lưu vào DB qua Settings nhưng chưa được áp dụng lên website. Plan này:
1. Áp dụng logo vào Navbar (storefront), Admin Sidebar, và Favicon động
2. Thêm cơ chế generate ảnh từ ảnh gốc (resize Canvas → favicon 32px, apple-icon 180px, OG 1200×630)
3. Thêm dynamic SEO metadata + gợi ý SEO trong Settings UI

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Apply logos to UI (navbar, sidebar, favicon)](phase-01-apply-logos-ui.md) | pending |
| 2 | [Image generation from source (Canvas resize variants)](phase-02-image-generation.md) | pending |
| 3 | [SEO metadata + settings hints](phase-03-seo-metadata-hints.md) | pending |

## Key Files

- `apps/main/app/layout.tsx` — root metadata + dynamic favicon
- `apps/main/app/(store)/layout.tsx` — fetch branding config, pass to Navbar
- `apps/main/components/layout/navbar.tsx` — display logoMainUrl
- `apps/admin/components/layout/admin-sidebar.tsx` — display logoSquareUrl
- `apps/admin/app/(dashboard)/settings/_content.tsx` — image generation UI + SEO hints
- `apps/admin/app/api/admin/settings/branding/route.ts` — add new fields if needed
- `packages/database/src/services/storage.server.ts` — upload utility
