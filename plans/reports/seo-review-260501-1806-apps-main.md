# SEO Review — `apps/main/`

Date: 2026-05-01
Scope: Public storefront in `apps/main/` (Next.js 16, App Router)
Verdict: **Below baseline.** Critical gaps in indexability, structured data, social previews, and route hygiene.

---

## Severity legend

- **P0** — Blocks indexing / crawl / rich results. Fix immediately.
- **P1** — Standard SEO must-haves. Fix this sprint.
- **P2** — Polish, performance, semantics.

---

## P0 — Critical issues

### 1. Every page is `force-dynamic` → no static SEO benefit, every crawl hits DB
- `app/(store)/page.tsx:1`, `app/(store)/products/page.tsx:1`, `app/(store)/products/[slug]/page.tsx:1`, `app/(store)/product/[slug]/page.tsx:1` all set `export const dynamic = "force-dynamic"`.
- Effect: no static HTML at build, no ISR, no edge caching. Slow TTFB → poor CWV → ranking hit. DB load scales with crawler traffic.
- Fix: drop `force-dynamic` and use either `revalidate = 60` (or higher) on listing/home pages, plus `generateStaticParams` + `revalidate` on product detail. Use `unstable_cache` / `next: { revalidate }` in DB service calls. Force-dynamic should only be set when a request actually depends on cookies/headers (e.g. logged-in account pages).

### 2. Duplicate product route — `/product/[slug]` AND `/products/[slug]`
- Both files exist with **byte-identical** code: `app/(store)/product/[slug]/page.tsx` and `app/(store)/products/[slug]/page.tsx`.
- All internal links go to `/products/${slug}` (`PUBLIC_ROUTES.PRODUCT_DETAIL`, `category-product-card.tsx:27`, `product-listing.tsx:74,125`). The `/product/[slug]` route is unreachable from the UI but still indexable if linked externally → duplicate-content risk.
- Fix: delete `app/(store)/product/[slug]/` entirely, OR add a permanent redirect in `next.config.ts` (`redirects()` returning 308 from `/product/:slug` → `/products/:slug`).

### 3. No `robots.txt`, no `sitemap.xml`, no `manifest.webmanifest`
- `find apps/main -name "robots*" -o -name "sitemap*" -o -name "manifest*"` returns zero. `public/` only has `favicon.ico`, banners, `placeholder.png`.
- Effect: crawlers have to discover URLs blindly; no priority/freshness hints; no PWA install prompt.
- Fix: add `app/robots.ts` and `app/sitemap.ts` (Next 16 conventions). Sitemap must enumerate categories + active products from DB. Add `app/manifest.ts` for PWA basics (name, icons, theme color).

### 4. `<html lang="en">` but all content is Vietnamese
- `app/layout.tsx:36` — hard-coded `lang="en"` while titles/descriptions/UI are Vietnamese (`Mỹ phẩm & Đồ gia dụng Hàn Quốc chính hãng`).
- Effect: misleads search engines, screen readers, and translation tools. Hurts Vietnamese ranking signals.
- Fix: `<html lang="vi">`.

### 5. No `metadataBase` set → relative OG/canonical URLs break
- Root layout `metadata` only has `title`/`description`. Without `metadataBase`, any future `openGraph.images` or canonical URL will resolve incorrectly and Next will warn.
- Fix: in `app/layout.tsx` add `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://k-smart.example")`.

---

## P1 — Standard must-haves missing

### 6. Zero structured data (JSON-LD)
- `grep openGraph|twitter|JsonLd|application/ld` across `app/` + `components/` returns nothing.
- For an e-commerce site this is a major gap. Missing rich-result eligibility for:
  - `Product` (price, availability, brand, image, sku) on product pages
  - `BreadcrumbList` on product/category pages (breadcrumb UI exists but no JSON-LD)
  - `Organization` + `WebSite` (with `SearchAction` for sitelinks search box) on home
- Fix: emit JSON-LD via `<script type="application/ld+json">` in product/category/home pages. Pull product data from the same `getProductBySlug` call already running.

### 7. No Open Graph / Twitter Card metadata anywhere
- `metadata` blocks in `layout.tsx`, `(store)/page.tsx`, `products/page.tsx`, and both product `metadata.ts` files only set `title` + `description`.
- No `openGraph: { title, description, images, type, locale, siteName }`, no `twitter: { card: "summary_large_image", ... }`.
- Effect: shares on FB/Zalo/X show no preview card → low CTR.
- Fix: add OG + Twitter blocks. On product pages, use `product.thumbnail`, `product.name`, formatted price, currency. Set `openGraph.locale: "vi_VN"`, `siteName: "K-SMART"`.

### 8. No `alternates.canonical` on any page
- Listing page accepts `category`, `sort`, `page`, `limit`, `minPrice`, `maxPrice` — all crawlable as separate URLs. Without canonicals, every facet permutation competes for ranking.
- Fix: add `alternates: { canonical: ... }` per page. For `/products`, canonical to base or to category-only URL (drop sort/page/price params from canonical). For product detail, canonical to `/products/{slug}`.

### 9. Listing facet URLs likely flooding the index
- `products/page.tsx:55-67` derives state from query params with no `noindex` for filter combinations. `?sort=...&page=2&minPrice=...&maxPrice=...` are all 200-OK and crawlable.
- Fix: emit `robots: { index: false, follow: true }` in metadata when `sort`/`page>1`/price filters are present, OR canonicalize aggressively (preferred). Pagination beyond page 1 should at minimum be canonical to itself with prev/next semantics, but for VN e-commerce `noindex,follow` is the simpler win.

