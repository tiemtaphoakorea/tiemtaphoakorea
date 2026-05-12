# Module: Customers — Khách hàng (`/customers`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/customers/_content.tsx`, `[id]/`, `CustomerDrawer` shared.
> Existing TC: TC-CUST-001..012 (most `needs-fix`).
> Tier logic: `@/lib/customer-tier` → `resolveCustomerTier`.

## Screen Inventory

| Screen | Notes |
|--------|-------|
| List `/customers` | Search debounce. Status filter (all/active/inactive). Page size. Columns: code, name, phone, tier badge, totalSpent, lastOrderAt. "Thêm khách" button → CustomerDrawer. |
| Detail `/customers/[id]` | Customer profile + stats + order history + debt summary. |
| Drawer | CustomerDrawer — create/edit profile form. |

---

## (I) Interaction Test Cases

### US-CUST-I001 — Search by name/phone/code debounced

**Acceptance Criteria**:
- AC1 (Match name/phone/code**): ilike across 3 fields.
- AC2 (Debounce 300ms**).
- AC3 (Page reset on search change**).

### US-CUST-I002 — Status filter all/active/inactive

**Acceptance Criteria**:
- AC1 (Default = all**).
- AC2 (Inactive option**): Filter customers with `isActive=false`.
- AC3 (Combined with search**).

### US-CUST-I003 — CustomerDrawer create/edit

**Acceptance Criteria**:
- AC1 (Open create**): Click "Thêm khách" → drawer mở với empty form.
- AC2 (Open edit**): Click row action → drawer với pre-filled data.
- AC3 (Close + reset**): Click X / overlay → state → undefined.
- AC4 (Submit success invalidate list**).
- AC5 (Validation**): Required fullName, phone unique.
- AC6 (Address preservation**): Recent fix `6fcc621` — address không bị wipe trên edit (regression test).

### US-CUST-I004 — Tier badge color

**Acceptance Criteria**:
- AC1 (Resolved tier**): `resolveCustomerTier(orderCount, totalSpent)` → returns 'loyal' | 'frequent' | 'regular'.
- AC2 (Color**): loyal=amber, frequent=indigo, regular=gray.
- AC3 (Dynamic with settings**): Tier change after settings threshold update (xem US-SET-B002).

### US-CUST-I005 — Row click navigate detail

**Acceptance Criteria**:
- AC1 (Click row**): Navigate `/customers/{id}`.
- AC2 (Action menu stop propagation**).

### US-CUST-I006 — Pagination + page size

**Acceptance Criteria**: Standard pattern (similar to other modules).

### US-CUST-I007 — Empty state

**Acceptance Criteria**:
- AC1 (Loading**): 5 skeleton rows.
- AC2 (Empty search result**): "Không tìm thấy khách hàng".

---

## (B) Business Test Cases

### US-CUST-B001 — Customer code auto-increment

**Acceptance Criteria** (existing TC-CUST-003): Server generate `KH-YYMMDD-XXX` format unique.

### US-CUST-B002 — Duplicate phone handling

**Acceptance Criteria** (TC-CUST-010):
- AC1 (Unique enforce**): Same phone → 409 "Số điện thoại đã tồn tại".
- AC2 (Update with same phone**): Update keeping own phone → OK.
- AC3 (Empty phone allowed**): Verify nullable schema.

### US-CUST-B003 — Address preservation on edit (regression `6fcc621`)

**Acceptance Criteria**:
- AC1 (Edit without touching address**): Submit edit → address field unchanged in DB.
- AC2 (Edit with new address**): Address updates correctly.
- AC3 (Clear address explicit**): User clears → empty saved (not preserve old).

### US-CUST-B004 — Auto-create customer from order

**Acceptance Criteria** (TC-CUST-008, TC-INT-004):
- AC1 (Order with new phone**): Auto-insert customer profile.
- AC2 (Existing phone**): Reuse existing customer_id.
- AC3 (Customer code generated**).
- AC4 (Default tier = regular**).

### US-CUST-B005 — Stats calculation per customer

**Acceptance Criteria** (TC-CUST-009):
- AC1 (orderCount**): COUNT(orders) excluding cancelled.
- AC2 (totalSpent**): SUM(orders.total) excluding cancelled.
- AC3 (lastOrderAt**): MAX(orders.createdAt).
- AC4 (debt**): SUM(unpaid).
- AC5 (Sync after order**): Stats refresh post-order create.

### US-CUST-B006 — Deactivate vs delete

**Acceptance Criteria** (TC-CUST-006):
- AC1 (Soft delete via isActive=false**): Hide from default list.
- AC2 (Hard delete blocked**): Customer with orders → cannot hard delete.
- AC3 (Reactivate cycle**): Reactivate flips isActive=true (TC-CUST-012).

### US-CUST-B007 — Classification change recompute on tier setting save

**Acceptance Criteria** (TC-CUST-005): Cross-ref US-SET-B002.

### US-CUST-B008 — RBAC

**Acceptance Criteria**:
- AC1 (Staff view**): Allow.
- AC2 (Staff create/edit**): Allow (customer mgmt is staff-level).
- AC3 (Staff deactivate**): Verify policy (likely Manager+).

---

## Linked TC-IDs

TC-CUST-001..012 (existing) — many needs-fix. Extended by US-CUST-I*/B* especially:
- US-CUST-B003 (address preservation, NEW regression for `6fcc621`)
- US-CUST-I003 AC6 (UI level address preservation check)
- TC-CUST-011, 012 (missing) → covered by US-CUST-I003 + B006

## Notes

- CustomerDrawer not deeply walked.
- `/customers/[id]` detail page — separate walk needed (order history, debt summary, payment recording).
- Customer merge feature? Not observed.
- Customer note/tags? Not observed.
- Customer import/export? Not observed.
