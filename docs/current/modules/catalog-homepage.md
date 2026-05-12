# Catalog And Homepage

## Scope

This domain covers admin product/catalog management, categories, public product listing/detail behavior, and configurable storefront homepage collections.

## Key Code

| Area | Path |
| --- | --- |
| Product service | `packages/database/src/services/product.server.ts` |
| Category service | `packages/database/src/services/category.server.ts` |
| Homepage collection service | `packages/database/src/services/homepage-collection.server.ts` |
| Product schema | `packages/database/src/schema/products.ts` |
| Category schema | `packages/database/src/schema/categories.ts` |
| Homepage collection schema | `packages/database/src/schema/homepage-collections.ts` |
| Shared form schemas | `packages/shared/src/schemas` |

## Business Rules

- Products can have variants; each variant owns SKU, price, cost, stock, and images.
- Public listing exposes active products only.
- Product and category slugs are normalized from names and made unique.
- Variant SKUs must be unique.
- Product media UI accepts `image/*` and currently allows up to 10 images per variant.
- Product image upload does not have a documented server-side type or size limit.
- Category data is hierarchical. Search returns a flat list; normal reads return a tree.
- Navigation categories are active root categories with `showInNav=true`.
- Category product counts include direct and descendant products where implemented.
- Deleting a category currently leaves children as roots because the parent FK is `SET NULL`.
- Homepage collections render only active collections, sorted by `sortOrder`.
- Active homepage collections resolving zero active products are hidden from the storefront.
- Homepage collection types are `manual`, `best_sellers`, `new_arrivals`, and `by_category`.
- `new_arrivals` uses a default 30-day window when `daysWindow` is absent.
- `by_category` without a category resolves empty and logs a warning.
- Manual collections filter inactive products and preserve junction `sortOrder`.
- Storefront banners are active/date-filtered, sorted by `sortOrder`, and support `custom` or `category` banner types.
- Custom banners require an image in the shared form schema.
- Category banners require a category and can derive fallback image/title/CTA values from the linked category and active products.

Read `docs/current/06-business-rules.md` for cross-domain accounting and inventory effects.

## Legacy Rules Not Migrated

- Legacy docs said order creation immediately decrements stock. Current code reserves on order creation and decrements `onHand` at stock-out.
- Legacy docs mention hardcoded homepage sections. Current homepage sections are admin-managed collections.
- Legacy docs mention `top/middle/bottom` banner positions. Current banners use type, active dates, and `sortOrder`, not position buckets.
