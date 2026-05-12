# Module: Receipts — Nhập hàng (`/receipts`)

> Walk-through 2026-05-12 trên `localhost:3001`.
> Source UI: `apps/admin/app/(dashboard)/receipts/` (+ `_payment-dialog.tsx`)
> Source service: `packages/database/src/services/goods-receipt.server.ts`
> Schema: `packages/database/src/schema/receipts.ts` (goodsReceipts, goodsReceiptItems, supplierPayments)
> Constants: `RECEIPT_STATUS`, `PAYMENT_STATUS`, `PAYMENT_METHOD`, `DOC_PREFIX.GOODS_RECEIPT`

## Screen Inventory

| Screen | Route | Notes |
|--------|-------|-------|
| List | `/receipts` | Tabs: Tất cả / Đang giao dịch (DRAFT) / Hoàn thành (COMPLETED). Search (code/note/supplier). 2 filter: supplier + paymentStatus. Page size 10/25/50/100. Columns: Mã / NCC / Cần trả / Đã trả / Còn nợ / Thanh toán / Trạng thái / Ngày nhận. |
| Create | `/receipts/new` | Optional prefill từ `?purchaseOrderId=<id>`. Form: supplier, invoiceDate, invoiceRef, items (qty/cost/discount/note), extraCost, headerDiscount, note. |
| Detail | `/receipts/[id]` | Header: code + StatusPill + PaymentStatusPill. Action: Huỷ phiếu (only DRAFT + paid=0) + Hoàn tất (only DRAFT + debt=0). Info card (NCC/Ngày HĐ/Mã HĐ/Người tạo). Items table. Payment summary (3 KPI cards: payable / paid / debt) + Thanh toán button. Payouts table với Trash icon (delete payout, only DRAFT). |
| Modal | Payment dialog | Number amount (max=debtAmount), method buttons (cash/bank_transfer/card), referenceCode (chỉ khi bank_transfer), paidAt date, note. Optional supplier select nếu receipt chưa link NCC. |
| Confirm | AlertDialog | 3 nội dung: "Hoàn tất phiếu nhập" / "Huỷ phiếu nhập" / "Xoá phiếu chi". |

**Statuses**: `DRAFT` (amber, "Đang giao dịch"), `COMPLETED` (green, "Hoàn thành"), `CANCELLED` (red).
**Payment statuses**: `UNPAID` (red, "Chưa thanh toán"), `PARTIAL` (amber, "Thanh toán một phần"), `PAID` (green, "Đã thanh toán").

**State machine** (từ service):
```
DRAFT --(complete: debt=0)--> COMPLETED
DRAFT --(cancel: paid=0)--> CANCELLED  (no stock effect, just status)
COMPLETED --(cancel: paid=0)--> CANCELLED  (reverse stock, reverse PO recv qty)
CANCELLED --(any)--> blocked (idempotent return)
DRAFT (debt>0) --(complete)--> ❌ "Cần thanh toán đủ trước khi hoàn tất"
DRAFT (paid>0) --(cancel)--> ❌ "Không thể huỷ phiếu đã có thanh toán — vui lòng huỷ phiếu chi trước"
```

**RBAC**: `canManage = role in {OWNER, MANAGER}` (gates Hoàn tất / Huỷ / Thanh toán / Xoá payout).

---

## (I) Interaction Test Cases

### US-RECEIPT-I001 — Filter tab + supplier + paymentStatus đồng thời

**As** an admin user
**I want to** combine 3 filter (status tab, supplier, paymentStatus) trong cùng URL state
**So that** zoom narrow vào nợ NCC X chưa hoàn tất

**Acceptance Criteria**
- AC1 (Triple filter): When chọn tab=`Đang giao dịch` + supplier=`X` + paymentStatus=`Chưa thanh toán` / Then table chỉ hiện receipts thoả 3 điều kiện.
- AC2 (Page reset on filter): Mỗi filter change → page reset về 1.
- AC3 (Clear ordering): Filter change KHÔNG ảnh hưởng sort (vẫn `ORDER BY created_at DESC` từ server).
- AC4 (Empty combo): Filter combo cho 0 result → "Chưa có phiếu nhập hàng" trong table body, count "0 phiếu" KHÔNG hiển thị (chỉ hiển thị khi `total > 0`).
- AC5 (Filter persist while paginating): Pagination giữ filter state.

