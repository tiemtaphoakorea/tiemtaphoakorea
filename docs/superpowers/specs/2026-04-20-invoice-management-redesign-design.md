# Invoice Management Redesign — Spec 1 (Foundation)

**Date:** 2026-04-20
**Scope:** Core restructure of order status, inventory model, debt tracking.
**Out-of-scope (Spec 2):** `return_order` + UI hoàn đơn.

## 1. Mục tiêu

Tách thanh toán và xuất kho thành 2 chiều độc lập, cho phép bán nợ (xuất hàng trước, thu tiền sau) nhưng vẫn trừ đúng tồn kho thực tế. Phân biệt "tồn kho thực tế" với "có thể bán". Quản lý được công nợ theo khách hàng.

Hiện tại hệ thống dùng 1 enum `order_status` (`pending | paid | preparing | shipping | delivered | cancelled`) gộp cả trạng thái thanh toán và giao hàng. Stock bị trừ ngay khi tạo đơn. Không có khái niệm công nợ.

## 2. Quyết định thiết kế (có lý do)

| Quyết định | Lựa chọn | Lý do |
|---|---|---|
| Cấu trúc trạng thái | 2 chiều: `payment_status` + `fulfillment_status` | Khớp đúng yêu cầu "thanh toán và xuất kho độc lập". Xuất kho/giao hàng là sequential nên cùng 1 chiều fulfillment. |
| Chuyển sang `completed` | Thủ công, điều kiện: `stock_out` + `paid` | Chủ shop muốn quyết định đóng đơn (VAT, follow-up). |
| Oversell | Cho phép ở tạo đơn, cấm ở xuất kho | `on_hand` luôn phản ánh thực tế vật lý. Giữ logic auto-supplier-order hiện tại. |
| Công nợ | Per-order + trang tổng hợp theo khách (B) | Đủ dùng cho quy mô shop. Thiết kế đúng để migrate sang ledger (C) sau này không phải backfill phức tạp. |
| Sau `stock_out` | Khóa hoàn toàn, xử lý qua `return_order` | Audit trail sạch. Dữ liệu không lệch. Phù hợp migrate ledger sau này. |

## 3. Data model

### 3.1 Enums mới

`packages/database/src/schema/enums.ts`:

```ts
export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "partial",
  "paid",
]);

export const fulfillmentStatusEnum = pgEnum("fulfillment_status", [
  "pending",
  "stock_out",
  "completed",
  "cancelled",
]);
```

Enum cũ `order_status` giữ lại trong quá trình migration rồi drop ở bước cuối.

### 3.2 Bảng `orders`

Thêm/sửa cột:

- `payment_status` (enum, NOT NULL) — thay thế phần "thanh toán" của `status` cũ.
- `fulfillment_status` (enum, NOT NULL) — thay thế phần "giao hàng" của `status` cũ.
- `stock_out_at` (timestamp, nullable) — set khi `pending → stock_out`.
- `completed_at` (timestamp, nullable) — set khi `stock_out → completed`.
- Drop: `status` (sau khi backfill xong).

Giữ nguyên: `paid_amount`, `total`, items, `payments`, `order_status_history`, `cancelled_at`.

### 3.3 Bảng `product_variants`

- Rename `stock_quantity` → `on_hand` (rõ nghĩa).
- Thêm `reserved` (int, NOT NULL, default 0, `CHECK reserved >= 0`).
- Thêm CHECK `on_hand >= 0` (không còn cho oversell ở kho thực tế).
- `available` = `on_hand - reserved` — không lưu ở DB. Tính ở query time (thêm helper select `on_hand - reserved AS available` trong các query list/detail sản phẩm).

### 3.4 Bảng `order_status_history`

Thay cột `status` thành `payment_status` + `fulfillment_status`. Mỗi transition (ghi payment, xuất kho, hoàn tất, hủy) phía application code ghi 1 row history với snapshot cả 2 chiều sau transition. Giữ `created_at`, `created_by`, `note`.

## 4. State machine

### 4.1 Payment status

```
unpaid ──(thu 1 phần)──> partial ──(thu nốt)──> paid
unpaid ──(thu đủ 1 lần)─────────────────────────> paid
```

