# Module: Payouts — Phiếu chi NCC (`/payouts`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/payouts/_content.tsx` (read-only list, no detail/new screens — payouts được tạo từ Receipt detail).
> Source service: `packages/database/src/services/supplier-payment.server.ts`
> Schema: `packages/database/src/schema/receipts.ts` → `supplierPayments`.
> Constants: `PAYMENT_METHOD`, `DOC_PREFIX.SUPPLIER_PAYMENT`.

## Screen Inventory

| Screen | Route | Notes |
|--------|-------|-------|
| List | `/payouts` | Read-only. Filter: search (client-side, code/supplier/receiptCode), supplier select, method select. "Xoá bộ lọc" button. 2 KPI cards: Tổng đã chi + Số phiếu chi. Columns: Mã PCH / NCC / Phiếu nhập / Số tiền / Phương thức / Ngày TT / Người tạo. Page size 10/25/50/100. |

**Method tones**: CASH=green, BANK_TRANSFER=blue, CARD=indigo.
**Empty state**: "Chưa có phiếu chi nào".
**KPI Card 1**: "Tổng đã chi" = `metadata.totalAmount` từ server aggregate (cumulative SUM của amount theo filter).
**KPI Card 2**: "Số phiếu chi" = `total` records.

**Tạo payout**: KHÔNG có nút "Tạo" trên /payouts (chỉ list). Phải vào Receipt detail → click "Thanh toán" → PaymentDialog.
**Xoá payout**: KHÔNG có UI trên /payouts. Phải vào Receipt detail → Trash icon (xem 03-receipts.md US-RECEIPT-I008).

---

## (I) Interaction Test Cases

### US-PAYOUT-I001 — Search client-side (debounce 300ms)

**As** an admin user
**I want to** filter visible page nhanh khi gõ search
**So that** không reload server cho việc nhỏ

**Acceptance Criteria** (`_content.tsx:129-136`):
- AC1 (Match): query="PCH-001" / Then list filter `p.code.includes("pch-001")` (case-insensitive), supplier name, receipt code đều check.
- AC2 (Empty): query rỗng / Then list = full page (allPayouts).
- AC3 (Only page-visible): Search KHÔNG fetch lại từ server → chỉ filter trong page hiện tại. **Quirk**: Nếu match nằm ở page 2, user phải chuyển page rồi search.
- AC4 (No total update on client filter): KPI cards KHÔNG cập nhật theo search filter (vì search là client-only, totalAmount đến từ server filter chỉ tính supplier+method).
- AC5 (Debounced): Gõ liên tục < 300ms → list không re-filter ngay; sau 300ms ngừng gõ → filter chạy.

### US-PAYOUT-I002 — Filter supplier + method update KPI tổng

**Acceptance Criteria**:
- AC1 (Both All): supplier=All, method=All / Then totalAmount = sum của tất cả payouts trong DB.
- AC2 (Supplier set): supplier=X / Then totalAmount = SUM payouts where supplierId=X. KPI card mô tả tên NCC ("X" thay cho "Tất cả nhà cung cấp").
- AC3 (Method set): method=cash / Then payouts filter `method='cash'`. KPI count chỉ cash.
- AC4 (Both set): combine → AND condition.
- AC5 (Page reset): Khi filter change → page=1.

### US-PAYOUT-I003 — "Xoá bộ lọc" button reset tất cả

**Acceptance Criteria**:
- AC1 (Click reset): When click "Xoá bộ lọc" / Then supplierFilter="All", methodFilter="All", query="" — verify 3 controls về default.
- AC2 (Refetch on reset): Query refetch với filter rỗng → list trở về full page 1.
- AC3 (Idempotent): Click khi đã reset → no-op visible (mutation không gọi vì state không đổi).

### US-PAYOUT-I004 — Loading state vs empty state phân biệt

**Acceptance Criteria**:
- AC1 (Loading): `payoutsQuery.isLoading=true` / Then table body show `TableLoadingRows cols=7 rows=5` (skeleton 5 dòng).
- AC2 (Error): `payoutsQuery.error` / Then `TableErrorRow` với message của error.
- AC3 (Empty): isLoading=false, list.length=0 / Then "Chưa có phiếu chi nào" centered trong table body.
- AC4 (KPI loading): While loading, totalAmount card hiện "Đang tải..." thay cho money; số phiếu card cũng "Đang tải..." khi total=0.
- AC5 (No flicker): Switch filter → giữ previous data qua `placeholderData: keepPreviousData` → table không trống trong 200ms loading.

### US-PAYOUT-I005 — Method pill color theo PaymentMethod

**Acceptance Criteria**:
- AC1 (Cash): method='cash' / Then TonePill tone='green', text "Tiền mặt".
- AC2 (Bank): method='bank_transfer' / Then tone='blue', text "Chuyển khoản".
- AC3 (Card): method='card' / Then tone='indigo', text "Thẻ".
- AC4 (Unknown): method='wallet' (hypothetical) / Then tone='gray' fallback, text = raw value.

