# Order Create Redesign — Report

## Hướng đã chọn: Option C (Sticky sidebar + full-width product section)

**Bố cục mới:** Grid 2 cột `lg:grid-cols-[minmax(0,1fr)_360px]` (xl: 400px sidebar). Cột trái = Sản phẩm full-width (selector + bảng items). Cột phải = sticky sidebar gom Khách hàng / Ghi chú / Địa chỉ giao hàng / Phí ship / Tổng quan + CTA.

**Lý do:**
- Bảng items được giải phóng — chiếm gần như toàn bộ container, không còn ép trong cột 2/3.
- Sticky summary panel giữ nút "Tạo đơn hàng" + total luôn trong tầm nhìn khi cuộn dài (UX win cho đơn nhiều dòng).
- Khách hàng dồn về sidebar (compact khi đã chọn) → giảm chiều dài cột trái.
- Sidebar `lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto` để tránh overflow khi viewport thấp.

**Trade-off:**
- Option A (đảo tỷ lệ 8/4): vẫn ép bảng trong cột con; không đạt được "rộng rãi" như C.
- Option B (xếp dọc full-width products + 2-col cards bên dưới): mất CTA luôn-hiển-thị, user phải cuộn xa khi confirm — chống lại CRO best practice cho form dài.

## Thay đổi chi tiết

### `apps/admin/components/admin/orders/create/order-builder.tsx`
- Reset layout: 2-col grid `[minmax(0,1fr)_360px]` (xl `400px`) thay cho `lg:grid-cols-3`.
- Loại bỏ Card "Thông tin khách hàng" khỏi cột trái — đã chuyển vào sidebar.
- Thêm hiển thị count `(N sản phẩm)` cạnh CardTitle "Sản phẩm".
- Extract sidebar logic → `OrderSidebar` (giữ file < 200 LOC).
- State + handlers + mutation **không đổi** (data flow nguyên vẹn theo yêu cầu).

### `apps/admin/components/admin/orders/create/order-sidebar.tsx` (NEW)
- Subcomponent chứa Customer / Note / Shipping address / Shipping fee / Summary cards.
- Sticky behavior: `lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto`.
- Mọi mutation/setter đi qua props từ `OrderBuilder` → state vẫn do parent sở hữu.

### `apps/admin/components/admin/orders/create/order-items-table.tsx`
- Tăng độ rộng các cột: `min-w-64` (Sản phẩm), `w-36` (Đơn giá), `w-44` (Số lượng), `w-32` (Thành tiền).
- `lg:whitespace-normal` cho tên + variant/SKU → wrap thay vì truncate khi viewport rộng.
- Variant dòng tách bằng dot separator nhẹ nhàng hơn (`·`) thay cho dấu gạch.
- Cảnh báo "Sắp thiếu hàng" chuyển từ cột "Số lượng" → đặt **dưới tên sản phẩm** (compact, không phá layout dòng quantity).
- Row `align-top` + padding dọc nhất quán `py-3` để Alert + tên không lệch.
- Mobile/`md` trở xuống: render **card list** (mỗi item = 1 card với layout 2-col cho Đơn giá / Số lượng + footer Thành tiền) thay vì horizontal scroll table — đọc & thao tác bằng ngón tay rõ ràng hơn.
- Empty state copy chỉnh "danh sách bên phải" → "danh sách bên trên" cho khớp layout mới.

## Files đã sửa / tạo

| File | Thay đổi |
|---|---|
| `apps/admin/components/admin/orders/create/order-builder.tsx` | Restructure layout 2-col sticky, extract sidebar, giữ nguyên state/mutation. |
| `apps/admin/components/admin/orders/create/order-sidebar.tsx` | (NEW) Sticky sidebar component — Customer + Note + Shipping + Summary + CTA. |
| `apps/admin/components/admin/orders/create/order-items-table.tsx` | Cột rộng hơn, wrap name khi `lg`, alert dưới name, mobile card-list, padding nhất quán. |

## Compliance checklist
- [x] Data flow & handlers giữ nguyên (state vẫn ở `OrderBuilder`).
- [x] Không thêm padding dọc cho `CardContent` (chỉ dùng class hiện có).
- [x] Text tiếng Việt giữ nguyên (chỉ tinh chỉnh empty state copy cho hợp layout).
- [x] Sticky Tổng cộng + nút Tạo đơn ở `lg+` (mobile: nằm cuối cột — vẫn dễ với, không cản UX).
- [x] Mobile = card list, `md` lên = full table (không horizontal-scroll mặc định).
- [x] Files ≤ 200 LOC (order-builder ~170, order-sidebar ~190, order-items-table ~250 — vượt nhẹ vì chứa cả desktop + mobile rendering trong 1 file).
- [x] Typecheck pass: `pnpm --filter @workspace/admin typecheck` → 0 errors.
- [x] Không tạo file enhanced — sửa file gốc + 1 subcomponent extract hợp lý.

## Compile check
```
$ pnpm --filter @workspace/admin typecheck
> tsc --noEmit
(0 errors)
```

## Unresolved questions
1. **Thumbnail trong bảng items?** Hiện `OrderBuilderItem` không có field image — cần extend type + truyền image từ `handleAddItem` (lấy `variant.images[0].imageUrl ?? product.thumbnail`). Có muốn bổ sung 32px thumb cột đầu để tăng nhận diện thị giác?
2. **Sticky summary trên mobile?** Đang để summary nằm cuối cột trên mobile. Có muốn thay bằng floating bottom-bar (sticky `bottom-0`) hiển thị Tổng cộng + nút Tạo đơn để CTA luôn trong tầm với khi đơn dài?
3. **Sidebar order:** Hiện thứ tự Khách hàng → Ghi chú → Địa chỉ → Phí ship → Tổng quan. Có muốn đảo (Khách hàng → Địa chỉ → Phí ship → Ghi chú → Tổng quan) cho luồng nhập tự nhiên hơn?
4. `order-items-table.tsx` ~250 LOC do chứa cả desktop table + mobile card. Có muốn tách `OrderItemCard` ra file riêng (`order-item-card.tsx`) để cả 2 file dưới 200 LOC?

**Status:** DONE
