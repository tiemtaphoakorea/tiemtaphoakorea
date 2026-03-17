---
id: SPEC-012
type: spec
status: approved
project: Auth Shop Platform
owner: "@team"
tags: [feature-spec]
linked-to: [[PRD-AuthShopPlatform]]
created: 2026-01-28
updated: 2026-01-30
---

# Spec: Customer Catalog

## Related Epics

- [[Epic-04-CustomerPage]]


## Module Notes

### Module 4: Trang Khách Hàng (Customer Catalog - View Only)

**Mục tiêu**: Public website để khách hàng xem sản phẩm, giá cả và tình trạng hàng. **Không cần đăng nhập.**

---

#### 1. Tính Năng (Features)

- **4.1 Product Catalog**:
  - Grid danh sách sản phẩm.
  - Hiển thị giá Retail.
- **4.2 Product Detail**:
  - Chọn Variant (Màu/Size) để xem giá và ảnh tương ứng.
  - Hiển thị trạng thái kho: "Còn hàng" / "Hết hàng" / "Đặt trước".
- **4.3 Search & Filter**: Tìm theo tên, danh mục, khoảng giá.

---

#### 2. Thiết Kế (Design)

##### UI Components

- **CatalogGrid**: Responsive grid. Card sản phẩm premium design (hover effects).
- **ProductFilter**: Sidebar hoặc Topbar filters.
- **ProductDetail**: Gallery ảnh (Slide), Info, Related Products.

---

#### 3. Luồng Logic (Logic Flow)

##### 3.1 Price & Availability Visibility

- Client check `stock_quantity` của variant.
- Nếu `stock > 0`: Show "Sẵn sàng giao".
- Nếu `stock <= 0` AND type = `pre_order`: Show "Đặt hàng (7-10 ngày)".
- Nếu `stock <= 0` AND type = `in_stock`: Show "Tạm hết hàng".

---

#### 4. Dữ Liệu (Schema Requirements)

##### Tables

- Read-only access to `products`, `product_variants`, `variant_images`, `categories`.
- **Security**: Public Access (RLS policy cho phép `anon` role select các bảng này).
