# Scenario Report — Kế toán / Xuất nhập kho / Hàng tồn

> Target: `plans/260512-0214-admin-user-story-tc/` (sub-scope: accounting + receipts + inventory)
> Date: 2026-05-12 | Branch: dev (`6fcc621`)
> Skill: `/ck:scenario` — narrow scope vào domain kế toán/kho.
> TC files in-scope: `02-purchases.md`, `03-receipts.md`, `04-payouts.md`, `05-debts.md`, `06-inventory.md`, `15-expenses.md` (chưa walk).

## Trục phân tích

Chỉ giữ 5 trục liên quan domain:
1. **State Transitions** — PO, Receipt, Payout lifecycle
2. **Data Integrity** — stock chain (movement onHandBefore/After), WAC, payment status derivation
3. **Concurrency** — FOR UPDATE, race trên stock + PO recv qty
4. **Money Logic** — payable/discount/extra, debt, WAC decimal, refund
5. **Reporting** — X-N-T flow, daily summary, valuation, debt aggregate

---

## Critical scenarios chưa cover

### C1. Idempotency mid-refresh khi `completeGoodsReceipt`
- **Trục**: State Transitions + Data Integrity
- **Tình huống**: User click "Hoàn tất" → network drop → retry. Service hiện check `status='draft'` trước update, nhưng nếu request 1 đã commit + response mất → request 2 thấy `status='completed'` → throw "Chỉ hoàn tất được phiếu ở trạng thái nháp". OK. **Nhưng**: nếu request 1 timeout giữa lúc đang trong tx, server tx rollback → status vẫn draft, client retry → tx 2 chạy lại từ đầu — duplicate WAC update? Verify FOR UPDATE + idempotency.
- **Expected**: Thêm `Idempotency-Key` header. Server check key trong window 24h → return cached response thay vì re-execute.
- **Liên quan TC**: US-RECEIPT-B001 AC5, US-RECEIPT-B002.

### C2. Concurrent `cancelGoodsReceipt` từ COMPLETED → double stock reverse
- **Trục**: Concurrency + Data Integrity
- **Tình huống**: 2 admin cùng hover Trash + click cancel trên cùng COMPLETED receipt. Service select status trong tx — nếu không có `FOR UPDATE` trên receipt row, 2 tx đọc cùng lúc thấy 'completed' → cả 2 reverse stock. onHand bị trừ 2 lần.
- **Expected**: `SELECT ... FOR UPDATE` trên `goods_receipts` row trước update; verify trong service.
- **Liên quan TC**: US-RECEIPT-B004 (chưa có concurrency AC riêng cho cancel).

### C3. Direct SQL bypass movement chain
- **Trục**: Data Integrity
- **Tình huống**: Manual fix prod via psql: `UPDATE product_variants SET on_hand = 100 WHERE id = X`. → `variants.onHand` không match `latest movement.onHandAfter`. Mọi `updateOpeningStock` sau đó re-chain dựa trên movements cũ → khôi phục về giá trị cũ. Mọi report dùng `variants.onHand` (list, valuation) cho giá trị sai.
- **Expected**: CI audit query (cron daily) — `SELECT variant_id FROM (SELECT DISTINCT ON (variant_id) variant_id, on_hand_after FROM inventory_movements ORDER BY variant_id, created_at DESC, id DESC) m JOIN product_variants v ON v.id = m.variant_id WHERE v.on_hand != m.on_hand_after`. Alert nếu drift detected.
- **Liên quan TC**: US-INV-B010 AC4 đã flag nhưng chưa có defense mechanism.

### C4. `adjustInventory` qty âm tạo onHand < 0 (D.4 confirmed bug)
- **Trục**: Data Integrity + Money Logic
- **Tình huống**: onHand=2, manual adjust qty=-5 → onHand=-3 stored. WAC formula khi receipt sau đó: `onHand=-3, cost=100, qty_in=5, cost_in=200` → fallback to incoming (200), nhưng chain on_hand_after từ -3 → 2 thay vì 0 → 5. Report X-N-T: opening=-3, in=5, out=0 → closing=2 — nhưng physical stock thực tế là 5.
- **Expected**: Service pre-check: `if (current.onHand + quantity < 0) throw "Không đủ tồn"`. Hoặc allow + flag movement với `note='underflow'` để audit.
- **Liên quan TC**: US-INV-B002 AC4, US-INV-B011 AC2.

