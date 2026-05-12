# Debugger-1 Report: Frontend Validation Hypothesis

**Hypothesis:** Order creation UI ngăn negative quantities/amounts tại input hoặc form-validation layer.

**Verdict:** CONFIRMED — frontend chặn negative ở nhiều lớp, không phải nguyên nhân duy nhất nhưng là rào cản đầu tiên và đầy đủ nhất.

## Evidence FOR this hypothesis

### 1. NumberInput component chặn negative theo mặc định
File: `packages/ui/src/components/number-input.tsx`
- Line 24: `allowNegative = false` (default)
- Line 33-40: `isAllowed` reject mọi giá trị bắt đầu bằng `-` hoặc `floatValue < 0`:
  ```ts
  if (!allowNegative) {
    if (values.value === "-" || values.value.startsWith("-")) return false
    if (floatValue !== undefined && floatValue < 0) return false
  }
  ```
- Line 58-65: Nếu `floatValue < min`, clamp lên `min`.
- ⇒ Mọi NumberInput trong app, theo default, chặn nhập số âm cấp độ keystroke.

### 2. Order item rows hard-code `min={1}` cho quantity
File: `apps/admin/components/admin/orders/create/order-cart-row.tsx` (desktop)
- Line 84: `<NumberInput min={1} ... />` cho quantity input
- Line 76: `<Button disabled={item.quantity <= 1}>` — nút "−" bị disable khi qty ≤ 1
- Line 86-90: callback chỉ gọi `onUpdateQuantity` khi `floatValue > 0`:
  ```ts
  onValueChange={({ floatValue }) => {
    if (floatValue !== undefined && floatValue > 0) {
      onUpdateQuantity(item.variantId, floatValue);
    }
  }}
  ```

File: `apps/admin/components/admin/orders/create/order-cart-card.tsx` (mobile)
- Lines 75, 83, 86 — pattern y hệt: `disabled={item.quantity <= 1}`, `min={1}`, guard `floatValue > 0`.

### 3. Paste SKU dialog clamps negative thành 1
File: `apps/admin/components/admin/orders/create/paste-skus-dialog.tsx`
- Line 58-63:
  ```ts
  const qty = parts[1] ? Number.parseInt(parts[1], 10) : 1;
  lines.push({ ..., quantity: Number.isFinite(qty) && qty > 0 ? qty : 1 });
  ```
- ⇒ Nếu user paste `SKU-001,-5`, qty bị silently chuyển thành 1.

### 4. Initial quantity luôn ≥ 1
File: `apps/admin/components/admin/orders/create/order-builder.tsx`
- Line 250: `onAddItem={(v, p) => handleAddItem(v, p, 1)}` — mặc định qty = 1
- Line 135-149: `handleAddItem` mặc định param `quantity = 1`, không có path tạo qty âm.

### 5. Price input cũng chặn negative
- order-cart-row.tsx Line 50-58: NumberInput cho `Đơn giá` không có `allowNegative={true}` ⇒ default chặn âm.
- order-cart-card.tsx Line 59-67: tương tự.

## Evidence AGAINST this hypothesis

- `handleUpdateQuantity` ở order-builder.tsx (line 175-177) **không** validate giá trị; chỉ set thẳng vào state. Nếu một caller bỏ qua guard `floatValue > 0`, state có thể chứa giá trị âm. Nhưng tất cả caller hiện tại đều có guard.
- Không tìm thấy Zod schema nào ở client side cho order create form (form không dùng react-hook-form + zod). Validation hoàn toàn dựa vào component-level input constraints.

⇒ Không có bằng chứng phủ nhận: chuỗi chặn ở keystroke (NumberInput.isAllowed) → input min={1} clamp → guard `floatValue > 0` → initial qty=1 → paste clamp ≥ 1 là *kín và đầy đủ* trên UI.

## Evidence AGAINST other hypotheses

