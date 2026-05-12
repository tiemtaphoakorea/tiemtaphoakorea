# Module: Purchases — Đặt hàng nhập (`/purchases`)

> Walk-through 2026-05-12 trên `localhost:3001`, user `admin` (Owner).
> Source UI: `apps/admin/app/(dashboard)/purchases/`
> Source service: `packages/database/src/services/purchase-order.server.ts`
> Schema: `packages/database/src/schema/purchases.ts`
> Constants: `@workspace/shared/constants` → `PURCHASE_ORDER_STATUS`, `DOC_PREFIX.PURCHASE_ORDER`

## Screen Inventory

| Screen | Route | Notes |
|--------|-------|-------|
| List | `/purchases` | Tabs: Tất cả / Chưa nhập / Một phần / Hoàn thành. Search debounced 300ms (code, note, supplier). Supplier filter. Page sizes 10/25/50/100, default 25. Empty state: "Chưa có đơn nhập". |
| Create | `/purchases/new` | Form: supplier (optional), expected date, variant picker (search), per-item qty/cost/discount, note. Bumps qty on duplicate variant. Live total footer. |
| Detail | `/purchases/[id]` | Header with code (mono), StatusPill. Action buttons: Huỷ đơn / Xác nhận đơn / Tạo phiếu nhập. Detail rows (supplier, qty, value, discount, dates). Items table (ordered/received/unit cost/line total). Cancel confirm dialog. |

**Statuses observed**: `DRAFT` (gray, "Nháp"), `ORDERED` (blue, "Đã đặt" / tab "Chưa nhập"), `PARTIAL` (amber, tab "Một phần"), `RECEIVED` (green, tab "Hoàn thành"), `CANCELLED` (red).

**Status transitions** (from `purchase-order.server.ts`):
```
DRAFT --(confirm: ORDERED)--> ORDERED
ORDERED/PARTIAL --(receipts apply)--> PARTIAL or RECEIVED (auto via recompute)
DRAFT/ORDERED/PARTIAL --(cancel)--> CANCELLED (terminal)
RECEIVED --(cancel)--> ❌ blocked ("Không thể huỷ đơn đã nhận hàng")
CANCELLED --(any recompute)--> CANCELLED (terminal, never overwritten)
```

**RBAC** (client gates from `[id]/_content.tsx`): `OWNER` và `MANAGER` mới thấy nút Xác nhận/Huỷ/Tạo phiếu nhập. `STAFF` chỉ xem.

---

## (I) Interaction Test Cases

### US-PURCH-I001 — Filter purchases theo tab status

**As** an admin user
**I want to** lọc danh sách PO theo trạng thái bằng tabs
**So that** tôi nhanh chóng zoom vào subset cần xử lý

**Acceptance Criteria**
- AC1 (Happy path): Given có ít nhất 1 PO mỗi status / When click tab `Chưa nhập` / Then table chỉ hiện row có `status=ORDERED`, count selected tab visually active (highlighted).
- AC2 (Reset to All): Given filter `Chưa nhập` đang active / When click tab `Tất cả` / Then list hiện full, page reset về 1.
- AC3 (Page reset): Given đang ở `Tất cả`, page 3 / When click tab `Một phần` / Then page reset về 1 (verify URL/UI page indicator = 1).
- AC4 (Empty state per tab): Given không có PO nào với status `RECEIVED` / When click tab `Hoàn thành` / Then thấy "Chưa có đơn nhập" trong table body.
- AC5 (Keyboard): When focus tab list + nhấn `ArrowRight` / Then focus chuyển sang tab kế (Tabs primitive of shadcn — verify roving tabindex).

**UI selectors observed**: `role=tablist` (ref_16), `role=tab` "Tất cả"/"Chưa nhập"/"Một phần"/"Hoàn thành".

### US-PURCH-I002 — Search debounce 300ms

**As** an admin user
**I want to** gõ keyword và list tự lọc sau khi tôi ngừng gõ
**So that** không bị spam request từng ký tự

**Acceptance Criteria**
- AC1 (Debounce active): Given list 25 PO mặc định / When tôi gõ "PO-202" liên tục < 300ms ngắt nhau / Then chỉ có 1 request `GET /api/admin/purchases?search=PO-202` sau lần gõ cuối + 300ms.
- AC2 (Search matches): When gõ `<keyword>` match mã PO/note/tên NCC / Then table hiện rows có `code ILIKE '%keyword%' OR note ILIKE … OR supplierName ILIKE …`.
- AC3 (Clear search): Given có keyword đang gõ / When xoá hết input / Then list trở về full sau 300ms.
- AC4 (Special chars): When gõ `_` hoặc `%` / Then không vỡ query, ilike escape đúng (verify không có 500).
- AC5 (Total count update): When search giảm matches từ 25 → 3 / Then text "3 đơn" hiển thị bên cạnh search box, pagination footer cập nhật.