### C5. Receipt cancel sau khi orders đã rút stock
- **Trục**: Concurrency + Data Integrity
- **Tình huống**: Receipt completed → +10 onHand. Sau đó 5 orders rút stock → onHand=5. Cancel receipt → reverse -10 → onHand âm. `GREATEST(0, ...)` clamp đã có (US-RECEIPT-B004 AC4) nhưng **clamp che giấu** discrepancy: movement.quantity=-10, nhưng onHand chỉ giảm 5. Chain bị phá: `m.onHandBefore=5, quantity=-10, onHandAfter=0` (do clamp) — invariant `before + quantity = after` violated (-5 ≠ 0).
- **Expected**: Nếu clamp trigger → service throw error "Không thể huỷ vì đã có giao dịch xuất kho sau khi hoàn tất". Bắt user huỷ orders trước.
- **Liên quan TC**: US-RECEIPT-B004 AC4 chỉ note "ngăn âm" — không noted chain inconsistency.

### C6. WAC decimal drift over volume
- **Trục**: Money Logic
- **Tình huống**: 1000 receipts/tháng. `Number((100×10 + 200×5)/15).toFixed(2)` = "133.33". Loss = 0.0033 per receipt. Compounding qua nhiều WAC update: `newCost = (133.33×10 + 200×5)/(15)` ≠ recompute từ raw đầu. Profit report drift hàng triệu sau 1 năm.
- **Expected**: Migrate sang `decimal.js` / `dinero.js` hoặc dùng PG `numeric(18,4)` SQL ops thuần (không Number() roundtrip).
- **Liên quan TC**: US-RECEIPT-B002 AC7 chỉ note "verify".

### C7. Refund / credit memo missing
- **Trục**: Money Logic + State Transitions
- **Tình huống**: Order paid (paid=500, total=500) → cancel order. Payment row vẫn tồn tại trên `payments` table. Debts list không include (vì stock_out=false hoặc fulfillmentStatus=cancelled). **Orphan**: customer đã trả 500, không có cơ chế trả lại / chuyển thành credit balance.
- **Expected**: Define flow — (a) Cancel paid order tạo `customer_credit` row +500, hoặc (b) Block cancel nếu paid>0, hoặc (c) Manual refund payment + audit row.
- **Liên quan TC**: US-DEBT-B011 AC3 đã ngỏ; Open Question #8 trong GAP.

### C8. `getInventoryDailySummary` timezone drift
- **Trục**: Reporting + Money Logic
- **Tình huống**: Receipt completed lúc `2026-05-12 23:30 Asia/Ho_Chi_Minh` (= `2026-05-12 16:30 UTC`). `DATE(created_at)` trên server UTC trả `'2026-05-12'`. Nếu server timezone là `Asia/Seoul` (UTC+9), receipt lúc `06:30 next day local` → `DATE()` = `'2026-05-13'`. Daily report VN ngày 12 thiếu giao dịch này.
- **Expected**: `DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')` explicit. Hoặc store `business_date DATE` column riêng (set tại insert qua app logic).
- **Liên quan TC**: US-INV-B008 AC4 note "verify nếu cần explicit TZ" — cần promote thành must-fix.

### C9. Concurrent `updateOpeningStock` cho cùng variant
- **Trục**: Concurrency + Data Integrity
- **Tình huống**: 2 admin cùng đổi opening stock variant X. Window function `SUM(quantity) OVER (...)` chạy trong tx 1 với newQty=100, tx 2 với newQty=200. Nếu không `LOCK ROW` toàn bộ movements của variant trước UPDATE → 2 chains overlap → final state không deterministic.
- **Expected**: `SELECT id FROM inventory_movements WHERE variant_id = X FOR UPDATE` đầu tx (lock toàn bộ movements rows + variant row). Hoặc dùng advisory lock per variantId.
- **Liên quan TC**: US-INV-B003 (8 AC nhưng không có concurrency AC).