### US-PAYOUT-I006 — Receipt code clickable? (current: not, just text)

**Acceptance Criteria**:
- AC1 (Display): Cột "Phiếu nhập" hiện `receiptCode` font-mono, muted color.
- AC2 (Null): receiptId=null (payout không link receipt) / Then "—".
- AC3 (Not clickable currently): No anchor wrapping → no navigation. **Recommendation**: Nên link `/receipts/{receiptId}` để UX tốt hơn (note ở GAP-REPORT).

### US-PAYOUT-I007 — Pagination giữ filter state

**Acceptance Criteria**:
- AC1: Set filter supplier=X, method=cash, page=1 / Click Next → page=2 với cùng filter.
- AC2 (Out of range): totalPages=3, current page=3, click Next → button disabled (PaginationControls).
- AC3 (Page size change reset): Change pageSize → page về 1.

---

## (B) Business Test Cases

### US-PAYOUT-B001 — Create payout amount > 0 (server validation)

**Acceptance Criteria** (`supplier-payment.server.ts:88`):
- AC1 (Zero): amount=0 → throw "Số tiền thanh toán phải lớn hơn 0".
- AC2 (Negative): amount="-100" → throw same.
- AC3 (Positive): amount=100 → proceed.
- AC4 (NaN): amount="abc" → Number("abc")=NaN → !(>0) → throw.

### US-PAYOUT-B002 — Allocated payout: supplier must match receipt's supplier

**Acceptance Criteria** (`supplier-payment.server.ts:106-108`):
- AC1 (Match): Receipt.supplierId=Y, payout.supplierId=Y → success.
- AC2 (Mismatch): Receipt.supplierId=Y, payout.supplierId=Z → throw "NCC của phiếu chi không khớp NCC của phiếu nhập".
- AC3 (Receipt no supplier): Receipt.supplierId=null, payout.supplierId=Y → success, backfill onto receipt (xem B003).

### US-PAYOUT-B003 — Backfill receipt.supplierId khi receipt chưa có

**Acceptance Criteria** (`supplier-payment.server.ts:109-115`, regression `35c42bc`):
- AC1 (Backfill): Receipt.supplierId=null, payout.supplierId=Y / After payment → receipt.supplierId=Y.
- AC2 (No overwrite): Receipt.supplierId=Y, payout.supplierId=Y / After payment → KHÔNG re-UPDATE (chỉ update khi receipt.supplierId is null).
- AC3 (Atomic): Backfill nằm trong cùng transaction với INSERT payment → all-or-nothing.

### US-PAYOUT-B004 — Outstanding debt check ngăn overpay

**Acceptance Criteria** (`supplier-payment.server.ts:116-121`):
- AC1 (Within debt): receipt.payable=500, receipt.paid=200, outstanding=300 / amount=300 → success.
- AC2 (Over debt + tolerance): amount=300.01 → success (tolerance 0.01).
- AC3 (Exceed): amount=400 → throw `Số tiền vượt quá công nợ còn lại của phiếu nhập (còn 300)`.
- AC4 (Float tolerance edge): payable=100, paid=99.99, outstanding=0.01 / amount=0.02 → throw (`0.02 > 0.01 + 0.01 = 0.02` is false, so success? Test edge).
- AC5 (Unallocated payout — no receiptId): Skip outstanding check entirely (just supplier debt).

### US-PAYOUT-B005 — recomputeReceiptPaymentStatus after create

**Acceptance Criteria** (`supplier-payment.server.ts:143-145`):
- AC1 (After create with receiptId): `recomputeReceiptPaymentStatus(tx, receiptId)` được gọi → receipt's paidAmount/debtAmount/paymentStatus update đúng.
- AC2 (After create without receiptId): KHÔNG gọi recompute (unallocated payout không thuộc receipt nào).
- AC3 (After delete): Same recompute called → receipt revert (paid giảm).

### US-PAYOUT-B006 — Document code unique format

**Acceptance Criteria**:
- AC1 (Format): code match `DOC_PREFIX.SUPPLIER_PAYMENT` pattern (e.g. `PCH-YYYYMMDD-XXX`).
- AC2 (Uniqueness): 2 payouts liên tiếp → codes khác.
- AC3 (Concurrency): nextDocumentCode dùng `FOR UPDATE` sequence — verify race condition không gen duplicate.

### US-PAYOUT-B007 — Delete payout reverses receipt status