### US-RECEIPT-I002 — Money cells colored theo loại

**As** an admin user
**I want to** đọc nhanh status payment qua màu cột
**So that** scan list dễ

**Acceptance Criteria**
- AC1 (Đã trả): cột "Đã trả" text color = `text-emerald-700` (green).
- AC2 (Còn nợ): cột "Còn nợ" = `text-red-600` (red).
- AC3 (Cần trả): cột "Cần trả" = default foreground (no semantic color).
- AC4 (Format): All money columns use `formatMoney()` → "1,234,567đ" với dấu phẩy + ký tự "đ". Null/empty → "—".
- AC5 (Tabular numerals): `font-family` has `tabular-nums` để số thẳng cột.

### US-RECEIPT-I003 — Payment dialog auto-fill amount = debtAmount, max bounded

**As** an admin user
**I want to** dialog pre-fill số tiền = full remaining debt và chặn nhập quá max
**So that** thanh toán full thường xuyên chỉ cần 1 click

**Acceptance Criteria** (`_payment-dialog.tsx:39, 149`):
- AC1 (Auto-fill): Open dialog với `maxAmount=500000` / Then field "Số tiền" pre-filled `500000`.
- AC2 (Max enforced — UI): NumberInput có `max={maxAmount}` → user gõ `999999999` bị clamp xuống `maxAmount` (theo prior bug fix in commit `5e6e153`).
- AC3 (Min 1): NumberInput `min=1` → submit với amount=0 throws "Số tiền phải lớn hơn 0" (validate client mutationFn:60).
- AC4 (No autofocus when supplier needed): Khi receipt chưa link supplier (`needsSupplier=true`) / Then amount field KHÔNG autofocus (cho phép user chọn NCC trước).
- AC5 (Reset on close): Close dialog → state reset (amount=maxAmount, method=cash, referenceCode="", paidAt=today, note="", supplier=original).

### US-RECEIPT-I004 — Payment method buttons (segmented control) + conditional reference

**As** an admin user
**I want to** chọn method qua button group, ref code chỉ hiện cho bank transfer
**So that** UI gọn cho cash/card

**Acceptance Criteria**
- AC1 (Default cash): Mở dialog → button "Tiền mặt" `variant=secondary` (active), 2 buttons khác `variant=ghost`.
- AC2 (Switch): Click "Chuyển khoản" / Then nó active, field "Mã tham chiếu" hiện ngay phía dưới.
- AC3 (Switch back): Click "Tiền mặt" / Then field "Mã tham chiếu" biến mất; nếu user đã gõ value, value vẫn giữ trong state (no force-clear), nhưng KHÔNG gửi lên server vì field disabled.
- AC4 (Card): Click "Thẻ" → active, KHÔNG có ref code field (chỉ bank_transfer mới có).
- AC5 (Submit method): Submit gửi đúng `method` value enum.

### US-RECEIPT-I005 — Hoàn tất button disabled khi debt > 0

**As** an admin user
**I want to** rõ ràng không thể complete khi còn nợ
**So that** không bị server reject sau mới biết

**Acceptance Criteria**
- AC1 (Disabled state): Given DRAFT + debt > 0 / Then button "Hoàn tất" có `disabled=true` và `title="Cần thanh toán đủ trước khi hoàn tất"`.
- AC2 (Enabled when paid): Sau khi thanh toán đủ → debt=0 → button hết disabled (verify refetch query invalidate).
- AC3 (Hidden when not DRAFT): Status COMPLETED/CANCELLED → button không hiện.
- AC4 (Pending state): Mid-mutation → button text "Đang xử lý...".

### US-RECEIPT-I006 — Cancel button visibility theo state machine

**As** an admin user
**I want to** chỉ thấy nút Huỷ khi có thể huỷ
**So that** không click vô tác dụng

