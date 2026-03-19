# Rieti Product Crawler & DB Seeder — Design Spec

**Date:** 2026-03-19
**Status:** Approved

## Overview

Two scripts to crawl all products from `https://en.rieti.co.kr/category/shop/25/`, export to CSV, then seed them into the platform database.

## Source

- **URL:** `https://en.rieti.co.kr/category/shop/25/`
- **Pagination:** 11 pages at the time of writing. The crawler detects the last page dynamically: it stops when a page yields no product links.
- **Structure:** Each listing item links to a product detail page. Each color variant is a separate detail page (e.g. UGO C1, UGO C2). Prices on the site are shown in USD (e.g. `USD 42.00`).

---

## Script 1: `scripts/crawl-rieti.ts`

### Purpose
Crawl all product detail pages and write a flat CSV.

### Technology
Playwright (headless Chromium) — handles JS-rendered content and pagination reliably.

### Flow
1. Open category page `?page=1`.
2. Collect all product detail URLs from the listing (`/product/{slug}/{id}/...`).
3. Navigate to the next page (`?page=N+1`) and repeat until a page yields zero product links.
4. Deduplicate collected URLs by slug (the path segment after `/product/`).
5. For each URL, visit the detail page and extract:
   - **variant_name** — full product name from the `<h2>` / product title (e.g. `UGO C1`)
   - **product_name** — base name derived by stripping the trailing ` C\d+` suffix (regex `/\s+C\d+$/i`). Example: `UGO C1` → `UGO`, `ANNA C12` → `ANNA`. If a name has no matching suffix, the full name is used as-is.
   - **slug** — the URL path segment after `/product/` (e.g. `ugo-c1`)
   - **sku** — text value of the non-disabled, non-placeholder `<option>` in the product option `<select>` (e.g. `RT1021 C1`). If no valid option is found, write an empty string.
   - **price** — numeric USD price parsed from the price text (strip `USD ` prefix, parse as float, e.g. `42.00`)
   - **description** — the specs/material text block visible on the page
   - **image_urls** — pipe-separated (`|`) list of all `<img>` `src` attributes in the product detail section that are collected from the initially rendered DOM (no additional scroll or click interaction). External CDN URLs are used as-is.
   - **category** — fixed value `SHOP`
6. Write all rows to `scripts/rieti-products.csv`.
7. If a detail page fails to load or throws, log a warning with the URL and skip it; continue to the next URL.

### Output: `scripts/rieti-products.csv`

| Column | Example |
|---|---|
| `product_name` | `UGO` |
| `variant_name` | `UGO C1` |
| `slug` | `ugo-c1` |
| `sku` | `RT1021 C1` |
| `price` | `42.00` |
| `description` | `LENS TECHNOLOGY Blocks harmful blue light...` |
| `image_urls` | `https://....jpg\|https://....jpg` |
| `category` | `SHOP` |

---

## Script 2: `scripts/seed-rieti.ts`

### Purpose
Read the CSV and insert rows into the database using Drizzle ORM.

### Technology
Same pattern as `scripts/seed-e2e.ts` — TypeScript + Drizzle. The seeder instantiates its own `drizzle` client directly (same as `seed-e2e.ts`) so it can call `client.end()` explicitly after completion; otherwise the process hangs.

### Data Mapping & Defaults

| CSV field | DB table / column | Notes |
|---|---|---|
| `product_name` | `products.name` | |
| derived from `product_name` | `products.slug` | Slugify `product_name` (lowercase, replace spaces with `-`) |
| `description` | `products.description` | From first variant in the group |
| min(`price`) across group | `products.base_price` | |
| `true` | `products.is_active` | |
| `variant_name` | `product_variants.name` | |
| `sku` | `product_variants.sku` | |
| `price` | `product_variants.price` | |
| `0` | `product_variants.cost_price` | Default; not on site |
| `0` | `product_variants.stock_quantity` | Default; not on site |
| `true` | `product_variants.is_active` | |
| each URL in `image_urls` | `variant_images.image_url` | |
| sequential index | `variant_images.display_order` | 0-based |
| first URL only | `variant_images.is_primary = true` | All others `false` |

### Flow
1. Parse `scripts/rieti-products.csv`.
2. Skip rows where `variant_name`, `sku`, or `price` is empty/unparseable (NaN) — log a warning per skipped row.
3. Group remaining rows by `product_name` — each group becomes one `products` row.
4. For each group:
   a. **Upsert `products`** using `onConflictDoUpdate` with conflict target `slug`. Update `name`, `description`, `base_price` on conflict.
   b. For each row in the group:
      - **Upsert `product_variants`** using `onConflictDoUpdate` with conflict target `sku`. Update `name`, `price` on conflict.
      - **Images:** If `image_urls` is non-empty, delete existing `variant_images` rows for this variant then insert fresh rows. If `image_urls` is empty, skip the delete/insert entirely (preserve existing images if any).
   c. `categoryId` is always `null` — the `category` CSV column is informational only and no DB lookup is performed.
   d. `cost_price_history` is **not** populated by this script.
5. Log progress per product (e.g. `[1/42] UGO — 2 variants, 6 images`).
6. Wrap each product group in a try/catch; log failures without stopping the full run.
7. Call `await client.end()` after all groups are processed (or on error) to cleanly close the postgres connection.

### Error Handling
- **Seeder:** Each product group is wrapped in a transaction. On failure, log the error and continue to the next group.

---

## Running

```bash
# Prerequisites (one-time)
npx playwright install chromium
# Ensure DATABASE_URL is set in .env or environment

# Step 1: crawl and export CSV
npx tsx scripts/crawl-rieti.ts

# Step 2: seed CSV to database
npx tsx scripts/seed-rieti.ts
```

---

## Out of Scope

- Image re-hosting (URLs remain as external Rieti CDN links)
- Category creation in DB (`categoryId` is always `null`)
- `cost_price_history` population
- Incremental/delta updates (full re-run is idempotent via upsert + image delete/re-insert)
