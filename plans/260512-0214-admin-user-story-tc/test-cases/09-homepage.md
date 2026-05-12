# Module: Homepage — Trang chủ (`/homepage`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/homepage/` (+ `_components/`)
> Subcomponents: `banner-form-panel`, `banner-list`, `banner-row`, `collection-form-panel`, `collection-list`, `collection-row`, `icon-select`, `manual-product-picker`
> APIs: `/api/admin/homepage/collections`, `/api/admin/homepage/banners`, `/api/admin/settings/homepage`
> Libs: `@/lib/homepage-config` (HomepageConfig type + defaults), `@/lib/upload-image`

## Screen Inventory

| Tab | Features |
|-----|----------|
| Collections | List với drag-drop reorder + toggle active. "Tạo collection" button → inline form panel. Edit row → expand inline. Form: name, slug, icon, manual product picker (auto/manual), display order. |
| Banners | Same pattern as Collections — list + reorder + toggle + inline create/edit. Form: image upload (FileUploader), CTA URL, title, subtitle. |
| Settings | SEO title + meta description cho /(storefront root). |

**Pattern**: List + inline form panel (single editing slot per tab — `editingId` state). `null` = creating, `undefined` = closed, `<id>` = editing existing.

**Drag-drop**: `@dnd-kit/core` PointerSensor + KeyboardSensor → reorder API call.

---

## (I) Interaction Test Cases

### US-HOME-I001 — Tabs Collections / Banners / Settings

**Acceptance Criteria**:
- AC1 (Default tab): "collections" trên mount.
- AC2 (Switch preserves state**): editingCollectionId / editingBannerId / config local state preserved on switch (component không unmount).
- AC3 (Icons): Layout / Image / Settings2 lucide.
- AC4 (Mobile overflow): tablist `overflow-x-auto` để scroll trên hẹp viewport.

### US-HOME-I002 — Collection inline create flow

**Acceptance Criteria**:
- AC1 (Click "Tạo collection"): editingCollectionId=null → form panel render (highlighted with primary border).
- AC2 (Button disabled while creating): editingCollectionId === null → button disabled prevent double-open.
- AC3 (Close form): Click "Huỷ" hoặc outside trigger onClose → state → undefined → form unmount.
- AC4 (Submit success): Invalidate query → list refresh, panel close.
- AC5 (Counter): "{N} collections" cập nhật sau create.

### US-HOME-I003 — Collection list drag-drop reorder

**Acceptance Criteria** (`banner-list.tsx` / `collection-list.tsx`):
- AC1 (Pointer sensor): User drag row → ghost preview follows cursor.
- AC2 (Drop zone**): Drop on another row → reorder array (arrayMove from dnd-kit).
- AC3 (Persist order): After drop → PUT `/order` endpoint với new ordered IDs.
- AC4 (Optimistic update): UI updates ngay; rollback nếu API fails.
- AC5 (Keyboard accessible): KeyboardSensor `sortableKeyboardCoordinates` → space để pick up, arrow keys to move, space again to drop.
- AC6 (Active drag disable other interactions**): Toggle/edit buttons disabled while dragging.

### US-HOME-I004 — Toggle active switch

**Acceptance Criteria**:
- AC1 (Toggle on/off): Click toggle → API call `PATCH /collections/{id}` với isActive=true/false.
- AC2 (Optimistic): UI flip ngay; rollback on failure.
- AC3 (Storefront visibility**): Inactive collection KHÔNG hiện trên storefront.
- AC4 (Confirm needed?**): Toggle off live collection → consider confirm dialog. Current likely no confirm.

### US-HOME-I005 — Banner image upload