**Acceptance Criteria** (`canCancel = !isCancelled && paidAmount === 0` AND chỉ render khi `canManage && isDraft`):
- AC1 (DRAFT + paid=0): Hiện button "Huỷ phiếu" (variant destructive).
- AC2 (DRAFT + paid>0): KHÔNG hiện (đã có payout — phải xoá payout trước).
- AC3 (COMPLETED): KHÔNG hiện (block bởi `isDraft` check ở UI). **Note**: service support cancel from COMPLETED nhưng UI ẩn — verify business decision.
- AC4 (CANCELLED): KHÔNG hiện.
- AC5 (Staff role): KHÔNG hiện ngay cả khi DRAFT + paid=0.

### US-RECEIPT-I007 — Confirm dialog phân loại theo action

**As** an admin user
**I want to** confirm dialog title/description khớp với action sắp thực hiện
**So that** không nhầm complete với cancel

**Acceptance Criteria**
- AC1 (Complete): Title "Hoàn tất phiếu nhập", description "Tồn kho sẽ được cập nhật sau khi hoàn tất. Không thể hoàn tác."
- AC2 (Cancel): Title "Huỷ phiếu nhập", description "Bạn có chắc muốn huỷ phiếu nhập này?"
- AC3 (Delete payout): Title "Xoá phiếu chi", description "Bạn có chắc muốn xoá phiếu chi này?"
- AC4 (Cancel keep state): Click "Huỷ" trong dialog → state `confirmState=null`, mutation không chạy.
- AC5 (Confirm fires correct mutation): "Xác nhận" → dispatch đúng `completeMutation` / `cancelMutation` / `deletePayoutMutation(payoutId)`.

### US-RECEIPT-I008 — Delete payout button chỉ hiện cho payment row khi DRAFT + canManage

**As** an admin user
**I want to** xoá nhanh payout sai trong khi receipt còn DRAFT
**So that** không cần undo/làm lại từ đầu

**Acceptance Criteria**
- AC1 (Visible): Status DRAFT + canManage / Then mỗi payout row có Trash icon button ở cột cuối.
- AC2 (Hidden COMPLETED): Status COMPLETED → button không hiện.
- AC3 (Hidden Staff): role=staff → button không hiện.
- AC4 (Disabled during pending): `isPending=true` → button `disabled`.
- AC5 (After delete invalidate): On success → invalidate `receipts.detail(id)` + `payouts.all` + `payouts.list({receiptId})` → 3 KPI cards (paid/debt) update tự động.

### US-RECEIPT-I009 — Prefill từ PurchaseOrder qua query param

**As** an admin user
**I want to** click "Tạo phiếu nhập" từ PO detail → form mới pre-fill items, supplier, ref
**So that** không phải nhập lại

**Acceptance Criteria** (xem `purchase-prefill.ts`):
- AC1 (Items prefill): Open `/receipts/new?purchaseOrderId=X` / Then items list = PO items với `quantity` = (orderedQty − receivedQty), unitCost từ PO.
- AC2 (Supplier prefill): supplier field = PO.supplierId, disabled hoặc readonly (verify business rule).
- AC3 (PO link stored): On submit → request body có `purchaseOrderId=X`, mỗi item có `purchaseOrderItemId`.
- AC4 (No PO param): Mở `/receipts/new` không query → form trống, supplier select free.
- AC5 (Invalid PO id): `?purchaseOrderId=invalid-uuid` / Then không crash, fallback về form trống + toast warning.

### US-RECEIPT-I010 — 3 KPI cards (Cần trả / Đã trả / Còn phải trả) update real-time

**As** an admin user
**I want to** xem 3 số tổng quan thanh toán ngay trên detail page
**So that** không phải tính nhẩm

