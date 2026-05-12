# Module: Products — Sản phẩm (`/products`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/products/page.tsx` (504 lines), `[id]/`, `new/`
> Existing TC: TC-PROD-001..022 trong `docs/035-QA/QA-MOC.md` (most `needs-fix` hoặc `draft`)

## Screen Inventory

| Screen | Route | Notes |
|--------|-------|-------|
| List | `/products` | Tabs: Tất cả / Còn hàng / Sắp hết / Hết hàng (URL `?filter=` persistable). Search debounce 300ms. Bulk select via Checkbox column + indeterminate state. Bulk delete with deletable-check pre-confirm. Pagination + page size. Row click navigates `/products/{id}/edit`. |
| Create | `/products/new` | Form: name, brand, category, description, variants matrix (size×color), prices, stock, low-stock threshold, images. (Source ~700+ lines — walk-through pending.) |
| Detail/Edit | `/products/[id]/edit` | Full product editor + variant table + cost price history. |

**Tab count badges**: Server query per tab `getProducts({stockStatus:f,limit:1})` để show count beside tabs (mỗi tab = 1 query).

---

## (I) Interaction Test Cases

### US-PROD-I001 — Bulk select pattern: page-scope vs all-DB

**Acceptance Criteria** (logic ở `page.tsx:197-216`):
- AC1 (Select page checkbox): Header checkbox checked → adds all `pageIds` to selectedIds Set.
- AC2 (Indeterminate state): Some rows on page selected → header shows `indeterminate` visual.
- AC3 (Uncheck removes only page ids**): Click header uncheck → remove pageIds, KEEP off-page selections.
- AC4 (Cross-page selection persists): Select 10 on page 1 → page 2 → still selected (Set across pages).
- AC5 (No "select all results in DB"**): Không có nút "Chọn tất cả 1399 sản phẩm". Manual page-by-page.
- AC6 (Clear on filter/search/page-size change**): `handleFilterChange`/`handleQueryChange`/`handlePageSizeChange`/`handlePageChange` all call `clearSelection`.

### US-PROD-I002 — Bulk delete pre-check deletable

**Acceptance Criteria** (`page.tsx:167-172`):
- AC1 (Open dialog): Click "Xóa N sản phẩm" → bulkDeleteOpen=true → trigger `checkProductsDeletable(ids)` query (only when dialog open).
- AC2 (Results display**): Dialog shows which products are NOT deletable (e.g., có orders đang ref) → blocks/warns.
- AC3 (Confirm deletes only deletable**): Verify mutation body sends only deletable IDs; non-deletable stays.
- AC4 (Toast result**): "Đã xóa N sản phẩm" với N = `result.deleted` (could be < requested).
- AC5 (Reset selection on success**): selectedIds cleared.

### US-PROD-I003 — URL filter persistence

**Acceptance Criteria** (`page.tsx:86-87`):
- AC1 (Initial from URL): `/products?filter=low_stock` → initialFilter='low_stock'.
- AC2 (Invalid filter ignored): `?filter=garbage` → fallback to 'all' (VALID_FILTERS set check).
- AC3 (No URL sync on tab change**): Current implementation chỉ READ URL, không UPDATE — verify desired behavior. **UX gap**.
- AC4 (Bookmark friendly**): User can bookmark filtered view.

### US-PROD-I004 — Tab count badges parallel queries

**Acceptance Criteria** (`page.tsx:112-129` via `useQueries`):
- AC1 (4 parallel queries): For each tab → API call với limit=1 để chỉ lấy metadata.total.
- AC2 (Sync with search query**): tabCounts cùng search keyword với main list query.
- AC3 (Show null when loading**): tabCounts[filter] null → badge ẩn.
- AC4 (Refetch on search change**): tabCounts re-fetch khi debouncedQuery thay đổi.
- AC5 (Display): "{count} sản phẩm" cạnh search input.

### US-PROD-I005 — Row click navigates to edit (not detail)

**Acceptance Criteria**:
- AC1 (Click row**): `router.push(/products/{id}/edit)` — không có read-only detail page.
- AC2 (Click checkbox stops propagation**): `onClick={(e) => e.stopPropagation()}` → checkbox toggle không navigate.
- AC3 (Click action menu stops propagation**): MoreHorizontal dropdown phải stop event.
- AC4 (Keyboard accessible**): Tab through rows → Enter activates first action (verify or add).

### US-PROD-I006 — Stock cell color theo threshold

**Acceptance Criteria**:
- AC1 (Zero stock**): totalAvailable=0 → red bold.
- AC2 (Low**): < minLowStockThreshold (default 30) → amber bold.
- AC3 (Normal**): ≥ threshold → foreground (no special color).
- AC4 (Per-product threshold**): minLowStockThreshold = product-level override (verify schema field).

### US-PROD-I007 — Delete single product dialog

**Acceptance Criteria** (`deleteTarget` state):
- AC1 (Open from menu**): MoreHorizontal → Delete → setDeleteTarget({id, name}).
- AC2 (Confirm**): AlertDialog với product name in message.
- AC3 (Error 400 with reason**): Server reject (e.g., product has orders) → toast với server error message.
- AC4 (Success**): Invalidate list, close dialog.

---

## (B) Business Test Cases

### US-PROD-B001 — Product stockStatus computed from variants

**Acceptance Criteria**:
- AC1 (in_stock): totalAvailable >= minLowStockThreshold.
- AC2 (low_stock): 0 < totalAvailable < threshold.
- AC3 (out_of_stock): totalAvailable = 0.
- AC4 (Per-variant aggregation**): totalAvailable = SUM(variants.available).
- AC5 (Available = onHand - reserved**): Verify formula consistency với inventory module.