Transition bằng cách ghi record vào `payments` (logic hiện có, giữ nguyên `recordPayment`). Sau mỗi payment, recompute `payment_status` từ `paid_amount` vs `total`.

- Không đi ngược (paid → partial/unpaid).
- Không cho ghi payment khi đơn `cancelled` hoặc `completed`.

### 4.2 Fulfillment status

```
pending ──[Xuất kho]────> stock_out ──[Hoàn tất]──> completed
   │
   └──[Hủy]────> cancelled
```

**Ràng buộc transition (enforce ở server + DB CHECK):**

| Transition | Điều kiện | Tác động |
|---|---|---|
| `pending → stock_out` | Mọi item có `on_hand >= qty` | `on_hand -= qty`, `reserved -= qty`, set `stock_out_at` |
| `stock_out → completed` | `payment_status = 'paid'` | Set `completed_at` |
| `pending → cancelled` | (không) | `reserved -= qty` |
| `stock_out → cancelled` | **CẤM** ở Spec 1 | Chỉ xử lý qua `return_order` (Spec 2) |
| `completed → *` | **CẤM** | — |

DB CHECK: `fulfillment_status = 'completed' ⇒ payment_status = 'paid'`.

## 5. Inventory model

```
on_hand    = lượng vật lý trong kho (CHECK >= 0)
reserved   = bị giữ bởi đơn đang pending (CHECK >= 0)
available  = on_hand - reserved (có thể âm → oversell)
```

**Stock events:**

| Event | on_hand | reserved |
|---|---|---|
| Tạo đơn (fulfillment=pending) | — | +qty |
| Hủy đơn pending | — | −qty |
| Xuất kho (pending → stock_out) | −qty | −qty |
| Nhập kho (supplier received) | +qty | — |

**Concurrency:** dùng `lockVariantsForUpdate` (pattern hiện có) khi xuất kho, check `on_hand >= qty` và update atomic.

**Invariants:**

1. `on_hand >= 0` (DB CHECK).
2. `reserved >= 0` (DB CHECK).
3. `reserved` = `SUM(order_items.qty)` của orders có `fulfillment_status = 'pending'` (derived invariant, không enforce được ở DB; verify bằng script one-off sau migration — xem 6.5. Cron định kỳ: out-of-scope).
4. `fulfillment_status = 'completed'` ⇒ `payment_status = 'paid'` (DB CHECK).
5. `stock_out_at IS NOT NULL` ⇔ `fulfillment_status IN ('stock_out', 'completed')`.
6. `completed_at IS NOT NULL` ⇔ `fulfillment_status = 'completed'`.
7. `paid_amount <= total` (đã có).

## 6. Migration

Chạy 1 lần trong 1 transaction. Backup DB trước.

### 6.1 Bước 1 — Schema (DDL)

1. Tạo enum `payment_status`, `fulfillment_status`.
2. Thêm `orders.payment_status`, `orders.fulfillment_status` (nullable tạm).
3. Thêm `orders.stock_out_at`, `orders.completed_at`.
4. Rename `product_variants.stock_quantity` → `on_hand`.
5. Thêm `product_variants.reserved` (default 0, NOT NULL).

### 6.2 Bước 2 — Backfill orders (DML)

```sql
UPDATE orders SET
  payment_status = CASE
    WHEN paid_amount = 0 THEN 'unpaid'
    WHEN paid_amount < total THEN 'partial'
    ELSE 'paid'
  END,
  fulfillment_status = CASE status
    WHEN 'pending'    THEN 'pending'
    WHEN 'paid'       THEN 'pending'
    WHEN 'preparing'  THEN 'pending'
    WHEN 'shipping'   THEN 'stock_out'
    WHEN 'delivered'  THEN CASE WHEN paid_amount >= total THEN 'completed' ELSE 'stock_out' END
    WHEN 'cancelled'  THEN 'cancelled'
  END,
  stock_out_at = CASE
    WHEN status IN ('shipping', 'delivered') THEN updated_at
    ELSE NULL
  END,
  completed_at = CASE
    WHEN status = 'delivered' AND paid_amount >= total THEN updated_at
    ELSE NULL
  END;
```