**UI selectors**: `role=textbox` "Tìm theo mã đơn, nhà cung cấp, ghi chú..." (ref_21).

### US-PURCH-I003 — Click row navigate to detail

**As** an admin user
**I want to** click row trong table để vào trang detail
**So that** không cần button "View" riêng (Sapo-style row-click navigation)

**Acceptance Criteria**
- AC1 (Click navigate): Given list có ≥1 PO / When click bất kỳ ô trong row / Then router push tới `/purchases/{id}` (verify URL change, page header hiện code PO).
- AC2 (Cursor pointer hint): When hover row / Then cursor=pointer (visual affordance — class `cursor-pointer` trong code).
- AC3 (Não click outside row): When click vào pagination/filter/header / Then KHÔNG navigate (verify URL không đổi).

### US-PURCH-I004 — Variant search picker bumps qty on duplicate pick

**As** an admin user
**I want to** khi tôi pick lại 1 variant đã chọn, qty +1 thay vì throw error
**So that** thao tác mượt, không phải tự xoá row rồi sửa qty

**Acceptance Criteria**
- AC1 (First pick): Given items rỗng / When pick variant X / Then row mới với `qty=1`, `unitCost=variant.costPrice`, `discount=""`.
- AC2 (Duplicate pick): Given variant X đang là row #1 với qty=3 / When pick lại variant X / Then qty row #1 thành 4, không tạo row mới (verify items.length không đổi).
- AC3 (Different variant): Given variant X đang là row #1 / When pick variant Y / Then row #2 thêm vào, items.length=2.
- AC4 (Disabled selectedIds): Given variant X đang trong items / When search box hiển thị X / Then X được mark là selected trong listbox (component prop `selectedIds`).

### US-PURCH-I005 — Live total footer cập nhật khi sửa qty/cost/discount

**As** an admin user
**I want to** thấy tổng số lượng và tổng tiền cập nhật real-time
**So that** verify trước khi submit

**Acceptance Criteria**
- AC1 (Initial): Given 0 items / When mở trang / Then footer KHÔNG hiển thị (table không render).
- AC2 (Single row): Given 1 row qty=5, unitCost=10000, discount=2000 / Then footer "Tổng qty=5, amount=48,000đ" (= 5×10000 − 2000).
- AC3 (Multiple rows): Given 2 rows / Then footer = sum(qty), sum(amount).
- AC4 (Invalid number): Given user gõ "abc" vào qty / Then Number("abc")=NaN → 0 trong tổng (graceful, not crash). Verify submit chặn ở validation.
- AC5 (Format locale): Footer hiển thị `48,000đ` với dấu phẩy (vi-VN locale via `toLocaleString`).

### US-PURCH-I006 — Submit empty form → toast error "Cần ít nhất 1 sản phẩm"

**As** an admin user
**I want to** nhận feedback rõ ràng khi submit form thiếu data
**So that** biết phải bổ sung gì

**Acceptance Criteria**
- AC1 (Empty items): Given items.length=0, supplier/expected/note bất kỳ / When click "Tạo đơn" / Then sonner toast "Cần ít nhất 1 sản phẩm" hiện ở góc; KHÔNG có request POST gửi đi (verify network panel).
- AC2 (Invalid qty): Given items[0].orderedQty="0" / When submit / Then toast "Dòng 1: số lượng phải lớn hơn 0".
- AC3 (Invalid cost): Given items[0].unitCost="-5" / When submit / Then toast "Dòng 1: giá nhập không hợp lệ".
- AC4 (Submit button state): When mutation pending / Then button text "Đang tạo...", `disabled=true`.

### US-PURCH-I007 — Detail page action button visibility theo status

**As** an admin user (Owner/Manager)
**I want to** chỉ thấy action button phù hợp với status hiện tại của PO
**So that** không bị confuse hoặc click nhầm

**Acceptance Criteria** (theo logic ở `[id]/_content.tsx:96-104`):
- AC1 (DRAFT): Status `DRAFT` → hiện "Xác nhận đơn" + "Huỷ đơn" (canCancel: !received && !cancelled). KHÔNG hiện "Tạo phiếu nhập".
- AC2 (ORDERED): Status `ORDERED` → hiện "Huỷ đơn" + "Tạo phiếu nhập". KHÔNG hiện "Xác nhận đơn".
- AC3 (PARTIAL): Status `PARTIAL` → hiện "Huỷ đơn" + "Tạo phiếu nhập".
- AC4 (RECEIVED): Status `RECEIVED` → KHÔNG hiện button nào (canCancel false, canConfirm false, canCreateReceipt false).
- AC5 (CANCELLED): Status `CANCELLED` → KHÔNG hiện button nào.