---

## High scenarios

### H1. PARTIAL PO cancel — chưa định nghĩa
- **Trục**: State Transitions + Money Logic
- US-PURCH-B005 AC3 flagged: cancel PARTIAL allowed (code chỉ block RECEIVED). Nhưng cancel PARTIAL: phần đã nhận có reverse không? Hiện đoán là KHÔNG reverse (chỉ change status). → Stock đã cộng giữ nguyên, PO cancelled. Bookkeeping: ai chịu trách nhiệm phần stock đã nhập?
- **Expected**: Chốt policy + viết TC. Đề xuất: cancel PARTIAL = "đóng đơn", phần đã nhận giữ stock + WAC, phần chưa nhận xoá khỏi expected.

### H2. Receipt đứng độc lập (không link PO)
- US-RECEIPT note đã flag — receipt.purchaseOrderId optional. Service support nhưng chưa có TC.
- **Expected**: TC "Tạo manual receipt: stock cộng đúng + WAC update + KHÔNG touch bất kỳ PO nào + payout supplier debt vẫn tính chuẩn".

### H3. Discount > (total + extraCost) → payable âm
- US-RECEIPT-B008 AC6 ngỏ. Service hiện không guard — payableAmount âm trong DB. Payment status derivation: `paid >= payable` → `paid=0 >= -100` true → `paymentStatus='paid'` ngay khi tạo, debt=0. Sai lệch supplier debt aggregate.
- **Expected**: Service throw nếu `total - discount + extraCost < 0`. Hoặc clamp về 0.

### H4. Overpay payout vượt outstanding (lax tolerance edge)
- US-PAYOUT-B004 AC4: tolerance=0.01. Float edge `outstanding=0.01, amount=0.02` → check `0.02 > 0.01 + 0.01 = 0.02` false → pass. Nhưng `0.02 > 0.01` true → đáng lý reject.
- **Expected**: So sánh integer cents thay vì float. Hoặc tolerance ngặt: `amount > outstanding` reject thẳng.

### H5. DebtPaymentDrawer FIFO allocation chưa verify code
- US-DEBT-B006 toàn là assumption. Service path chưa được audit. Rủi ro: pay 250 cho 3 orders (100/200/300), nếu allocation sai → 1 order paid + 2 unpaid (thay vì 1 paid + 1 partial + 1 unpaid).
- **Expected**: Walk `debt-payment-drawer.tsx` + service backend; viết TC: oldest-first, atomic tx, partial allocation last order, over-pay reject hoặc allocate up to debt only.

### H6. Cost=0 receipt → WAC drop về 0
- US-PURCH note 313: variant cost default "0" nếu chưa có. Tạo receipt qty=10 cost=0 → WAC formula: variant onHand=10 cost=100, incoming qty=10 cost=0 → newCost=(1000+0)/20=50. → Cost của tồn kho cũ bị dilute thành 50.
- **Expected**: Service warn hoặc reject `unitCost = 0`. Hoặc skip WAC update khi `incoming cost = 0` (treat as gift/free sample).

### H7. Receipt cancel COMPLETED qua API trong khi UI ẩn
- US-RECEIPT-I006 AC3: UI gate `isDraft` ẩn nút cancel khi COMPLETED. Service support → API direct call vẫn cancel được. Audit gap: developer/ops dùng curl bypass UI.
- **Expected**: Hoặc expose UI cho Owner với confirm dialog gắt, hoặc block ở service level cho COMPLETED.