### 6.3 Bước 3 — Stock correction (DML)

Logic cũ trừ `on_hand` ngay khi tạo đơn. Với mô hình mới, đơn chưa xuất chỉ giữ `reserved`. Hồi tố:

**Giả định:** đơn `cancelled` ở hệ thống cũ đã hoàn stock khi hủy — nếu không, on_hand đang under-count phần đó. Implementation cần verify giả định này trước migration (xem code path hủy đơn hiện tại).


```sql
-- Set reserved = tổng qty của các đơn pending
UPDATE product_variants pv SET reserved = COALESCE((
  SELECT SUM(oi.quantity)
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.variant_id = pv.id AND o.fulfillment_status = 'pending'
), 0);

-- Hoàn on_hand cho các đơn pending (đã bị trừ theo logic cũ)
UPDATE product_variants pv SET on_hand = on_hand + COALESCE((
  SELECT SUM(oi.quantity)
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.variant_id = pv.id AND o.fulfillment_status = 'pending'
), 0);
```

### 6.4 Bước 4 — Finalize (DDL)

1. SET NOT NULL `orders.payment_status`, `orders.fulfillment_status`.
2. DROP `orders.status`, DROP enum `order_status`.
3. Update schema `order_status_history`: thay cột `status` bằng `payment_status` + `fulfillment_status`.
4. Add DB CHECK: `fulfillment_status = 'completed' ⇒ payment_status = 'paid'`, `on_hand >= 0`, `reserved >= 0`.

### 6.5 Verify (post-migration)

```sql
-- Không có on_hand âm
SELECT COUNT(*) FROM product_variants WHERE on_hand < 0; -- Expect 0

-- reserved đúng với pending orders
SELECT pv.id, pv.reserved, COALESCE(SUM(oi.quantity), 0) AS expected
FROM product_variants pv
LEFT JOIN order_items oi ON oi.variant_id = pv.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.fulfillment_status = 'pending'
GROUP BY pv.id, pv.reserved
HAVING pv.reserved != COALESCE(SUM(oi.quantity), 0); -- Expect empty
```

## 7. Thiết kế phục vụ migration tương lai (sang ledger C)

Để sau này khi mở rộng sang customer_ledger không phải backfill phức tạp, Spec 1 cần giữ các ràng buộc sau:

- **`stock_out_at` trên order là ngày phát sinh nợ** — đầy đủ timestamp để reconstruct ledger entries.
- **Mọi payment PHẢI gắn với 1 order** — không cho "trả tiền trước không gắn đơn" (ứng tiền). Nếu nhu cầu này phát sinh là lúc migrate sang C.
- **Không cho sửa `total` của đơn đã `stock_out`** — giữ được tính reconstruct được.
- **Không xóa cứng orders/payments** — soft delete nếu cần.

## 8. UI changes

### 8.1 `/orders` (list)

- Thay 1 filter status bằng 2: `Payment` và `Fulfillment`.
- 2 badge trên mỗi dòng:
  - Payment: 🔴 Chưa thanh toán / 🟡 Thanh toán một phần / 🟢 Đã thanh toán.
  - Fulfillment: ⚪ Chờ xử lý / 🔵 Đã xuất kho / ✅ Hoàn tất / ⛔ Đã hủy.
- Thêm preset filter "🔴 Công nợ": `fulfillment_status = 'stock_out' AND payment_status != 'paid'`.

### 8.2 `/orders/[id]` (detail)

- Hiển thị 2 badge thay cho 1.
- Action buttons theo state:
  - `pending`: [Xuất kho] [Hủy đơn] [Ghi nhận thanh toán].
  - `stock_out` & `!paid`: [Ghi nhận thanh toán] (không có nút hoàn tất).
  - `stock_out` & `paid`: [Hoàn tất đơn] (enable).
  - `completed` / `cancelled`: read-only.
- Panel `paid_amount / total` với progress bar.
- Timeline đọc từ `order_status_history` (schema đã đổi, xem 3.4) và `payments`, hiển thị theo 2 chiều status mới.

### 8.3 `/orders/new` (form tạo đơn)

