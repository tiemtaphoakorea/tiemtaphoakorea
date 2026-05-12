# Debug Report: Không tạo được đơn hàng âm

**Date:** 2026-05-08 | **Branch:** dev | **Team:** debug-negative-orders

---

## Root Cause (CONFIRMED — 3/3 debuggers)

Có **2 lớp chặn** độc lập, cả frontend lẫn backend đều reject qty âm:

### Lớp 1 — Frontend (5 điểm chặn)

| File | Dòng | Cơ chế |
|------|------|--------|
| `packages/ui/src/components/number-input.tsx` | 33-40, 58-65 | Default `allowNegative=false`; min clamp tự động |
| `apps/admin/components/admin/orders/create/order-items-table.tsx` (order-cart-row.tsx) | ~76, 84, 86-90 | `min={1}`, `disabled={qty<=1}`, guard `floatValue > 0` |
| `apps/admin/components/admin/orders/create/order-items-table.tsx` (order-cart-card.tsx mobile) | ~75, 83, 85-89 | Giống desktop |
| `apps/admin/components/admin/orders/create/paste-skus-dialog.tsx` | 58-63 | Clamp `qty > 0 ? qty : 1` — paste âm → 1 silently |
| `apps/admin/components/admin/orders/create/order-builder.tsx` | 250 | Initial qty luôn = 1 |

### Lớp 2 — Backend API (smoking gun)

```ts
// apps/admin/app/api/admin/orders/route.ts:108-114
const validItems = items.every((item: any) => Number(item?.quantity ?? 0) > 0);
if (!validItems)
  return NextResponse.json({ error: "Quantity must be greater than 0" }, { status: 400 });
```

Đây là cổng duy nhất ở phía server trước mọi DB call. Frontend bypass (devtools) vẫn bị chặn ở đây.

---

## Hypothesis Verdicts

| Hypothesis | Kết quả | Ghi chú |
|-----------|---------|---------|
| **Frontend validation** | ✅ CONFIRMED (HIGH) | 5 lớp độc lập |
| **Backend API validation** | ✅ CONFIRMED (HIGH) | route.ts:108 là gate duy nhất |
| **Inventory stock check** | ❌ DISPROVED | Inventory permissive by design; cho phép backorder, không throw lỗi qty âm |

---

## Phát hiện thêm (HIGH severity)

1. **PUT /api/admin/orders/[id] (edit endpoint) KHÔNG có guard** — qty âm có thể đi qua edit flow.
2. **Không có Zod schema** cho bất kỳ orders route nào (grep "from zod" trong api/admin/orders/**→ 0 kết quả).
3. **Không có DB CHECK constraint** trên `order_items.quantity`, `orders.total`, `orders.subtotal`, `orders.discount`.
4. **`inventory_movements.quantity` là signed integer by design** (line 427 order.server.ts: `quantity: -item.quantity`) — inventory layer hiểu negative movement.
5. **`order.server.ts:531`** comment: `return_order (not yet available)` — roadmap đã có return_order entity.
6. **`shippingFee`** bị silently clamp về 0 (`Math.max`), không reject — inconsistent với qty check.
7. **Shared Zod** `packages/shared/src/schemas/index.ts:93` có `z.number().int().positive()` nhưng là cho `supplierOrderAddSchema` (đơn nhập), KHÔNG phải customer orders.

---

## Khuyến nghị

### Nếu "đơn hàng âm" = return/refund/credit-note flow

**Không** chỉ gỡ guard route.ts:108. Downstream sẽ vỡ:
- `reserved` + `(-N)` vi phạm `reserved_non_negative` CHECK constraint mid-transaction
- `subtotal / profit / supplier-order auto-creation` đều assume qty > 0
- Payment logic chưa xử lý negative total

→ Implement `return_order` entity riêng (đã có trong roadmap), align với `order.server.ts:531`.

### Nếu vẫn muốn reuse `orders` với qty âm (quick path)

Cần gỡ guard tại **4 layer** theo thứ tự:
1. `number-input.tsx`: thêm `allowNegative={true}` prop tại order quantity/price inputs
2. `order-cart-row.tsx` + `order-cart-card.tsx`: bỏ `min={1}`, `disabled={qty<=1}`, guard `floatValue > 0`
3. `paste-skus-dialog.tsx:58-63`: bỏ clamp `qty > 0 ? qty : 1`
4. `route.ts:108-114`: đổi `> 0` thành `!== 0` (vẫn reject qty = 0)

Và cần redesign:
- `createOrder` service: xử lý negative qty (không tạo supplier order, trừ reserved đúng chiều)
- `updateOrderItems`: thêm guard tương đương
- DB CHECK: thêm `quantity != 0` thay vì giả sử dương

---

## Unresolved Questions

1. **Business intent**: "đơn hàng âm" là refund, credit note, return, hay điều chỉnh sai sót? Mỗi loại cần flow khác nhau.
2. **Return order roadmap**: `return_order` entity (order.server.ts:531) đã được plan chưa? Nên ưu tiên cái đó thay vì patch qty âm vào orders?
3. **Edit endpoint gap**: Có cần vá PUT /orders/[id] không (hiện đang open với qty âm nếu bypass FE)?
4. **discount > subtotal**: Có cho phép total âm qua discount không? Hiện chưa có guard.
