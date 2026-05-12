# Module: Categories — Danh mục (`/categories`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/categories/_content.tsx`, `CategoryDrawer`, `ConfirmDialog`.
> Existing TC: TC-CAT-001..005 (all needs-fix).

## Screen Inventory

| Screen | Notes |
|--------|-------|
| List `/categories` | Search. Page size + pagination. Columns: image, name, slug, parent, product count, isActive. CRUD via CategoryDrawer. Tree structure (parent/child) via `CategoryWithChildren` type. |

---

## (I) Interaction Test Cases

### US-CAT-I001 — Search debounced

Filter by name; debounce 300ms.

### US-CAT-I002 — CategoryDrawer create/edit

**Acceptance Criteria**:
- AC1 (Required**): name, slug.
- AC2 (Slug pattern**): `^[a-z0-9-]+$`.
- AC3 (Parent select**): Optional, for hierarchical structure.
- AC4 (Image upload**): Verify.
- AC5 (isActive toggle**).

### US-CAT-I003 — Delete with ConfirmDialog (TC-CAT-002)

**Acceptance Criteria**:
- AC1 (Warn if has products**): "Có N sản phẩm thuộc danh mục này".
- AC2 (Hard delete blocked or soft delete**): Verify policy.
- AC3 (Confirm message**).

### US-CAT-I004 — Tree/list display

**Acceptance Criteria**:
- AC1 (Parent-child indent**): Verify if tree visual.
- AC2 (Flat list with parent badge**): Alt — column "Parent: X".

### US-CAT-I005 — Product count per category

**Acceptance Criteria**:
- AC1 (Live count**): COUNT(products) where categoryId=X.
- AC2 (Only active products**) (TC-PROD-017): Verify filter.

---

## (B) Business Test Cases

### US-CAT-B001 — Create (TC-CAT-001)

Validation: required name + unique slug.

### US-CAT-B002 — Edit (TC-CAT-003)

PUT with fields. Slug change → does product URL update? Verify routing.

### US-CAT-B003 — Delete cascade (TC-CAT-002)

Cannot delete if has products → 400 with "Danh mục có N sản phẩm".

### US-CAT-B004 — Search content asserts (TC-CAT-005)

Existing test only asserts URL — must also verify result content matches filter.

### US-CAT-B005 — Hierarchical FK constraint

Parent category cannot be self or descendant (cycle prevention).

### US-CAT-B006 — Slug unique across all categories

Even across parent levels. Verify.

---

## Linked TC-IDs

TC-CAT-001..005 (all needs-fix). Notes mention "Previously mislabeled TC-PROD-014".

## Notes

- Tree depth limit? Recommend max 3 levels.
- Move category between parents? Verify drag-drop or "move to" action.
- Featured categories for homepage collections (cross-ref homepage module).
- Category SEO (title, description)? Verify schema.
- Category image storage cleanup on delete? Verify.
