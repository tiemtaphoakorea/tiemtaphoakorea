# Flow Nhập Kho (Purchase/Inventory Receiving)

## 1. Database Schema

### Đặt hàng (Purchase Orders)
```
purchaseOrders
├── id, code (PO-XXXXXX), supplierId
├── status: draft → ordered → partial → received | cancelled
├── orderedAt, expectedDate, completedAt
├── totalQty, totalAmount, discountAmount
└── createdBy, confirmedBy

purchaseOrderItems
├── purchaseOrderId, variantId
├── orderedQty, receivedQty (cập nhật khi nhập)
├── unitCost, discount, lineTotal
```

### Nhận hàng (Goods Receipts)
```
goodsReceipts
├── id, code (PON-XXXXXX), purchaseOrderId? (optional), supplierId
├── status: draft → completed | cancelled
├── paymentStatus: unpaid → partial → paid
├── invoiceDate, invoiceRef (thông tin NCC)
├── totalAmount, discountAmount, extraCost, payableAmount
├── paidAmount, debtAmount
└── createdBy, completedBy

goodsReceiptItems
├── receiptId, purchaseOrderItemId? (optional), variantId
├── quantity, unitCost, discount, lineTotal

supplierPayments
├── supplierId, receiptId
├── amount, method (cash/bank_transfer/card), paidAt
```

### Tồn kho & Giá vốn
```
productVariants
├── onHand, reserved
└── costPrice (giá vốn WAC hiện tại)

costPriceHistory
└── variantId, costPrice, effectiveDate

inventoryMovements
├── variantId, type (supplier_receipt | stock_out | manual_adjustment | cancellation)
├── quantity, onHandBefore, onHandAfter
└── referenceId (receiptId)
```

---

## 2. Workflow 4 Bước

```
[Tạo PO] → [Xác nhận PO] → [Tạo Receipt] → [Hoàn tất Receipt]
  draft        ordered          draft            completed
  ❌ kho       ❌ kho           ❌ kho           ✅ kho + WAC
```

### Bước 1 - Tạo PO (`/purchases/new`)
- Chọn NCC, ngày dự kiến nhận
- Thêm sản phẩm: variant + orderedQty + unitCost + discount
- `POST /api/admin/purchases` → insert purchaseOrders + purchaseOrderItems
- Kết quả: PO status=**draft**, tồn kho chưa đổi

### Bước 2 - Xác nhận PO (`/purchases/[id]`)
- Manager/Owner bấm [Xác nhận]
- `POST /api/admin/purchases/[id]/confirm` → status=**ordered**, orderedAt=NOW()
- Kết quả: PO status=**ordered**, chờ nhập hàng

### Bước 3 - Tạo Receipt (`/receipts/new`)
- Chọn NCC (hoặc chọn PO để auto-fill)
- Điền invoiceDate, invoiceRef, extraCost, discountAmount
- Thêm sản phẩm: variant + quantity (có thể khác PO) + unitCost + discount
- `POST /api/admin/receipts` → insert goodsReceipts + goodsReceiptItems
- Kết quả: Receipt status=**draft**, tồn kho **chưa** đổi

### Bước 4 - Hoàn tất Receipt (`/receipts/[id]`)
- Manager/Owner bấm [Hoàn tất phiếu]
- `POST /api/admin/receipts/[id]/complete`
- Xử lý trong **1 DB transaction**:
  1. UPDATE goodsReceipts status='completed'
  2. Tính WAC cho từng variant:
     ```
     newCost = (oldQty × oldCost + incomingCost) / (oldQty + incomingQty)
     ```
     → UPDATE productVariants.costPrice + INSERT costPriceHistory
  3. Cập nhật tồn kho:
     → UPDATE productVariants.onHand += quantity
     → INSERT inventoryMovements (type='supplier_receipt')
  4. Recompute PO status:
     - Tất cả items: received >= ordered → **received**
     - Có ít nhất 1: received > 0 → **partial**
- Kết quả: ✅ Receipt completed, tồn kho tăng, giá vốn WAC mới

---

## 3. Thanh toán NCC

Sau khi receipt completed, ghi nhận thanh toán riêng:
- `POST /api/admin/receipts/[id]/payments`
- Body: `{ amount, method, referenceCode, paidAt }`
- INSERT supplierPayments
- UPDATE goodsReceipts.paidAmount += amount, debtAmount = payableAmount - paidAmount
- Cập nhật paymentStatus: unpaid → partial → paid

---

## 4. API Endpoints Tóm Tắt

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| GET | `/api/admin/purchases` | Danh sách PO |
| POST | `/api/admin/purchases` | Tạo PO mới |
| GET | `/api/admin/purchases/[id]` | Chi tiết PO |
| PATCH | `/api/admin/purchases/[id]` | Cập nhật PO draft |
| POST | `/api/admin/purchases/[id]/confirm` | Xác nhận PO |
| POST | `/api/admin/purchases/[id]/cancel` | Hủy PO |
| GET | `/api/admin/receipts` | Danh sách receipts |
| POST | `/api/admin/receipts` | Tạo receipt |
| GET | `/api/admin/receipts/[id]` | Chi tiết receipt |
| PATCH | `/api/admin/receipts/[id]` | Cập nhật receipt draft |
| POST | `/api/admin/receipts/[id]/complete` | Hoàn tất receipt |
| POST | `/api/admin/receipts/[id]/cancel` | Hủy receipt |
| POST | `/api/admin/receipts/[id]/payments` | Ghi nhận thanh toán |

---

## 5. Công thức WAC

```
WAC mới = (tồn hiện tại × giá vốn cũ + số lượng nhập × đơn giá nhập)
          ÷ (tồn hiện tại + số lượng nhập)

Ví dụ:
  Tồn: 10 cái @ 100k → giá trị = 1M
  Nhập: 5 cái @ 120k → giá trị = 600k
  WAC mới: 1,600k / 15 = 106.67k/cái
```

---

## 6. Relations

```
suppliers ──< purchaseOrders ──< purchaseOrderItems >── productVariants
           ──< goodsReceipts  ──< goodsReceiptItems  >── productVariants
           ──< supplierPayments                          ──< inventoryMovements
                                                         ──< costPriceHistory
purchaseOrders ──< goodsReceipts (optional link)
purchaseOrderItems ──< goodsReceiptItems (optional link)
```

---

## Unresolved Questions

1. Cancel completed receipt có reverse inventory + WAC không?
2. Nhập quantity > ordered_qty trong PO có warning?
3. Opening stock adjustment có API riêng không?
4. WAC history có track "từ receipt nào" không?