### US-PROD-B002 — Bulk delete authorization + deletability rules

**Acceptance Criteria**:
- AC1 (Non-deletable if has orders**): Product with order_items → cannot delete (or soft delete).
- AC2 (Deletable check API**): `checkProductsDeletable` returns {deletable:[], blocked:[{id, reason}]}.
- AC3 (Bulk delete deletes only deletable**): Verify atomic transaction.
- AC4 (RBAC**): Bulk delete chỉ Owner+Manager. Staff không thấy bulk action bar.

### US-PROD-B003 — checkProductsDeletable response format

**Acceptance Criteria**:
- AC1 (Shape**): `{ deletable: string[], blocked: Array<{id, reason}> }` (verify).
- AC2 (Reason taxonomy**): Reasons: "has_orders", "has_supplier_orders", "has_inventory_movements", etc.
- AC3 (No false negatives**): All products without dependencies should be in deletable list.

### US-PROD-B004 — Search ILIKE pattern matches name + SKU

**Acceptance Criteria**:
- AC1 (Name match**): query="Kính" → products có "Kính" trong name.
- AC2 (SKU match**): query="OTL01" → match variant SKU.
- AC3 (Diacritics**): query="kinh" (no accent) → should match "Kính" — verify unicode collation hoặc add `lower()/unaccent`.

### US-PROD-B005 — Pagination + filter combo

**Acceptance Criteria**:
- AC1 (Filter + page**): filter=low_stock, page=2 → server returns 2nd page of low stock only.
- AC2 (Tab count sync**): tabCounts[low_stock] = TOTAL low_stock matching search (not just page).

### US-PROD-B006 — Delete cascades inventory + price history

**Acceptance Criteria**:
- AC1 (Hard delete impact**): DELETE product → variants, cost_price_history, inventory_movements FK behavior (CASCADE, RESTRICT, or SET NULL?).
- AC2 (Soft delete preferred**): Recommendation: status='deleted' + filter ra khỏi list.
- AC3 (Bulk delete atomic**): Single transaction; partial failure rolls back.

---

## Linked TC-IDs (existing docs)

Existing TC coverage trong `docs/035-QA/QA-MOC.md`:

| Existing TC | Status | New US replaces/extends |
|-------------|--------|------------------------|
| TC-PROD-001 (Product Creation & Variant) | reviewed | (covered) — need walk new page for I tests |
| TC-PROD-002 (List Search/Filter/Pagination) | needs-fix | US-PROD-I003, I004, I006, B004 extends |
| TC-PROD-003 (Validation Errors) | draft | (need walk new page) |
| TC-PROD-004 (Duplicate SKU) | draft | (need walk new page) |
| TC-PROD-005 (Variant Matrix) | draft | (need walk new page) |
| TC-PROD-006 (Update Product/Slug) | draft | (need walk edit page) |
| TC-PROD-007 (Cost Price History) | needs-fix | Cross-ref US-RECEIPT-B002 (WAC log) |
| TC-PROD-008 (Add/Remove Variant) | draft | (need walk) |
| TC-PROD-009 (Image Upload Rules) | draft | (need walk) |
| TC-PROD-010 (Stock Type) | draft | Cross-ref US-INV-* |
| TC-PROD-011 (Low Stock Alert) | draft | Cross-ref US-INV-B012 |
| TC-PROD-012 (Deactivate & Catalog) | needs-fix (dead code) | NEW: US-PROD-Bxx — verify deactivate flow |
| TC-PROD-013 (Catalog View) | needs-fix | Storefront — not this module |
| TC-PROD-015 (Slug Uniqueness) | draft | (need walk new page) |
| TC-PROD-016 (Variant Stock Validation) | draft | (need walk) |
| TC-PROD-017 (Category Filter Active Only) | draft | — |
| TC-PROD-018 (Low Stock Threshold Update) | needs-fix | US-PROD-I006, US-INV-B012 |
| TC-PROD-019 (Search by SKU) | draft | US-PROD-B004 AC2 |
| TC-PROD-020 (Concurrent Stock vs Order) | needs-fix | US-INV-B002 |
| TC-PROD-021 (Concurrent Stock Updates) | needs-fix | US-INV-B002 |
| TC-PROD-022 (Prevent Negative Stock) | draft | US-INV-B002 AC4, B011 |

**New interaction TCs not covered above**:
- US-PROD-I001 (Bulk select pattern)
- US-PROD-I002 (Bulk delete pre-check)
- US-PROD-I003 (URL filter persistence)
- US-PROD-I004 (Tab count badges parallel)
- US-PROD-I005 (Row click navigates)
- US-PROD-I007 (Delete single dialog)

**New business TCs**:
- US-PROD-B002 (Bulk delete RBAC + deletability)
- US-PROD-B003 (checkProductsDeletable shape)
- US-PROD-B005 (Filter + page combo)
- US-PROD-B006 (Delete cascade behavior)

## Notes / Edge cases unresolved

- **New/Edit pages not walked**: 700+ lines each — need separate detailed pass (variant matrix UX, image upload, cost price history modal).
- **URL filter sync**: Currently READ-only; consider write-back when tab changes for shareability.
- **Cross-page bulk select UX**: Counter shows "Đã chọn N" — N may span pages but user doesn't see which pages have selections. Consider chip list of selected products.
- **No "Select all results in DB" option**: For bulk operations on 1000s of products, manual page-by-page is tedious.
- **Soft delete vs hard delete**: Verify schema/policy.
- **Image lazy loading**: Verify Image component uses `next/image` with proper lazy loading.
- **Brand field source**: `getProductBrand()` extracts from where? — verify (likely metadata or category).
