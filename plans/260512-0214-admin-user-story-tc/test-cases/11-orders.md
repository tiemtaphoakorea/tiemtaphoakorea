# Module: Orders — Đơn hàng (`/orders`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/orders/_content.tsx`, `[id]/`, `new/`
> Existing TC: TC-ORD-001..028 trong `docs/035-QA/QA-MOC.md` (many `needs-fix` / `draft`)
> Constants: `FULFILLMENT_STATUS` (pending/stock_out/completed/cancelled), `PAYMENT_STATUS` (unpaid/partial/paid)

## Screen Inventory

| Screen | Route | Notes |
|--------|-------|-------|
| List | `/orders` | Tabs: Tất cả / Chờ xử lý / Đã xuất kho / Hoàn thành / Đã huỷ. Search debounce. Page size. Columns: Mã / Ngày / KH / Thanh toán / Trạng thái / Tổng. |
| Create | `/orders/new` | Variant picker + customer picker + payment recording + supplier-order creation cho pre-order. (Source ~700+ lines — walk pending.) |
| Detail | `/orders/[id]` | Items + payments + supplier orders + status timeline + actions (mark paid, cancel, refund, edit notes). |

**Status combinations** (from existing TCs):
- Payment: `unpaid / partial / paid` derived từ paidAmount vs total.
- Fulfillment: `pending → stock_out → completed`, hoặc `→ cancelled`.

---

## (I) Interaction Test Cases

### US-ORD-I001 — List filter by fulfillment status tab

**Acceptance Criteria**:
- AC1 (Filter active row visual**): Tab `Chờ xử lý` highlight; URL/state filter='pending'.
- AC2 (Search retains tab**): Gõ search → giữ tab.
- AC3 (Empty state per tab**): Tab "Hoàn thành" 0 results → "Không có đơn hàng".
- AC4 (Page reset on tab change**): Page → 1.
- AC5 (No URL persistence**): Verify — likely chỉ component state, không write URL.

### US-ORD-I002 — Search across orderNumber/customer name/phone

**Acceptance Criteria**:
- AC1 (Match orderNumber**): "ORD-20260511" → match.
- AC2 (Match customer name**): query → join profiles ilike fullName.
- AC3 (Match phone**): "0901" → match.
- AC4 (Debounce 300ms**).

### US-ORD-I003 — Row click navigate detail

**Acceptance Criteria**:
- AC1 (Click navigate**): `/orders/{id}`.
- AC2 (Cursor pointer hint**).
- AC3 (Keyboard accessible**).

### US-ORD-I004 — Payment + Fulfillment dual-badge per row

**Acceptance Criteria**:
- AC1 (Payment badge color**): unpaid=red, partial=amber, paid=green.
- AC2 (Fulfillment badge color**): pending=gray, stock_out=blue, completed=green, cancelled=red.
- AC3 (Side-by-side**): 2 cột riêng "Thanh toán" + "Trạng thái".
- AC4 (Tooltip detail**): Hover show full status (could be added).

### US-ORD-I005 — Order detail: payment recording dialog

**Acceptance Criteria** (assumption):
- AC1 (Open from detail**): Click "Thanh toán" button → dialog.
- AC2 (Pre-fill remaining**): amount = total - paid.
- AC3 (Method picker**): cash/bank/card.
- AC4 (Submit**): Create payment row, invalidate detail query.

### US-ORD-I006 — Cancel order with confirmation

**Acceptance Criteria**:
- AC1 (Confirm dialog**): "Hoàn tác không thể undo".
- AC2 (Reason field**): Optional text reason.
- AC3 (Status flip**): Status → cancelled, stock restore (if was stock_out).
- AC4 (Reject if shipped already**): Verify business rule.

### US-ORD-I007 — Edit order: only specific fields allowed

**Acceptance Criteria**:
- AC1 (Admin note editable**): Always.
- AC2 (Items quantity blocked**): Once created (TC-ORD-018).
- AC3 (Customer fixable?**): Verify — likely no.

---

## (B) Business Test Cases

