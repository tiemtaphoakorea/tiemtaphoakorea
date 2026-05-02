# Customizable Homepage Collections — Design

**Date:** 2026-05-02
**Status:** Approved (ready for plan)
**Owner:** kien.ha

## Goal

Cho phép admin tự tạo, cấu hình, sắp xếp và bật/tắt các "collection" (danh sách sản phẩm) hiển thị trên homepage của customer store, thay thế hoàn toàn 3 section cứng hiện tại (`Bán chạy nhất`, `Hàng mới về`, `Featured`). Hỗ trợ cả collection thủ công (admin chọn từng sản phẩm) và auto-rule (best sellers, new arrivals, by category).

## Non-Goals (YAGNI)

- Schedule (`startsAt` / `endsAt`) — không có
- Visibility per breakpoint (mobile_only / desktop_only) — bỏ logic `md:hidden` cũ, mọi collection render mọi breakpoint
- Auto-rule khác (`on_sale`, `by_tag`, `most_viewed`, `low_stock`) — chỉ làm 3 loại
- A/B testing, personalization
- Cache tag invalidation — dùng `force-dynamic` đã có
- Optimistic locking khi reorder concurrent — last-write-wins

## Architecture

### Data Model

```
homepage_collection_type (enum):
  manual | best_sellers | new_arrivals | by_category

homepage_collections:
  id           uuid pk
  type         enum not null
  title        varchar(200) not null
  subtitle     text
  iconKey      varchar(50)            -- key vào GENERATED_ICONS
  viewAllUrl   text                   -- null → fallback /products
  itemLimit    int not null default 8
  isActive     bool not null default true
  sortOrder    int not null default 0
  categoryId   uuid fk categories(id) on delete set null
  daysWindow   int                    -- for new_arrivals (default 30)
  createdAt    timestamp not null
  updatedAt    timestamp not null

  index (isActive, sortOrder)

homepage_collection_products:
  collectionId uuid fk homepage_collections(id) on delete cascade
  productId    uuid fk products(id) on delete cascade
  sortOrder    int not null default 0
  pk (collectionId, productId)
  index (collectionId, sortOrder)
```

### Validation (app layer)

| type | categoryId | daysWindow | junction |
|---|---|---|---|
| `manual` | ignored | ignored | required (≥0 rows) |
| `best_sellers` | ignored | ignored | ignored |
| `new_arrivals` | ignored | required (default 30) | ignored |
| `by_category` | required | ignored | ignored |

### Backend Services

`packages/database/src/services/homepage-collection.server.ts`

```ts
// Public
getActiveHomepageCollections(): Promise<RenderedCollection[]>
//   Returns collections where isActive=true, sorted by sortOrder.
//   Each item resolved: { meta, products: ProductListItem[] }.
//   Dispatches by type:
//     - best_sellers   → reuse existing getBestSellers(itemLimit)
//     - new_arrivals   → reuse existing getNewArrivals(itemLimit, daysWindow ?? 30)
//     - by_category    → new getProductsByCategory(categoryId, itemLimit)
//     - manual         → join products ↔ junction ↔ variants/images,
//                        filter products.isActive=true,
//                        order by junction.sortOrder, limit itemLimit

// Admin CRUD
listCollectionsForAdmin()        // includes inactive, with manual product counts
getCollection(id)                // includes manual product list
createCollection(data)
updateCollection(id, data)       // if type changes, reset config fields; if was manual, also clear junction (with admin-side confirm)
deleteCollection(id)             // cascade clears junction
reorderCollections(ids: string[])

// Manual product management
setCollectionProducts(collectionId, productIds: string[])  // order = sortOrder 0..N
```

Output type khớp `ProductCardSelect` đã có để frontend reuse `<ProductCard>`.

### Frontend (Customer Homepage)

**Refactor `apps/main/app/(store)/page.tsx`:**

```tsx
async function CollectionsSection() {
  const collections = await getActiveHomepageCollections();
  return (
    <>
      {collections.map((c) => (
        <HomepageCollection key={c.id} collection={c} />
      ))}
    </>
  );
}
```

Loại bỏ `<FeaturedProductsSection>`, `<BestSellersSection>`, `<NewArrivalsSection>`. Giữ nguyên `Hero`, `HeroThreeCol`, `MobileCategoryRail`, `TrustStrip`, `CategoryStripEight`, `MobileCategoryCards`.

**New component:** `apps/main/components/sections/homepage-collection.tsx`

- Generic — render header (title + subtitle + icon + viewAll link) + product grid
- Layout: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- Reuse `<ProductCard>` và `GeneratedIcon` (lookup theo `iconKey`)
- Empty resolve (0 products) → return `null`
- ViewAll URL: `collection.viewAllUrl ?? PUBLIC_ROUTES.PRODUCTS`

### Admin UI