- Mỗi item hiển thị `available = on_hand - reserved`, không phải `stock_quantity`.
- `available < qty` → cảnh báo vàng "Sắp thiếu hàng, cần nhập thêm X cái" nhưng vẫn cho submit.
- Giữ logic auto-tạo supplier order hiện tại.

### 8.4 `/debts` (mới)

Bảng tổng hợp công nợ theo khách:

| Khách hàng | Số đơn nợ | Tổng nợ | Đơn cũ nhất | Số ngày nợ | Thao tác |
|---|---|---|---|---|---|
| Nguyễn A | 3 | 2.500.000 | 2026-03-15 | 36 | [Xem chi tiết] [Thu tiền] |

Query:

```sql
SELECT
  customer_id,
  COUNT(*) AS unpaid_orders,
  SUM(total - paid_amount) AS debt,
  MIN(stock_out_at) AS oldest_debt_date
FROM orders
WHERE fulfillment_status = 'stock_out' AND payment_status != 'paid'
GROUP BY customer_id
ORDER BY oldest_debt_date ASC;
```

- Sort mặc định: số ngày nợ giảm dần.
- Search theo tên/SĐT khách.
- Filter nhanh: nợ > 30 ngày / > 60 ngày / > 90 ngày.

### 8.5 `/debts/[customerId]` (mới)

- Header: tổng nợ, số đơn nợ, tổng đã mua, tổng đã thu.
- Tab "Đơn đang nợ": các đơn `stock_out` chưa `paid` của khách này.
- Tab "Lịch sử thanh toán": từ `payments` của các đơn của khách này.
- Tab "Tất cả đơn": tất cả đơn của khách.
- Action [Thu tiền]: modal cho phép thu cho 1 hoặc nhiều đơn cùng lúc, mặc định FIFO theo `stock_out_at`.

### 8.6 `/products` và trang chi tiết sản phẩm (minor)

- Cột tồn kho hiển thị: `{on_hand} (còn bán được: {available})`.
- `available < 0`: highlight đỏ.

## 9. Edge cases

- **Đơn nhiều item, 1 item thiếu stock:** xuất kho all-or-nothing, chặn toàn đơn nếu 1 item thiếu. (Logic `ship_available_first` hiện có sẽ được review ở Spec 2 khi có `return_order`.)
- **Ghi payment khi đơn `cancelled`:** cấm (server-side guard).
- **Ghi payment khi đơn `completed`:** cấm (đã `paid` đủ).
- **Sửa đơn khi `pending`:** cho sửa items/qty, phải atomic: hoàn `reserved` cũ + set `reserved` mới.
- **Sửa đơn khi `stock_out`/`completed`:** cấm (server-side guard). Spec 2 sẽ cung cấp `return_order`.
- **Khách chưa có đơn:** không xuất hiện trên `/debts`.
- **Idempotency:** reuse key pattern hiện có cho các action "Xuất kho", "Hoàn tất", "Hủy đơn".

## 10. Thành công

Spec 1 hoàn thành khi:

- [ ] Migration chạy thành công trên staging với dữ liệu thực tế, verify script pass.
- [ ] Tạo đơn mới → `reserved` tăng, `on_hand` không đổi.
- [ ] Xuất kho → `on_hand` trừ, `reserved` trừ, `stock_out_at` được set, chặn nếu `on_hand < qty`.
- [ ] Ghi payment → `payment_status` update đúng theo tỉ lệ `paid_amount / total`.
- [ ] Hoàn tất đơn chỉ khả dụng khi đủ điều kiện (`stock_out` + `paid`).
- [ ] Trang `/debts` hiển thị đúng danh sách khách còn nợ, filter/search hoạt động.
- [ ] Trang `/debts/[customerId]` hiển thị đủ đơn nợ + lịch sử payment.
- [ ] Trang sản phẩm hiển thị `on_hand` + `available`.
- [ ] Không có regression ở các flow hiện có (tạo đơn, ghi payment, auto supplier order).
- [ ] Unit test cover state machine transitions: các ràng buộc `on_hand >= qty` ở `stock_out`, `paid` ở `completed`, cấm `stock_out → cancelled`, cấm sửa đơn sau `stock_out`.
