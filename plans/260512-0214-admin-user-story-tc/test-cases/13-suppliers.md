# Module: Suppliers — Nhà cung cấp (`/suppliers`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/suppliers/_content.tsx`, `SupplierDrawer` shared, `ConfirmDialog`.
> Existing TC: TC-SUP-001..005.

## Screen Inventory

| Screen | Notes |
|--------|-------|
| List `/suppliers` | Search debounce. "Bao gồm inactive" filter (toggle/select). Columns: name, contactName, phone, address, isActive badge, stats. CRUD via SupplierDrawer + ConfirmDialog for delete. |

---

## (I) Interaction Test Cases

### US-SUP-I001 — Search by name/phone/contact

**Acceptance Criteria**: Debounce 300ms. Match name OR contactName OR phone.

### US-SUP-I002 — Include inactive toggle

**Acceptance Criteria** (TC-SUP-004):
- AC1 (Default exclude inactive**): Filter shows only `isActive=true`.
- AC2 (Toggle on**): Query includes inactive; inactive rows shown with muted badge.
- AC3 (Visual**): Inactive row → opacity reduced or gray badge "Ngừng giao dịch".

### US-SUP-I003 — SupplierDrawer create/edit

**Acceptance Criteria**:
- AC1 (Open create**): Drawer with empty form.
- AC2 (Open edit**): Pre-filled.
- AC3 (Required**): name, phone (?).
- AC4 (Submit invalidate list**).
- AC5 (Cancel reset state**).

### US-SUP-I004 — Delete with ConfirmDialog

**Acceptance Criteria**:
- AC1 (Open dialog**): Click delete action → confirm.
- AC2 (Warn if has POs**): Show "Có N đơn nhập đang ref".
- AC3 (Confirm**): Soft delete OR block if has refs.

### US-SUP-I005 — Empty state

Loading skeleton + "Chưa có nhà cung cấp" empty.

---

## (B) Business Test Cases

### US-SUP-B001 — Create supplier validation

**Acceptance Criteria** (TC-SUP-001):
- AC1 (Required name**): Empty → 400.
- AC2 (Phone format**): No regex currently (verify).
- AC3 (Unique name?**): Verify if name UNIQUE constraint.

### US-SUP-B002 — Update supplier (TC-SUP-002)

**Acceptance Criteria**: PUT, fields persisted, updatedAt set.

### US-SUP-B003 — Deactivate vs delete (TC-SUP-003)

**Acceptance Criteria**:
- AC1 (Soft delete**): isActive=false, history retained.
- AC2 (Hard delete blocked**): Supplier with PO/receipts → cannot hard delete; only deactivate.

### US-SUP-B004 — Supplier stats (TC-SUP-005)

**Acceptance Criteria**:
- AC1 (totalReceipts count**): COUNT of completed receipts.
- AC2 (totalSpent**): SUM(receipts.payableAmount).
- AC3 (totalDebt**): SUM(receipts.debtAmount) where status='completed'.
- AC4 (lastOrderDate**): MAX(receipts.receivedAt).

### US-SUP-B005 — RBAC

Staff/Manager/Owner — usually Owner+Manager edit suppliers.

---

## Linked TC-IDs

TC-SUP-001..005 (existing) — some needs-fix. Extended by US-SUP-I*/B*.

## Notes

- SupplierDrawer not walked (form fields, validation).
- Supplier merge not implemented.
- Supplier categories not implemented.
- Cross-ref: payouts module (`/payouts`) uses supplier filter; debts aggregate per supplier.
