# Module: Supplier Orders — Đặt hàng pre-order (`/supplier-orders`) — LEGACY

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/supplier-orders/` (_content, _create-dialog, _detail-dialog, _shared).
> Existing TC: TC-SUP-ORDER-001..028.
> **Note**: Module này KHÔNG có trong sidebar mới — có khả năng đã deprecated thay bằng `/purchases` + `/receipts`. Cần xác nhận với team.

## Screen Inventory

| Screen | Notes |
|--------|-------|
| List `/supplier-orders` | Search + status filter. Dialog (modal) cho create + detail thay vì page riêng. |
| CreateSupplierOrderDialog | Form: variant picker, qty, expected date, supplier, note. |
| SupplierOrderDetailDialog | Detail view + status transitions (ordered → received → cancelled). |

**Differences vs /purchases**:
- Supplier orders tự động tạo từ order pre-order items (xem US-ORD-B005).
- Manual restocking orders (TC-SUP-ORDER-019).
- Dialog-based instead of full pages.
- Status: pending/ordered/partial/received/cancelled (similar to PO).

---

## (I) Interaction Test Cases

### US-SO-I001 — Filter by status (TC-SUP-ORDER-007)

Dropdown SUPPLIER_ORDER_STATUS_ALL options.

### US-SO-I002 — Search SKU/product name (TC-SUP-ORDER-010, 027)

ILIKE + special character handling.

### US-SO-I003 — CreateSupplierOrderDialog flow

**Acceptance Criteria**:
- AC1 (Open**): Click button → dialog mở.
- AC2 (Supplier select required**) (TC-SUP-ORDER-011).
- AC3 (Expected date picker**) (TC-SUP-ORDER-012, 024 past date).
- AC4 (Variant picker**): Search SKU/name.
- AC5 (Submit**): Create row, close dialog, invalidate list.

### US-SO-I004 — SupplierOrderDetailDialog action buttons

Status transitions (ordered/received/cancelled) via buttons. Verify TC-SUP-ORDER-003..005.

### US-SO-I005 — Pagination (TC-SUP-ORDER-014)

Existing TC false positive — need real assertion that page 2 shows next 25 rows.

### US-SO-I006 — Error toast on failed ops (TC-SUP-ORDER-020)

Existing false positive — toast must show error message, not conditional skip.

### US-SO-I007 — Loading states (TC-SUP-ORDER-018)

Skeleton rows during query.

---

## (B) Business Test Cases

### US-SO-B001 — Create (TC-SUP-ORDER-001)

Validation: items required, qty > 0.

### US-SO-B002 — Receive updates stock (TC-SUP-ORDER-002, 008, 014, 021)

**Acceptance Criteria**:
- AC1 (Mark received**): Stock onHand += qty, log movement.
- AC2 (Atomic transaction**).
- AC3 (Pre-order item triggers shipping gate**): TC-ORD-013, US-ORD-B005.

### US-SO-B003 — Status transition rules (TC-SUP-ORDER-003..005)

**Acceptance Criteria**:
- AC1 (Valid: pending → ordered → received**).
- AC2 (Invalid from final**): Block status change from received/cancelled (TC-SUP-ORDER-005). Current false positive (toBe(500)) → must be business 400/409.

### US-SO-B004 — Delete restrictions (TC-SUP-ORDER-006)

Cannot delete if status not in {pending, cancelled}. Currently false positive — must be 400.

### US-SO-B005 — Field persist (TC-SUP-ORDER-009, 016)

After update, fields persist correctly.

### US-SO-B006 — Reject invalid variantId (TC-SUP-ORDER-021)

400 with clear error.

### US-SO-B007 — Quantity validation (TC-SUP-ORDER-022)

qty > 0 enforced. Very large qty handled (TC-SUP-ORDER-026).

### US-SO-B008 — XSS in note (TC-SUP-ORDER-023)

Sanitize at render (existing TC tests API storage only — need UI render test).

### US-SO-B009 — Timestamps only on first transition (TC-SUP-ORDER-025)

orderedAt set once when first transition to ordered; not on subsequent.

### US-SO-B010 — Concurrency safe (TC-SUP-ORDER-028)

Rapid status changes → final state consistent.

### US-SO-B011 — Cancel order with pre-orders removes supplier orders (TC-ORD-020)

Cross-ref orders module — existing false positive.

### US-SO-B012 — RBAC (TC-SUP-ORDER-016)

Block unauthorized API access.

---

## Linked TC-IDs

TC-SUP-ORDER-001..028. Many false positives needing fix (TEST-STATUS.md).

## Notes

- **Deprecation candidate**: Sidebar không có `/supplier-orders` nữa. Có thể module này đã được thay thế bởi `/purchases` + `/receipts`. Cần xác nhận:
  - Nếu deprecated → archive specs, redirect TC-SUP-ORDER-* sang TC-PURCH-* + TC-RECEIPT-*.
  - Nếu vẫn dùng (e.g. cho pre-order flow) → giữ và document role distinction.
- TC-SUP-ORDER-019 (manual restocking): nếu vẫn cần, nên tích hợp vào /purchases workflow.
- Dialog-based UX vs page-based: dialog limit complex forms.