**Route:** `/dashboard/homepage` (mục "Trang chủ" trong nav admin)

**Trang list:**
- Drag-drop list (`@dnd-kit/core` + `@dnd-kit/sortable`) → mỗi drop call `reorderCollections`
- Mỗi card hiển thị: title, type, key config (limit, daysWindow, category, # products)
- Switch `isActive` inline
- Actions: Sửa (mở dialog/sheet), Xoá (confirm)
- Button "+ Tạo collection" → mở form trống

**Form (create / edit):**
- Type select (lock sau khi save? — không, cho phép đổi nhưng confirm clear nếu manual)
- Title (required), subtitle, icon select (preview thumbs từ `GENERATED_ICONS`), itemLimit, viewAllUrl
- Conditional fields theo type:
  - `by_category` → category select
  - `new_arrivals` → daysWindow input
  - `manual` → product picker section
  - `best_sellers` → no extra
- Nếu đổi type khỏi `manual` → confirm "Xoá danh sách sản phẩm thủ công?"

**Manual product picker:**
- Search dialog để chọn product (kiểm tra pattern có sẵn từ admin order creation khi implement)
- Sortable list (drag-drop) → save junction theo thứ tự
- Remove button per product

### API Routes

```
GET    /api/homepage/collections                    → list (admin)
POST   /api/homepage/collections                    → create
GET    /api/homepage/collections/:id                → get with products
PATCH  /api/homepage/collections/:id                → update
DELETE /api/homepage/collections/:id                → delete
PATCH  /api/homepage/collections/reorder            → body: { ids: string[] }
PUT    /api/homepage/collections/:id/products       → body: { productIds: string[] }
```

Auth: existing admin RBAC middleware.

### Migration & Seed

1. Drizzle migration tạo enum + 2 bảng + indexes
2. Seed 3 collection mặc định (idempotent — check trước khi insert):
   - `Bán chạy nhất` — type=`best_sellers`, itemLimit=4, iconKey=`beauty`, sortOrder=1, isActive=true
   - `Hàng mới về` — type=`new_arrivals`, daysWindow=30, itemLimit=8, sortOrder=2, isActive=true
   - `Featured` — type=`manual`, itemLimit=5, sortOrder=0, isActive=true, empty junction

## Files

### Create

```
packages/database/src/schema/homepage-collections.ts
packages/database/src/services/homepage-collection.server.ts
packages/database/drizzle/<timestamp>_homepage_collections.sql        (auto-gen)
apps/admin/app/(dashboard)/homepage/page.tsx
apps/admin/app/(dashboard)/homepage/_components/collection-list.tsx
apps/admin/app/(dashboard)/homepage/_components/collection-form.tsx
apps/admin/app/(dashboard)/homepage/_components/manual-product-picker.tsx
apps/admin/app/api/homepage/collections/route.ts
apps/admin/app/api/homepage/collections/[id]/route.ts
apps/admin/app/api/homepage/collections/[id]/products/route.ts
apps/admin/app/api/homepage/collections/reorder/route.ts
apps/main/components/sections/homepage-collection.tsx
```

### Modify

```
packages/database/src/schema/index.ts                 (export new schema)
packages/database/src/schema/relations.ts             (add relations)
apps/main/app/(store)/page.tsx                        (replace 3 sections)
apps/admin/app/(dashboard)/_content.tsx               (nav entry "Trang chủ")
apps/admin/package.json                               (+ @dnd-kit/core @dnd-kit/sortable)
```

### Delete

```
apps/main/components/sections/best-sellers.tsx
apps/main/components/sections/featured-products.tsx
apps/main/components/sections/new-arrivals.tsx
```

## Edge Cases

- Active collection resolves 0 products → render `null`
- Manual collection chứa product `isActive=false` → filter ở query
- Manual collection chứa product bị xoá → cascade FK
- `daysWindow` null cho `new_arrivals` → fallback 30 trong service
- `categoryId` null cho `by_category` → service trả empty + warn log
- Đổi type khỏi `manual` → confirm trước khi clear junction (admin UI), service idempotent
- Concurrent reorder → last-write-wins

## Testing

- Unit (`homepage-collection.server.ts`): mỗi resolver type, validation, reorder, setCollectionProducts ordering
- Integration: API routes CRUD + reorder + set products + auth
- Smoke: homepage SSR với 0 / 1 / N collections; collection rỗng (0 products); collection inactive bị skip

## Risks / Open Questions

- (Open) `getFeaturedProducts` ngoài homepage có chỗ nào dùng không — kiểm tra khi implement; nếu có thể giữ function, chỉ bỏ wiring ở `page.tsx`. Nếu không, xoá để giảm dead code.
- (Open) Pattern product picker dialog có sẵn ở admin chưa — kiểm tra `apps/admin/app/(dashboard)/orders/...` khi implement.