### H8. Supplier debt aggregate exclude DRAFT (intentional?)
- US-PAYOUT-B008 AC2: `getSupplierDebtsAggregate` chỉ tính COMPLETED + debt>0. DRAFT receipts có debt nhưng không vào supplier debt report. → Nếu DRAFT giữ lâu (chưa hoàn tất nhập), supplier debt report under-report thực tế.
- **Expected**: Confirm business intent. Có thể split báo cáo: "Đã ghi nhận công nợ" (COMPLETED) vs "Pending" (DRAFT).

### H9. Reverse PO recv qty âm khi concurrent receipts
- US-RECEIPT-B004 AC4: `GREATEST(received - qty, 0)` clamp. Tương tự C5: clamp che lỗi. Receipt A complete (recv+=5), Receipt B complete (recv+=3). Cancel A → recv=8-5=3. Cancel B → recv=3-3=0. OK. **Nhưng**: nếu A cancel trước khi B complete, race: recv=5, A cancel (recv=0), B complete (recv=3). Cancel B → recv=0. Nếu B complete-cancel race với A cancel → recv có thể stuck > orderedQty hoặc < 0 nếu sequence sai.
- **Expected**: PO row FOR UPDATE trong cả `applyReceiptToPurchaseOrder` và `reverseReceiptFromPurchaseOrder`.

### H10. Inventory flow report (X-N-T) opening edge
- US-INV-B006 AC1: opening = "DISTINCT ON (variant_id) on_hand_after từ movement < startDate". Edge: variant không có movement < startDate (mới tạo trong period) → opening=0 (AC8). OK. **Nhưng**: variant có opening movement chính xác lúc startDate (00:00 boundary) — `< startDate` exclude → opening=0 dù đáng lý phải bao gồm. Tuỳ semantics "đầu kỳ" inclusive/exclusive.
- **Expected**: Định nghĩa rõ: opening = state cuối kỳ trước = movement.created_at < startDate (exclusive). Document trong spec.

### H11. Expenses module chưa walk
- File `15-expenses.md` không trong sample. Expense ảnh hưởng P&L (profit/loss report) trực tiếp. Cần audit: expense categories, recurring vs one-time, link với supplier? Reconcile với payout?

---

## Medium scenarios

### M1. Re-cancel CANCELLED receipt/PO (US-PURCH-B005 AC5, US-RECEIPT-B005 AC3)
Service không guard cancel-already-cancelled → overwrite `cancelledAt`. Idempotent return mong muốn nhưng hiện overwrite. → Audit log mất timestamp gốc.

### M2. Debts age filter (D.1/D.2 confirmed bug)
Đã liệt kê GAP-REPORT. Fix service signature `{ minAgeDays?, maxAgeDays? }`, remap tab fresh/old/very_old.

### M3. Soft-deleted supplier hiển thị trong historical receipts
US-DEBT-B002 AC4: inner join profiles làm orphan customer biến mất khỏi debt list. Tương tự với receipts khi supplier soft-deleted: receipt vẫn tồn tại nhưng supplier name null. Cần LEFT JOIN + "Đã xoá" placeholder để không che giấu công nợ.

### M4. Receipt receipt.supplierId backfill race
US-PAYOUT-B003 AC3 atomic OK. **Nhưng**: nếu 2 payouts concurrent cho receipt-no-supplier, mỗi payout chọn supplier khác → cả 2 update receipt.supplierId → last-writer-wins, một payout có supplierId không match receipt cuối cùng.
- **Expected**: Lock receipt row trong tx, check sau backfill: nếu receipt.supplierId != payout.supplierId after backfill → rollback.

### M5. `stock_count_balance` + `cost_adjustment` movement types đứng yên
US-INV note 250-251: 2 enum types không có service path. Code chưa dùng → dead code hoặc planned. Quyết định: implement `/stocktake` flow + cost manual adjust, hoặc remove enum values để giảm confusion.

### M6. Daily summary timezone (medium duplicate của C8)
US-INV-B008 AC4 — cùng issue C8 nhưng riêng cho daily summary endpoint. Một fix đồng thời 2 nơi.