### Backend/API validation hypothesis — CO-EXISTING, không độc quyền
File: `apps/admin/app/api/admin/orders/route.ts`
- Line 108-114: backend cũng check `Number(item?.quantity ?? 0) > 0`, trả 400 "Quantity must be greater than 0".
- ⇒ Backend có validation, nhưng đây là defense-in-depth. Frontend đã chặn TRƯỚC nên user không bao giờ chạm tới rào này trong flow UI. Backend không phải nguyên nhân duy nhất.
- Không có Zod schema phía API; chỉ check thủ công duy nhất là `> 0`.

### Inventory stock check hypothesis — KHÔNG block negative orders
File: `packages/database/src/services/order.server.ts`
- Line 232: `if (available >= item.quantity) inStockItems.push(item) else preOrderItems.push(item)` — chỉ phân loại in-stock vs pre-order.
- Line 313-333: `quantityNeedsSupplier = Math.max(0, item.quantity - availableStock)` — nếu thiếu stock, hệ thống **tự tạo supplier order**, KHÔNG throw "Insufficient stock" trên createOrder path.
- ⇒ Inventory không liên quan đến block "đơn hàng âm". Nó chỉ kiểm `>=` (positive comparison); với qty âm, nó sẽ rơi vào nhánh `inStockItems` (vì available luôn ≥ qty âm) nhưng **negative qty đã bị chặn từ UI và backend route trước đó**, không lọt vào service này.

## Severity

**HIGH (root cause confirmed)** — Frontend layer là chặn chính. NumberInput chặn cấp keystroke (impossible to even type `-`); thêm `min={1}`, button disabled, paste clamp, và defaults `quantity=1`. Không có path UI nào cho phép submit qty < 1.

Nếu yêu cầu user là **"cho phép tạo đơn hàng âm"** (e.g. cho refund/credit-note flow), cần thay đổi ở 4 nơi:
1. `NumberInput allowNegative={true}` cho quantity & price inputs (order-cart-row, order-cart-card).
2. Bỏ `min={1}` trên quantity NumberInput (hoặc đặt `min` âm).
3. Bỏ `disabled={item.quantity <= 1}` trên minus button (hoặc đổi điều kiện).
4. Bỏ guard `floatValue > 0` trong `onValueChange` callback.
5. Bỏ clamp `qty > 0 ? qty : 1` trong `parseInput` của paste-skus-dialog.
6. **Đồng thời** sửa backend: route.ts line 108 (`> 0` check) + cân nhắc `order.server.ts` để xử lý negative qty đúng (stock movement reversal, reserved decrement thay vì increment, supplier order logic).

## Recommendation

Frontend là nguyên nhân chính khiến user không thể tạo "đơn hàng âm". Gỡ chặn frontend là CẦN NHƯNG CHƯA ĐỦ — backend route cũng chặn (line 108), và service layer (order.server.ts) chưa được thiết kế cho negative qty (phép gán `reserved += qty` với qty âm sẽ giảm reserved nhưng có thể tạo trạng thái không nhất quán; subtotal/total sẽ âm; supplier-order logic dùng `Math.max(0, ...)` nên ổn nhưng không tạo refund flow đúng nghĩa).

Nếu mục tiêu là **refund / negative invoice / credit note**, đề xuất một entity riêng (`return_orders` / `credit_notes`) thay vì cho phép qty âm trên `orders`. Hardening UI để mở qty âm chỉ là 1 phần nhỏ; ngữ nghĩa nghiệp vụ cần làm rõ.

## Unresolved questions

1. Yêu cầu thực sự của user là gì? "Đơn hàng âm" = refund? = credit note? = trả hàng? = điều chỉnh sai sót nhập liệu? Mỗi phương án dẫn tới schema/flow khác nhau.
2. Có entity sẵn cho returns/refunds chưa? (Thấy comment `return_order (not yet available)` ở order.server.ts line 511-531 — gợi ý hệ thống đã có roadmap cho return_order nhưng chưa implement.)
3. Nếu cho phép qty âm: xử lý `reserved` / `on_hand` / supplier orders / payment status thế nào? Cần thiết kế nghiệp vụ trước khi gỡ guard.