**Acceptance Criteria**
- AC1 (Initial state): Receipt mới tạo, paid=0 / Then "Cần trả"=payable, "Đã trả"=0đ, "Còn phải trả"=payable.
- AC2 (After payment): Sau khi xác nhận payment 200000đ trên receipt 500000đ / Then "Đã trả"=200,000đ, "Còn phải trả"=300,000đ. Verify query invalidate.
- AC3 (Color scheme): "Cần trả"=default border, "Đã trả"=emerald-100 border/bg, "Còn phải trả"=red-100 border/bg.
- AC4 (Format): Sử dụng `formatMoney()` → "500,000đ".
- AC5 (Empty payable): payable=null hoặc 0 / Then card hiển thị "—" (theo formatMoney null handling).

---

## (B) Business Test Cases

### US-RECEIPT-B001 — Complete receipt cộng stock + log inventory movement

**As** the system
**I want to** khi complete DRAFT receipt thì onHand mỗi variant +qty và 1 row inventoryMovement
**So that** stock luôn audit-trail được nguồn gốc

**Acceptance Criteria** (xem `completeGoodsReceipt:352-375`):
- AC1 (Stock increment): Variant X có onHand=10, receipt có item qty=5 → after complete, onHand=15.
- AC2 (Movement row): Có 1 row `inventory_movements` với `type='supplier_receipt'`, `quantity=5`, `onHandBefore=10`, `referenceId=receiptItem.id`, `createdBy=user`.
- AC3 (Atomic transaction): Nếu insert movement fail → rollback, onHand không thay đổi.
- AC4 (Multiple items): Receipt 3 items → 3 movements, 3 variant updates trong cùng tx.
- AC5 (FOR UPDATE lock): Concurrent complete trên cùng receipt → 1 succeed, 1 fail "Chỉ hoàn tất được phiếu ở trạng thái nháp (hiện: completed)".
- AC6 (Receipt receivedAt set): After complete → `receivedAt=now()`, `completedBy=user`, `updatedAt=now()`.

### US-RECEIPT-B002 — WAC (Weighted Average Cost) recompute on complete

**As** the system
**I want to** costPrice của variant cập nhật theo WAC formula sau mỗi receipt
**So that** profit report dùng cost chính xác

**Acceptance Criteria** (xem `applyWeightedAverageCost:70-126`):
- AC1 (Standard WAC): Variant onHand=10 cost=100, receipt qty=5 cost=200 → newCost = (100×10 + 200×5)/(10+5) = 2000/15 ≈ 133.33. costPrice update thành "133.33".
- AC2 (Zero stock fallback): Variant onHand=0 cost=100, receipt qty=5 cost=200 → newCost = 200 (incoming average), không weighted với 0 stock.
- AC3 (Negative on-hand fallback): onHand=-3 (anomaly), receipt qty=5 cost=200 → newCost=200 (fallback to incoming).
- AC4 (No change skip log): receipt cost = current cost → KHÔNG insert `cost_price_history` row.
- AC5 (Change log): cost changes → insert row với `variantId`, `costPrice=newCost`, `effectiveDate=receivedAt`, `note='WAC update from supplier receipt (prev cost: <oldCost>)'`, `createdBy=user`.
- AC6 (Per-variant aggregation): Receipt có 2 lines cùng variantId → byVariant map gộp qty và cost trước khi tính WAC.
- AC7 (Decimal precision): Format toMoney() = 2 decimals; rounding bias? (verify với cost=100, qty=3, incoming cost=99.99 qty=1).

### US-RECEIPT-B003 — Complete blocked khi debt > 0

**As** the server
**I want to** không cho complete khi vẫn còn nợ supplier
**So that** payment-status invariant đúng

**Acceptance Criteria**
- AC1 (Reject): Receipt debt=100000 / Call `completeGoodsReceipt(id)` → throw `Error("Cần thanh toán đủ trước khi hoàn tất phiếu nhập")`.
- AC2 (UI block): UI button "Hoàn tất" disabled (xem I005), nhưng server check tồn tại để defend khi gọi API trực tiếp.
- AC3 (After payment): Pay đủ → debt=0 / Then complete success.
- AC4 (Status not changed on reject): Failed complete → receipt vẫn DRAFT, không có stock change.

### US-RECEIPT-B004 — Cancel from COMPLETED reverses stock + PO