### US-PURCH-I008 — Cancel order confirmation dialog

**As** an admin user
**I want to** confirm trước khi huỷ đơn nhập
**So that** tránh huỷ nhầm

**Acceptance Criteria**
- AC1 (Open dialog): When click "Huỷ đơn" / Then AlertDialog mở với title "Huỷ đơn nhập", description "Hành động này không thể hoàn tác. Bạn có chắc muốn huỷ đơn nhập này?".
- AC2 (Cancel keeps state): When click "Không" / Then dialog đóng, PO status không đổi, KHÔNG có request DELETE/PATCH.
- AC3 (Confirm fires): When click button "Huỷ đơn" (destructive style) trong dialog / Then `cancelMutation.mutate()` chạy.
- AC4 (Loading state): During mutation pending / Then "Huỷ đơn" và "Xác nhận đơn" buttons cả 2 disabled (`isPending = confirmMutation.isPending || cancelMutation.isPending`).
- AC5 (Success toast): On success → "Đã huỷ đơn nhập"; on error → error message từ server.

### US-PURCH-I009 — Pagination + page size selector

**As** an admin user
**I want to** điều chỉnh page size và navigate pages
**So that** xem nhiều/ít rows tuỳ ý

**Acceptance Criteria**
- AC1 (Default): page=1, pageSize=25.
- AC2 (Change page size): When chọn 50 từ Select / Then page reset về 1, query refetch với limit=50, footer "Hiển thị 50 / trang".
- AC3 (Next page): Given total > 25 / When click "Next page" / Then page=2, table refetch.
- AC4 (Disabled boundary): Given page=1 / Then "Previous page" disabled. Given page=totalPages / Then "Next page" disabled.
- AC5 (Keep filter on page change): Given filter `status=ORDERED`, page 1 / When click Next / Then query vẫn có `status=ORDERED`, page=2.

### US-PURCH-I010 — Header back button + breadcrumb

**As** an admin user
**I want to** dễ quay lại list từ detail/new
**So that** workflow mượt

**Acceptance Criteria**
- AC1 (Back arrow): When click ChevronLeft icon header trên `/purchases/new` / Then navigate về `/purchases`.
- AC2 (Breadcrumb): On `/purchases/new` → breadcrumb "Admin > Purchases > Tạo mới". On `/purchases/{id}` → "Admin > Purchases > {code}".
- AC3 (Form unsaved leave): Given new form đã pick items / When click "Huỷ" link / Then navigate không hỏi confirm (current behavior — chưa có dirty guard).

---

## (B) Business Test Cases

### US-PURCH-B001 — Tạo PO với items rỗng bị reject (server-side)

**As** an Owner
**I want to** server từ chối tạo PO khi không có items
**So that** đảm bảo invariant: PO luôn có ≥1 item

**Acceptance Criteria**
- AC1 (Service throws): `createPurchaseOrder({ items: [] })` → throw `Error("Cần ít nhất 1 sản phẩm cho đơn nhập")` (xem `purchase-order.server.ts:236`).
- AC2 (API status): `POST /api/admin/purchases` với body `{ items: [] }` → response 400 + error message ≈ "Cần ít nhất 1 sản phẩm".
- AC3 (No DB row): After failed call → `SELECT COUNT(*) FROM purchase_orders WHERE created_at > <before>` = 0 (verify transaction rollback).

### US-PURCH-B002 — PO code unique auto-generated qua `nextDocumentCode`

**As** an Owner
**I want to** mỗi PO có code unique theo prefix `DOC_PREFIX.PURCHASE_ORDER`
**So that** dễ tham chiếu, không trùng

**Acceptance Criteria**
- AC1 (Format): Code match regex `^PO-\d{8}-[A-Z0-9]+$` (hoặc theo `DOC_PREFIX.PURCHASE_ORDER` value — verify trong constants).
- AC2 (Uniqueness): Tạo 2 PO liên tiếp → codes khác nhau.
- AC3 (Sequence safety): 10 client gọi `createPurchaseOrder` concurrent → 10 codes distinct (verify `nextDocumentCode` dùng `FOR UPDATE` hoặc sequence).
- AC4 (DB constraint): Insert manual duplicate code → DB từ chối (UNIQUE constraint on `purchase_orders.code`).