### M7. Inventory valuation dùng `variants.onHand` thay vì latest movement
US-INV-B005 AC1: `stockValue = onHand × costPrice`. Nếu C3 (direct SQL bypass) xảy ra → valuation sai. Defense: valuation query dùng movement latest hoặc check drift trước khi report.

---

## Cross-cutting must-fix (cốt lõi nghiệp vụ)

### F1. Idempotency-Key cho mọi mutation chạm stock+money
Endpoints: complete/cancel receipt, confirm/cancel PO, create/delete payout, adjustInventory, updateOpeningStock. Mỗi endpoint nhận `Idempotency-Key` header, lưu vào `idempotency_keys` table (key, request_hash, response_body, expires_at). Window 24h.

### F2. Negative-stock policy thống nhất
3 paths có thể tạo onHand âm hoặc chain drift:
- `adjustInventory` qty âm (C4)
- Receipt cancel sau orders đã rút stock (C5)
- Order create vượt stock (chưa verify order service)

Chốt 1 trong 3 policy: **block** (throw 409), **warn + flag** (allow + audit), hoặc **allow** (current state — không khuyến nghị).

### F3. Decimal lib cho money
Migrate `Number().toFixed(2)` sang `decimal.js` hoặc dùng PG `numeric` exclusively. Impact: WAC, payable derivation, debt aggregate, profit report.

### F4. Timezone explicit trong SQL reporting
Mọi `DATE(created_at)` trong report queries → `DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')`. Hoặc lưu `business_date DATE` column tại insert (single source of truth).

### F5. Refund / credit memo spec
Block thêm payment TC trước khi chốt flow. Đề xuất: tạo `customer_credit` table + cancel paid order chuyển payment thành credit row + UI "Hoàn tiền" hoặc "Áp dụng credit cho order sau".

### F6. Stock chain audit job
Daily cron: detect drift giữa `variants.onHand` và `latest movement.onHandAfter`. Alert + repair option (re-chain qua `updateOpeningStock` với current value).

### F7. FOR UPDATE coverage audit
Review mọi service touching stock/money:
- `completeGoodsReceipt` ✅ (US-RECEIPT-B001 AC5)
- `cancelGoodsReceipt` ❓ (chưa có concurrency AC — C2)
- `confirmPurchaseOrder` ✅ (US-PURCH-B004 AC4)
- `applyReceiptToPurchaseOrder` ❓ (H9)
- `reverseReceiptFromPurchaseOrder` ❓ (H9)
- `updateOpeningStock` ❓ (C9)
- `adjustInventory` ✅ (US-INV-B002 AC1)
- `createSupplierPayment` + backfill ❓ (M4)
- `deleteSupplierPayment` ❓

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 9 |
| High | 11 |
| Medium | 7 |
| **Total** | **27 scenarios** |

**Top 5 must-fix trước production:**
1. **Refund/credit memo spec** (C7/F5) — current orphan payment khi cancel paid order.
2. **Idempotency-Key** (C1/F1) — mọi mutation chạm stock+money, prevent duplicate WAC + double stock.
3. **Negative-stock policy** (C4/C5/F2) — chốt block/warn/allow + audit cho 3 paths.
4. **Decimal precision** (C6/F3) — WAC drift compounding theo volume.
5. **Timezone explicit** (C8/F4) — daily report sai ngày boundary.

## Unresolved business questions

1. PARTIAL PO cancel: keep nhận / reverse nhận?
2. Refund: customer_credit, block cancel, hay manual refund?
3. Negative-stock: block, warn, hay allow?
4. Cost=0 receipt: reject, warn, skip WAC?
5. DRAFT receipt debt có nên hiện trong supplier debt report?
6. Stocktake module (`stock_count_balance`) có roadmap không?
7. Cost adjustment (`cost_adjustment` movement) khi nào dùng?
8. Opening kỳ inclusive/exclusive startDate boundary?
9. Expenses module — chưa walk, cần riêng phiên?
10. Decimal lib choice: `decimal.js`, `dinero.js`, hay numeric SQL thuần?