### 10. Product `description` used raw in meta description without truncation/sanitization
- `products/[slug]/metadata.ts:20`: `description: product.description || ...`.
- If `description` contains HTML or is >160 chars, Google truncates and the snippet looks broken. It may also contain markdown.
- Fix: strip HTML, collapse whitespace, hard-cap to ~155 chars, then fall back to a templated default.

### 11. 404 page is a stub with no metadata
- `app/not-found.tsx` returns a div. No `<title>` override, no metadata.
- Fix: add `metadata: { title: "Không tìm thấy | K-SMART", robots: { index: false } }`. Provide useful links back to home/products to recover the user.

---

## P2 — Polish

### 12. Heading hierarchy mostly fine, one risk on home
- Home (`(store)/page.tsx`) renders `Hero` (mobile) + `HeroThreeCol` (desktop). On mobile, `hero-banner-carousel.tsx:133` emits `<h1>` per slide → multiple `<h1>` if more than one slide is in DOM (currently only the active slide is rendered, so likely fine, but verify). Desktop `HeroThreeCol` has no `<h1>` at all → home page may have **no `<h1>` on desktop**.
- Fix: ensure exactly one `<h1>` per route. Home page desktop should have a visible (or visually-hidden) `<h1>` like "K-SMART — Mỹ phẩm & Đồ gia dụng Hàn Quốc chính hãng".

### 13. Image SEO — `alt` text is generic
- Most `Image` components use `alt={product.name}` — fine. But `product-gallery.tsx:97` uses `alt={`${productName} ${index + 1}`}` which is weak. Category cards use `alt={card.title}` — OK.
- Chat image (`customer-message-list.tsx:87`) uses `alt="Chat image"` — non-public so low priority.
- Fix: gallery alt should describe the image variant (e.g. `${productName} – ảnh ${index + 1}`) or include color/angle when available.

### 14. `next/image` `sizes` mostly correct, but verify hero
- `hero-three-col.tsx:91` uses `sizes="(max-width: 1280px) 15vw, 180px"` for an image inside an 8-column grid → likely OK but worth measuring.
- LCP image: hero banner (`hero-banner-carousel.tsx:107`) sets `priority={i===0}` ✓ and product gallery (`product-gallery.tsx:53`) also uses `priority` ✓. Good.

### 15. `sapo.dktcdn.net` and `ecimg.cafe24img.com` whitelisted in `next.config.ts`
- These are competitor/legacy CDNs. Indicates seeded data from scraped sources. Not an SEO bug per se, but Google can detect duplicate product images across sites which dilutes uniqueness.
- Fix: re-host product images on own Supabase storage (already supported via `*.supabase.co` allow-list).

### 16. `placeholder.png` returned for any Unsplash URL
- `(store)/page.tsx:31-34` `safeImage()` returns `/placeholder.png` for any unsplash URL. If many products still seed from Unsplash in prod, the home page becomes a wall of placeholders → ugly social previews and 0% useful product imagery for image search.
- Fix: backfill product thumbnails before launch, or hide products with placeholder thumbnails from home rails.

### 17. Mobile viewport allows zoom-out only to 5x — fine. But `viewportFit: "cover"` requires safe-area padding
- Already set, just verify the announcement bar / mobile bottom nav respect `env(safe-area-inset-*)`.

### 18. No analytics / Search Console verification tag
- No `verification` field in metadata, no GTM/GA snippet visible.
- Fix: add `verification: { google: "...", other: { "facebook-domain-verification": "..." } }` to root metadata once tokens exist.

### 19. Internal anchor text
- Most product cards use `<Link href="/products/{slug}">` wrapping the image and title — good. Spot-check that the title text is the link text (not just the image), so anchor-text signals propagate.

### 20. Trailing-slash policy not declared
- Mixed trailing-slash handling can cause duplicate URLs. Next defaults to no trailing slash; verify Vercel/host config matches and add a redirect rule if not.

---

## Suggested fix order (1 PR each)

1. `lang="vi"` + `metadataBase` + delete `/product/[slug]` route. (5-line change, big win.)
2. Add `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`.
3. Drop `force-dynamic` from public routes; add `revalidate` + `unstable_cache` on DB reads.
4. Add Open Graph + Twitter metadata to root + product + listing.
5. Add JSON-LD: `Product` on detail, `BreadcrumbList` on detail+listing, `Organization`+`WebSite` on home.
6. Canonicals + `noindex` for filtered listings.
7. Sanitize/truncate product description for meta tag.
8. 404 page metadata + recovery links.

---

## Unresolved questions

- What is the production domain? Needed for `metadataBase`, sitemap URLs, OG, canonicals.
- Is there a brand/organization logo finalized for OG default image and `Organization` JSON-LD?
- Does the Vietnamese storefront target `vi-VN` only, or is an English version planned (affects `hreflang` strategy)?
- Are product reviews planned? Reviews unlock `AggregateRating` JSON-LD for stars in SERP.
- Will the site live behind Cloudflare / Vercel CDN? Cache headers and sitemap submission depend on this.
- Is the `/product/[slug]` route kept on purpose for an external integration, or is it safe to delete?