### US-PURCH-B003 — Aggregate totals chính xác từ items

**As** an Owner
**I want to** `totalQty`, `totalAmount`, `discountAmount` được tính chuẩn từ items khi tạo
**So that** report/dashboard không lệch

**Acceptance Criteria** (theo `aggregate()` ở `purchase-order.server.ts:44-58`):
- AC1 (Single item): items=[{qty:5, unitCost:"10000", discount:"2000"}] → totalQty=5, totalAmount="50000.00", discountAmount="2000.00".
- AC2 (Multiple items): items=[{qty:2, cost:"100"}, {qty:3, cost:"200"}] (no discount) → totalQty=5, totalAmount="800.00", discountAmount="0.00".
- AC3 (lineTotal per item): lineTotal = qty*unitCost - discount, stored as decimal(2) (`toMoney` format).
- AC4 (No discount field): Item không có `discount` → treated as 0, không null.
- AC5 (Float precision): qty=3, cost="33.33", discount="0" → lineTotal="99.99", totalAmount="99.99" (no float drift, verify Number().toFixed(2)).

### US-PURCH-B004 — Confirm chỉ chạy được từ status DRAFT

**As** an Owner
**I want to** confirm action chỉ valid khi PO đang DRAFT
**So that** không thể skip status

**Acceptance Criteria**
- AC1 (Valid): PO status=DRAFT / `confirmPurchaseOrder(id, userId)` → status=ORDERED, orderedAt=now(), confirmedBy=userId, updatedAt=now().
- AC2 (Invalid from ORDERED): PO status=ORDERED → throw `Error("Chỉ confirm được đơn ở trạng thái nháp (hiện: ORDERED)")`.
- AC3 (Invalid from RECEIVED/CANCELLED): Same throw pattern, status không đổi.
- AC4 (Concurrency): 2 admin cùng confirm 1 DRAFT PO concurrent → 1 succeed, 1 fail with "Chỉ confirm được đơn ở trạng thái nháp (hiện: ORDERED)" (vì `SELECT ... FOR UPDATE` lock).
- AC5 (Audit fields): After confirm → `orderedAt`, `confirmedBy`, `updatedAt` all set; original `createdAt`, `createdBy` không thay đổi.

### US-PURCH-B005 — Cancel blocked khi status RECEIVED

**As** an Owner
**I want to** không thể huỷ PO đã nhận hàng đầy đủ
**So that** không phá vỡ inventory đã cộng

**Acceptance Criteria**
- AC1 (Cancel from DRAFT): allowed → status=CANCELLED, cancelledAt=now().
- AC2 (Cancel from ORDERED): allowed.
- AC3 (Cancel from PARTIAL): allowed (theo code: chỉ check `=== RECEIVED`). **Note**: Cần verify business intent — có nên block cancel PARTIAL không?
- AC4 (Cancel from RECEIVED): blocked → throw `Error("Không thể huỷ đơn đã nhận hàng")`.
- AC5 (Cancel from CANCELLED): re-cancel — current code không có guard, sẽ overwrite cancelledAt. **Edge case cần review**.

### US-PURCH-B006 — Recompute status sau khi receipt apply/reverse

**As** the system
**I want to** PO status tự update khi receipt được tạo/huỷ
**So that** status luôn phản ánh đúng nhận hàng thực tế

**Acceptance Criteria** (theo `recomputePurchaseOrderStatus()`):
- AC1 (All received): PO 3 items, all `receivedQty >= orderedQty` / After receipt → status=RECEIVED, `completedAt=now()`.
- AC2 (Some received): PO 3 items, 1 partial / After receipt → status=PARTIAL.
- AC3 (None received): All `receivedQty=0` + status was ORDERED → status=ORDERED (no change).
- AC4 (Reverse to 0): Cancel receipt makes all received qty 0 / After reverse → status=ORDERED (downgrade from PARTIAL/RECEIVED), `completedAt=null`.
- AC5 (Cancelled terminal): PO status=CANCELLED / Even if receipts hypothetically apply / Then recompute returns CANCELLED, không overwrite.
- AC6 (Receipt reverse): `reverseReceiptFromPurchaseOrder` dùng `GREATEST(received - qty, 0)` → không cho receivedQty âm.

### US-PURCH-B007 — Server-side validation: qty > 0, unitCost ≥ 0

**As** the server
**I want to** validate input items độc lập với client-side
**So that** API bị gọi trực tiếp không bypass được