**Acceptance Criteria** (`supplier-payment.server.ts:151-167`):
- AC1 (Soft state revert): Receipt paid=300 (1 payment 300, payable=500, status='partial') / Delete payment → recompute → paid=0, debt=500, status='unpaid'.
- AC2 (Multi-payments): Receipt có 3 payments, delete 1 → recompute với 2 còn lại.
- AC3 (No receipt link): payment có receiptId=null / delete → just delete row, không recompute.
- AC4 (Idempotent missing): Delete already-deleted id → throw "Không tìm thấy phiếu chi".

### US-PAYOUT-B008 — Aggregate getSupplierDebtsAggregate filter COMPLETED + debt>0

**Acceptance Criteria** (`supplier-payment.server.ts:172`):
- AC1 (Filter scope): Chỉ tính receipts với `status='completed' AND debt > 0`.
- AC2 (Excluded states): DRAFT receipts (debt > 0) KHÔNG hiện trong supplier debts → cố ý vì DRAFT có thể chưa "công nhận" công nợ.
- AC3 (Group by supplier): Output 1 row mỗi supplier (joined ngoài).
- AC4 (Sort desc by debt): Largest debt first.
- AC5 (Null supplier): receipt.supplierId=null + completed + debt>0 → 1 row với supplierId=null, supplierName=null (orphan group). **Edge case cần verify business decision**.

### US-PAYOUT-B009 — TotalAmount KPI exact sum

**Acceptance Criteria** (`supplier-payment.server.ts:58-64`):
- AC1 (Sum all): 3 payouts 100/200/300, no filter → totalAmount=600.
- AC2 (Filter narrows sum): filter supplier=X → totalAmount = sum chỉ payouts of X.
- AC3 (Filter method): filter method=cash → totalAmount = sum chỉ cash.
- AC4 (Empty): No matches → totalAmount=0 (COALESCE default).

### US-PAYOUT-B010 — RBAC: Create/Delete payout chỉ Owner+Manager

**Acceptance Criteria**:
- AC1 (Staff list): Staff có thể VIEW /payouts (read access).
- AC2 (Staff create): Staff gọi POST /api/admin/payouts → 403.
- AC3 (Staff delete): Staff gọi DELETE → 403.
- AC4 (Manager): full access except admin-only actions (none in payout).
- AC5 (Owner): full access.

### US-PAYOUT-B011 — Method enum validation

**Acceptance Criteria**:
- AC1 (Valid): method ∈ {'cash', 'bank_transfer', 'card'} → success.
- AC2 (Invalid): method='paypal' → reject by Zod schema in API layer.
- AC3 (DB constraint): DB column likely enum/varchar — nếu insert qua raw SQL với invalid → DB throw.

### US-PAYOUT-B012 — referenceCode chỉ meaningful cho bank_transfer

**Acceptance Criteria**:
- AC1 (Bank with ref): method='bank_transfer', referenceCode='TX123' → stored as-is.
- AC2 (Cash with ref): UI dialog không show field — nhưng nếu API trực tiếp với ref + cash → service accept (no validation). Có thể là lax behavior.
- AC3 (Bank without ref): method='bank_transfer', referenceCode=null → stored null (no required). **Recommendation**: Nên require cho bank_transfer (audit trail).

---

## Linked TC-IDs (existing docs)

- Không có TC-PAYOUT-* trong `docs/035-QA/QA-MOC.md`.
- Conceptual overlap với TC-PAY-* (nhưng TC-PAY-* là customer payments, không phải supplier payments):
  - TC-PAY-001 (Partial Payment Recording) ≈ US-PAYOUT-B005 + nhưng cho customer side.
  - TC-PAY-005 (Overpayment Not Allowed) ≈ US-PAYOUT-B004.
  - TC-PAY-010 (Duplicate Payment Submission) → Có thể adapt US-PAYOUT-B-XXX nếu cần idempotency cho payout.

## Notes / Edge cases unresolved

- **Receipt code không phải link**: UX issue nhỏ (xem US-PAYOUT-I006).
- **Search server-side?**: Current client-side search chỉ trong page hiện tại — user có thể bị nhầm là không có match. **Recommendation**: Move to server.
- **Idempotency cho create payout**: Service không expose Idempotency-Key support — user double-submit có thể tạo 2 payouts. UI dùng `disabled={isPending}` để gate, nhưng API gọi trực tiếp dễ duplicate.
- **Orphan payouts (no receiptId)**: Có flow này không? Code support (receiptId optional) nhưng UI hiện chỉ tạo via receipt detail. Có thể có advance/credit payment trong tương lai?
- **`receiptId` null + recompute**: Hiện không recompute nếu không có receiptId — đúng logic.
- **DELETE payout từ /payouts page**: Hiện không có UI ở /payouts (chỉ ở receipt detail). Cân nhắc thêm action menu ở /payouts list cho ops convenience.
- **Audit log delete**: Delete supplier payment hiện không log ai xoá khi nào. Có thể cần `deleted_at`, `deleted_by` soft-delete column.