**As** the server
**I want to** huỷ COMPLETED receipt thì undo stock và PO progress
**So that** mistake recoverable

**Acceptance Criteria** (xem `cancelGoodsReceipt:415`):
- AC1 (Stock decrement): Receipt completed có item qty=5, variant onHand=15 → after cancel, onHand=10.
- AC2 (Cancellation movement): Insert `inventory_movements` row với `type='cancellation'`, `quantity=-5`, `note='Cancellation of receipt'`.
- AC3 (PO recv qty reverse): Linked PO item.receivedQty -= 5; PO status recomputed (PARTIAL → ORDERED nếu sau revert chưa nhận gì).
- AC4 (Greatest 0 guard): Nếu race condition khiến onHand hoặc PO.receivedQty âm → `GREATEST(... - qty, 0)` ngăn âm.
- AC5 (Receipt status): After → status=CANCELLED, cancelledAt=now(), updatedAt=now().

### US-RECEIPT-B005 — Cancel blocked khi paidAmount > 0

**As** the server
**I want to** từ chối huỷ receipt đã có payment để tránh orphan payments
**So that** dữ liệu finance không hỏng

**Acceptance Criteria**
- AC1 (Reject): paid > 0 / `cancelGoodsReceipt(id)` → throw `Error("Không thể huỷ phiếu đã có thanh toán — vui lòng huỷ phiếu chi trước")`.
- AC2 (Workflow): Xoá payout(s) trước → paid=0 → cancel success.
- AC3 (Already cancelled idempotent): status=CANCELLED → return row, không throw, không có side-effect.
- AC4 (Cancel from DRAFT no stock effect): DRAFT + paid=0 → cancel success nhưng KHÔNG reverse stock (vì DRAFT chưa stock-in).

### US-RECEIPT-B006 — recomputeReceiptPaymentStatus derive paymentStatus

**As** the server
**I want to** mỗi khi payout CRUD, paymentStatus của receipt sync ngay
**So that** field paymentStatus = computed truth

**Acceptance Criteria** (`goods-receipt.server.ts:490`):
- AC1 (Unpaid): sum(payments)=0 → paymentStatus='unpaid', debt=payable.
- AC2 (Partial): 0 < sum < payable → 'partial'.
- AC3 (Paid): sum >= payable → 'paid', debt=Math.max(payable-paid,0)=0.
- AC4 (Overpay): sum > payable (lý thuyết) → debt=0, paymentStatus='paid'. Note: overpay nên block ở API tạo payout chứ không nên xảy ra.
- AC5 (Delete payout decrement): Sau khi xoá payout → recompute lại với sum giảm; paymentStatus xuống partial/unpaid.
- AC6 (NULL safe): receipt với 0 payment rows → COALESCE → paid=0, status=unpaid.

### US-RECEIPT-B007 — Create receipt items rỗng bị reject

**As** the server
**I want to** đảm bảo receipt luôn có ≥1 item
**So that** không có phiếu nhập rỗng

**Acceptance Criteria**
- AC1 (Service): `createGoodsReceipt({ items: [] })` → throw `Error("Cần ít nhất 1 sản phẩm cho phiếu nhập")`.
- AC2 (API): POST /api/admin/receipts với body `items=[]` → 400.
- AC3 (Initial state): Created receipt → status=DRAFT, paidAmount="0", paymentStatus="unpaid", debtAmount=payableAmount.

### US-RECEIPT-B008 — Aggregate payableAmount = totalAmount − discount + extraCost

**As** the server
**I want to** tổng phải trả tính chuẩn từ items + extra + discount header
**So that** report finance khớp

**Acceptance Criteria** (`aggregate:45-63`):
- AC1 (No discount/extra): 2 items {qty:5, cost:100}, {qty:3, cost:200} → totalAmount=1100, discountAmount=0, extraCost=0, payable=1100.
- AC2 (Line discount): item discount=50 → counted vào discountAmount.
- AC3 (Header discount + line discount): lineDiscount=50, headerDiscount=100 → discountAmount=150, payable=totalAmount-150+extraCost.
- AC4 (Extra cost): extraCost=200 (ship) → payable +=200.
- AC5 (Decimal format): all money fields stored as decimal(2) via toMoney().
- AC6 (Negative payable): discount > total → payable âm? (verify clamp hoặc accept).