**Acceptance Criteria** (`banner-form-panel.tsx` + `lib/upload-image.ts`):
- AC1 (FileUploader): Drag-drop hoặc click pick file. Accept image/* MIME.
- AC2 (Upload progress**): Show progress %.
- AC3 (Preview): After upload → preview img.
- AC4 (Size limit**): Max 2-5MB per banner image.
- AC5 (Dimension**): Recommend dimensions hiển thị hint (e.g., 1920x600).
- AC6 (Replace existing): Re-upload overwrites previous URL trong form state.

### US-HOME-I006 — Manual product picker (collections)

**Acceptance Criteria** (`manual-product-picker.tsx`):
- AC1 (Search + select): Input search → list variants matching → click add.
- AC2 (Selected list with reorder**): Show added products, allow remove + reorder.
- AC3 (Auto vs manual mode**): Collection có 2 modes: auto (theo rule e.g. category) hoặc manual (curated list).
- AC4 (Cap N products**): Max products per collection (e.g., 20). Verify.
- AC5 (Inactive product**): Adding inactive product → warn hoặc filter ra.

### US-HOME-I007 — Form validation (react-hook-form + zod)

**Acceptance Criteria**:
- AC1 (Required fields): Empty name → field error inline.
- AC2 (Slug pattern**): Slug regex `^[a-z0-9-]+$` → enforce.
- AC3 (URL pattern banner CTA**): Validate URL format.
- AC4 (Submit disabled until valid**): RHF state.
- AC5 (Reset on close): Form reset state khi close.

### US-HOME-I008 — Inline edit conflict (only 1 form open)

**Acceptance Criteria**:
- AC1 (Click edit row A): editingId=A → other rows non-editable.
- AC2 (Click edit row B while A open**): Current behavior — switches to B (or blocks?). Verify UX choice.
- AC3 (Unsaved changes prompt**): Switching with unsaved changes → confirm dialog. Likely absent.

### US-HOME-I009 — SEO settings tab simple form

**Acceptance Criteria**:
- AC1 (Title input): config.seo.title.
- AC2 (Description textarea**): config.seo.description (max length?).
- AC3 (Save button): "Lưu cài đặt trang chủ", isPending state.
- AC4 (No max-length enforced**): SEO desc thường nên ≤ 160 chars (giống module Settings). Verify.

### US-HOME-I010 — Empty state per tab

**Acceptance Criteria**:
- AC1 (Empty collections): list.length=0 → `Empty` component với description.
- AC2 (Empty banners**): same.
- AC3 (Loading): Show "Đang tải..." text in counter.

---

## (B) Business Test Cases

### US-HOME-B001 — Collection CRUD persistence

**Acceptance Criteria**:
- AC1 (Create): POST → row in `homepage_collections` table với name, slug, icon, displayOrder, mode (auto/manual), isActive=true, productIds (if manual).
- AC2 (Read list): GET → order by displayOrder ASC.
- AC3 (Update): PUT { ...fields } → updatedAt = now.
- AC4 (Delete): DELETE → soft delete hoặc hard delete? Verify.
- AC5 (Slug uniqueness): UNIQUE constraint on slug → 2nd same slug → 409.

### US-HOME-B002 — Banner CRUD persistence

**Acceptance Criteria**:
- AC1 (Create): POST → row in `homepage_banners` với imageUrl, ctaUrl, title, subtitle, displayOrder, isActive.
- AC2 (Image URL stored**): Path to Supabase Storage public URL.
- AC3 (Update**): Replace image deletes old file?
- AC4 (Delete**): Hard delete with image cleanup.

### US-HOME-B003 — Reorder API atomic update

**Acceptance Criteria**:
- AC1 (Body): `PUT /collections/order` với array of IDs trong new order.
- AC2 (Transaction): UPDATE all rows with new displayOrder atomically (or single SQL with CASE).
- AC3 (Partial failure rollback**): All-or-nothing.
- AC4 (Race condition**): 2 admin reorder cùng lúc → last-write-wins; consider version field.

### US-HOME-B004 — isActive toggle persists + storefront filter

**Acceptance Criteria**:
- AC1 (Toggle DB**): isActive=false → row updated.
- AC2 (Storefront query filter**): Storefront homepage SSR query WHERE isActive=true → inactive items excluded.
- AC3 (Cache invalidation**): Storefront cached page revalidated post-toggle.

### US-HOME-B005 — Collection manual product list integrity

**Acceptance Criteria**:
- AC1 (FK constraint**): productIds reference active products. Schema: `productIds[]` array or join table?
- AC2 (Inactive product**): Manual collection có product inactive → storefront should skip or show?
- AC3 (Deleted product**): Soft-deleted product still in array → storefront skip; admin UI mark as "deleted".
- AC4 (Order preserved**): Manual list display order = saved order, không sort by name/price.

### US-HOME-B006 — Auto collection rule evaluation

**Acceptance Criteria**:
- AC1 (Rule types**): Có thể category-based, tag-based, bestseller-based, new-arrival-based. Verify type enum.
- AC2 (Realtime vs cached**): Storefront resolves auto collection on each request? Or pre-computed nightly?
- AC3 (Limit cap**): Auto returns top N (e.g., 12) — UI configurable?

### US-HOME-B007 — Banner image storage cleanup on delete

**Acceptance Criteria**:
- AC1 (Soft vs hard delete**): Banner delete → row remove + Supabase Storage object delete.
- AC2 (Orphan storage cleanup**): Nếu hard delete fail at storage level → orphan file. Nightly cleanup job?

### US-HOME-B008 — RBAC: Manage homepage

**Acceptance Criteria**:
- AC1 (Owner**): Full CRUD.
- AC2 (Manager**): Verify if Manager có quyền edit homepage hay không.
- AC3 (Staff**): Read-only or no access.

### US-HOME-B009 — SEO title/desc rendered on storefront `<head>`

**Acceptance Criteria**:
- AC1 (Title tag**): `<title>{config.seo.title}</title>`.
- AC2 (Meta description**): `<meta name="description" content="{config.seo.description}">`.
- AC3 (Default fallback**): Missing → fallback từ shop info (xem 07-settings.md US-SET-B004).
- AC4 (Per-language**): Single language for now; multi-lang future.

### US-HOME-B010 — Storefront homepage layout uses saved order

**Acceptance Criteria**:
- AC1 (Render order = saved displayOrder ASC**): Both banners + collections.
- AC2 (Pagination**): Storefront might paginate collections beyond first viewport.
- AC3 (Banner carousel auto-play**): Verify storefront banner UI (likely Embla carousel).

### US-HOME-B011 — Validation server-side on banner/collection

**Acceptance Criteria**:
- AC1 (Required fields**): API endpoint Zod schema reject missing required.
- AC2 (Slug unique**): Server enforces UNIQUE.
- AC3 (URL pattern**): CTA URL validated.
- AC4 (Image URL pattern**): Must be from Supabase Storage domain (whitelist).

### US-HOME-B012 — Audit changes on homepage components

**Acceptance Criteria**:
- AC1 (Recommendation**): Audit table cho who toggled/edited.
- AC2 (Current**): Likely not implemented. Add for accountability.

---

## Linked TC-IDs (existing docs)

- Không có TC-HOME-* hoặc TC-BANNER-* trong `docs/035-QA/QA-MOC.md`.
- Conceptual:
  - TC-STORE-001 (Storefront Homepage Load) → render output của module này.
  - TC-STORE-003 (Navbar Category Links) → related to collections nav.

## Notes / Edge cases unresolved

- **Inline edit single slot**: Open form A → click edit B → switch? Verify UX.
- **Drag-drop on mobile**: PointerSensor → touch works? Verify.
- **No "Save & continue" pattern**: Form submit closes panel.
- **Banner without image**: Required? If imageUrl empty → storefront skip?
- **Manual product picker performance**: 1399 products in DB — search needs server-side, not client-side filter.
- **Collection icon select**: `icon-select.tsx` — preset icon list (verify which icons).
- **Banner CTA target_blank**: External vs internal CTA? Default open mode?
- **No preview before save**: User cannot preview homepage layout before publishing.
- **No A/B test or schedule**: Banners cannot be scheduled (start/end date).
- **No analytics on banner clicks**: Cần GA event hoặc internal tracking.