### US-ORD-B001 — Payment status derived from paidAmount vs total

**Acceptance Criteria** (existing TC-ORD-006, TC-ORD-024):
- AC1 (paid=0): paymentStatus='unpaid'.
- AC2 (0<paid<total): 'partial'.
- AC3 (paid≥total): 'paid'.
- AC4 (Auto-update on payment insert**): `recomputeOrderPaymentStatus` (similar pattern to receipts).
- AC5 (Float tolerance**): paid=total-0.001 → still partial or paid? Verify.

### US-ORD-B002 — Stock decrement on stock_out transition

**Acceptance Criteria**:
- AC1 (Pending→stock_out**): For each item, variant.onHand -= qty, movement type='stock_out' logged.
- AC2 (Insufficient stock**): Block transition with 409.
- AC3 (Concurrent transitions**): FOR UPDATE locks.

### US-ORD-B003 — Cancel order restore stock

**Acceptance Criteria** (existing TC-ORD-005, TC-ORD-022):
- AC1 (Cancel from stock_out**): Restore onHand += qty, log cancellation movement.
- AC2 (Cancel from pending**): No stock change.
- AC3 (Cancel after completed**): Verify — likely blocked.
- AC4 (Payments retained**): Cancel keeps payment history (TC-ORD-022).

### US-ORD-B004 — Order code unique + format

**Acceptance Criteria** (existing TC-ORD-011):
- AC1 (Format**): `ORD-YYYYMMDD-XXXXXX`.
- AC2 (Unique**): Server enforced.
- AC3 (Concurrency**): nextDocumentCode locks.

### US-ORD-B005 — Pre-order items create supplier orders

**Acceptance Criteria** (existing TC-ORD-008, TC-ORD-013):
- AC1 (Pre-order trigger**): Item with `stockType='pre_order'` → auto-create supplier order rows.
- AC2 (Gate preparing/shipping**): Cannot ship until supplier orders received.
- AC3 (Cancel order removes supplier orders**): TC-ORD-020.

### US-ORD-B006 — Idempotent create order (Idempotency-Key)

**Acceptance Criteria** (existing TC-INT-010, TC-INT-016):
- AC1 (Same key, same body**): Return same order, no duplicate.
- AC2 (Same key, different body**): Reject 409 with original.
- AC3 (Window**): Verify TTL (e.g., 24h).

### US-ORD-B007 — Reject zero-item order

**Acceptance Criteria** (existing TC-ORD-026): Server reject items=[].

### US-ORD-B008 — Order total recalculation invariant

**Acceptance Criteria** (existing TC-ORD-025):
- AC1 (Sum from items**): total = sum(lineTotal) - orderDiscount + shipping.
- AC2 (Stored vs computed**): UI displays stored, but server can recompute on update.
- AC3 (Edit price field**): Use snapshot unitPrice from order_items, không live variant price.

---

## Linked TC-IDs (existing docs)

Tham chiếu trực tiếp TC-ORD-001..028. Hầu hết `needs-fix` — chi tiết ở `docs/035-QA/TEST-STATUS.md`.

**Key gaps existing TCs miss**:
- US-ORD-I001..I007 (Interaction tests are weak in existing specs)
- TC-ORD-007 (List filter) false positive — replaced by US-ORD-I001
- TC-ORD-027 (Variant Format Display) dead assertion → re-implement
- TC-ORD-028 (Full lifecycle E2E) missing → recommend writing new spec

## Notes / Edge cases unresolved

- **Detail/Create pages not deeply walked**: 700+ lines each.
- **Status timeline UI**: Verify if there's a visual timeline showing transitions.
- **Refund flow**: Not yet defined — currently cancel keeps payments. True refund?
- **Partial fulfillment**: Order has 3 items, ship only 2 → split? Or wait?
- **Auto-create customer from order**: TC-ORD-? exists, cross-ref customer module.
- **Payment edit**: After creating payment, can edit/delete? Verify.
- **Print invoice**: `print-invoice` lib referenced ở settings — verify integration với order detail.