**Acceptance Criteria**
- AC1 (Negative qty): `POST /api/admin/purchases` body có `orderedQty=-5` / Then 400, no row.
- AC2 (Zero qty): orderedQty=0 → 400 (client side cũng block).
- AC3 (Negative cost): unitCost="-100" → 400 hoặc reject (verify with Zod schema in API route).
- AC4 (Non-numeric cost): unitCost="abc" → 400.
- AC5 (Missing variantId): items[0] thiếu variantId → 400.
- AC6 (Non-existent variantId): variantId là UUID không tồn tại → FK constraint error 400 hoặc cleaner 404.

### US-PURCH-B008 — RBAC: Staff không thể confirm/cancel/create receipt

**As** an Owner
**I want to** chỉ Owner và Manager mới thực hiện được action thay đổi PO
**So that** staff không nhỡ tay phá data

**Acceptance Criteria** (client gate ở `CAN_MANAGE_ROLES = [OWNER, MANAGER]`):
- AC1 (Staff UI): Staff login → mở `/purchases/{id}` → KHÔNG thấy 3 nút action.
- AC2 (Staff API confirm): Staff gọi `POST /api/admin/purchases/{id}/confirm` / Then 403 (server-side gate phải có).
- AC3 (Staff API cancel): tương tự → 403.
- AC4 (Manager allowed): Manager → thấy buttons, gọi API → 200.
- AC5 (Owner allowed): Owner → full access.
- AC6 (Inactive user): Owner bị deactivate → 401 (session revoked).

### US-PURCH-B009 — Search query an toàn trước ILIKE injection

**As** the server
**I want to** search keyword không bị inject SQL/ILIKE wildcards
**So that** không expose toàn bộ table

**Acceptance Criteria**
- AC1 (Wildcard input): search=`%` / Then ilike pattern `%\%%` — phải escape hoặc treat as literal (verify drizzle parameterizes).
- AC2 (SQL inject): search=`'; DROP TABLE purchase_orders;--` / Then không có 500, drizzle parameterized; SELECT vẫn chạy, kết quả rỗng.
- AC3 (Long input): search 500 chars → server không OOM, response < 2s.
- AC4 (Unicode): search="đơn hàng" → ilike match được supplier có dấu (verify `LOWER()`/collation).

### US-PURCH-B010 — Pagination limit bounded by 200

**As** the server
**I want to** giới hạn limit max=200 để chống abuse
**So that** không có endpoint `?limit=99999`

**Acceptance Criteria** (xem `purchase-order.server.ts:129`):
- AC1 (Normal): `limit=25` → 25 rows.
- AC2 (Over max): `limit=500` → server clamp về 200.
- AC3 (Zero/negative): `limit=0` hoặc `-10` → clamp về 1.
- AC4 (Default): no limit param → 25.
- AC5 (Page negative): `page=-3` → clamp về 1.

---

## Linked TC-IDs (existing docs)

- Không có TC-PURCH-* nào trong `docs/035-QA/QA-MOC.md` — đây là module mới.
- Có overlap conceptual với TC-SUP-ORDER-* (supplier-orders legacy):
  - TC-SUP-ORDER-001 (Create) ≈ US-PURCH-B001/B002/B003
  - TC-SUP-ORDER-003/004 (Status to Ordered/Cancelled) ≈ US-PURCH-B004/B005
  - TC-SUP-ORDER-005 (Block final state) ≈ US-PURCH-B005
  - TC-SUP-ORDER-011 (Supplier selection) ≈ US-PURCH-I004 + I006
- Nếu `/supplier-orders` được deprecate → migrate các TC trên thành TC-PURCH-* hoặc archive.

## Notes / Edge cases unresolved

- **Cancel PARTIAL behavior**: code cho phép cancel khi status=PARTIAL (chỉ block RECEIVED). Nhưng cancel PARTIAL có nghĩa: phần đã nhận về stock có bị reverse không? Cần kiểm tra service flow + viết TC nếu cần.
- **Re-cancel CANCELLED**: không có guard, sẽ overwrite cancelledAt. Có thể là bug nhỏ.
- **DRAFT lifecycle**: code có nhánh `DRAFT` trong recompute (line 91) — khi nào PO ở DRAFT mà có receivedQty? Có vẻ là dead branch (DRAFT → ORDERED qua confirm trước khi có receipt). Verify.
- **Branch (multi-warehouse)**: `branchId` có trong schema nhưng new form không có UI input. Single-branch MVP assumption?
- **Variant cost default**: `unitCost: variant.costPrice ?? "0"` — nếu variant chưa có cost price → default "0", có thể vô tình tạo PO 0đ. Cần TC kiểm tra.
- **No dirty form guard**: User mất data khi click "Huỷ" link mà chưa save. Acceptable cho MVP?