### US-RECEIPT-B009 — RBAC: Staff không complete/cancel/pay/delete payout

**Acceptance Criteria**
- AC1 (UI gate): Staff role → action buttons không render (canManage check ở `[id]/_content.tsx:87`).
- AC2 (API complete): Staff gọi `POST /api/admin/receipts/{id}/complete` → 403.
- AC3 (API cancel): tương tự → 403.
- AC4 (API create payout): Staff gọi `POST /api/admin/payouts` → 403.
- AC5 (API delete payout): tương tự → 403.
- AC6 (Manager): Manager đầy đủ quyền.

### US-RECEIPT-B010 — Backfill supplierId on payment khi receipt chưa có supplier

**As** the system
**I want to** khi tạo payout cho receipt-không-có-supplier, supplier được set lên cả receipt
**So that** debt/payout report khớp supplier (bug đã fix ở `35c42bc`)

**Acceptance Criteria** (regression test cho recent commit):
- AC1 (Backfill): Receipt có `supplierId=null` + payment dialog cho chọn supplier=Y / On submit → receipt.supplierId update thành Y (verify DB after).
- AC2 (Idempotent): Receipt đã có supplierId / Payment KHÔNG đụng đến field này.
- AC3 (Linked payout supplier): payout row có `supplierId=Y` để debt aggregation đúng.
- AC4 (Required when missing): UI force user chọn supplier trước khi submit (`needsSupplier && !selectedSupplierId` throws "Vui lòng chọn nhà cung cấp").

### US-RECEIPT-B011 — Inventory movement immutable audit

**Acceptance Criteria**
- AC1 (Insert only): Complete/cancel chỉ INSERT vào `inventory_movements`, không UPDATE/DELETE rows cũ.
- AC2 (onHandBefore snapshot): Mỗi row capture `onHandBefore` tại thời điểm — useful cho re-replay audit.
- AC3 (createdBy preserved): completedBy / cancelledBy → set vào movement.createdBy.
- AC4 (referenceId points back): Mỗi movement có `referenceId=receiptItem.id` để trace.

---

## Linked TC-IDs (existing docs)

- Không có TC-RECEIPT-* trong `docs/035-QA/QA-MOC.md`.
- Conceptual overlap:
  - TC-PAY-001 (Partial Payment) ≈ US-RECEIPT-I003 + B006 (payment cho receipts khác với payment cho orders — đây là supplier payment, KHÔNG phải customer payment).
  - TC-PROD-007 (Cost Price History) ≈ US-RECEIPT-B002 (WAC logging).
  - TC-PROD-020 (Concurrent Stock Update) ≈ US-RECEIPT-B001 (FOR UPDATE locking).

## Notes / Edge cases unresolved

- **Cancel from COMPLETED via UI**: UI gate `isDraft` trong `[id]/_content.tsx:186` ẩn nút huỷ khi status=COMPLETED. Nhưng service support → nếu cần workflow này, expose qua menu/contextual action.
- **Negative payable**: `discount > total + extraCost` cho ra payable âm. Cần guard (Zod schema hoặc service throw).
- **Receipt without supplier**: Receipt có thể tạo không cần supplier (`supplierId` optional). Nhưng payout luôn cần supplier → backfill flow. OK.
- **Branch (multi-warehouse)**: `branchId` schema có nhưng UI không có input → single-branch MVP.
- **purchaseOrderId optional**: Receipt có thể đứng độc lập, không link PO (manual stock-in). Cần TC riêng: "Receipt không link PO không ảnh hưởng PO state".
- **Idempotent complete**: service throw khi status != DRAFT → caller phải handle retry. Có thể thêm Idempotency-Key support.
- **WAC float drift**: Calc dùng `Number` (float) rồi `toFixed(2)`. Với volume lớn có thể drift cents. Consider decimal lib (e.g. `dinero.js`).
