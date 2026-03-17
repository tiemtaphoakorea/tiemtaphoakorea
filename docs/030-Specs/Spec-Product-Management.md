---
id: SPEC-011
type: spec
status: approved
project: Auth Shop Platform
owner: "@team"
tags: [feature-spec]
linked-to: [[PRD-AuthShopPlatform]]
created: 2026-01-28
updated: 2026-01-30
---

# Spec: Product Management

## Related Epics

- [[Epic-03-ProductManagement]]


## Module Notes

### Module 3: Quản Lý Sản Phẩm (Product Management)

**Mục tiêu**: Quản lý Catalog, Biến thể (Variants), Giá vốn/Giá bán và Tồn kho.

---

#### 1. Tính Năng (Features)

- **3.1 Categories**: Quản lý danh mục đa cấp (nếu cần) hoặc đơn cấp.
- **3.2 Products & Variants**:
  - Tạo sản phẩm cha (VD: Áo Thun Basic).
  - Tạo các biến thể (VD: Màu Đỏ/Size M, Màu Đen/Size L).
  - Upload ảnh cho từng biến thể.
- **3.3 Pricing**:
  - Giá bán (Price): Giá niêm yết.
  - Giá vốn (Cost Price): Giá nhập (ẩn với Staff nếu cần, nhưng thường Staff cần biết để tư vấn sỉ).
  - Giá sỉ (Wholesale Price): Logic tính giá sỉ (Discount manual hoặc bảng giá riêng).
- **3.4 Inventory**:
  - Quản lý số lượng tồn kho theo từng variant.
  - Cảnh báo tồn kho thấp (Low stock alert).

---

#### 2. Thiết Kế (Design)

##### UI Components

- **ProductList**: Table filterable, sortable, thumbnails.
- **ProductForm** (Complex):
  - Tab 1: Info chung (Name, Category, Description).
  - Tab 2: Variants Matrix (Bảng nhập nhanh SKU, Price, Stock cho nhiều variants).
  - Tab 3: Images (Drag & drop upload).

---

#### 3. Luồng Logic (Logic Flow)

##### 3.1 Variant Generation

- User chọn Options (Color: [Red, Blue], Size: [S, M]).
- Hệ thống generate ra Cartesian Product: Red-S, Red-M, Blue-S, Blue-M.
- Auto-generate SKU: `PROD-RED-S`.

##### 3.2 Inventory Update

- Khi Order Created -> Giảm `stock_quantity`.
- Nếu Order Cancelled -> Tăng lại `stock_quantity`.
- Nhập hàng (Import) -> Tăng `stock_quantity`, cập nhật `cost_price` (Tính trung bình giá vốn - Weighted Average Cost nếu cần, hoặc LIFO/FIFO - MVP dùng Moving Average).

---

#### 4. Dữ Liệu (Schema Requirements)

##### Tables

- **`products`**: Thông tin chung.
- **`product_variants`**:
  - `sku` (Unique).
  - `price`, `cost_price`.
  - `stock_quantity`.
  - `stock_type`: `in_stock` / `pre_order` (để bán hàng ngay cả khi kho = 0).
- **`variant_images`**: Link ảnh Supabase Storage.


## Feature Details

### F02: Quản lý Sản phẩm

**Module:** Product Management  
**Phiên bản:** 1.0 | **Ngày:** 30/12/2024

---

#### 1. Tổng quan

##### 1.1 Mục đích

Module Quản lý Sản phẩm cho phép Admin tạo, chỉnh sửa, và quản lý danh mục sản phẩm với hỗ trợ nhiều biến thể, hình ảnh, tồn kho và giá nhập.

##### 1.2 Đặc điểm chính

- Sản phẩm có nhiều biến thể (size, màu, dung tích...)
- Mỗi biến thể có SKU, giá bán, giá nhập, tồn kho riêng
- Phân loại theo danh mục (hỗ trợ cây danh mục)
- Hai loại tồn kho: có sẵn (in_stock) và order từ NCC (pre_order)
- Track lịch sử thay đổi giá nhập

---

#### 2. User Stories

| ID | User Story | Priority |
|----|------------|----------|
| PROD-01 | Là Admin, tôi muốn xem danh sách sản phẩm với tìm kiếm và lọc để quản lý dễ dàng | Must |
| PROD-02 | Là Admin, tôi muốn tạo sản phẩm mới với thông tin cơ bản | Must |
| PROD-03 | Là Admin, tôi muốn thêm biến thể cho sản phẩm với giá và tồn kho riêng | Must |
| PROD-04 | Là Admin, tôi muốn upload nhiều hình ảnh cho mỗi biến thể | Must |
| PROD-05 | Là Admin, tôi muốn nhập giá nhập cho từng biến thể để tính lợi nhuận | Must |
| PROD-06 | Là Admin, tôi muốn đánh dấu biến thể là "cần order từ NCC" | Must |
| PROD-07 | Là Admin, tôi muốn ẩn/xóa sản phẩm không còn kinh doanh | Must |
| PROD-08 | Là Admin, tôi muốn xem cảnh báo sản phẩm sắp hết hàng | Should |
| PROD-09 | Là Admin, tôi muốn quản lý danh mục sản phẩm | Should |
| PROD-10 | Là Customer, tôi muốn xem catalog sản phẩm đang kinh doanh | Must |

---

#### 3. Quy trình nghiệp vụ

##### 3.1 Quy trình Tạo Sản phẩm

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CREATE PRODUCT FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │  Admin mở    │────►│  Nhập thông  │────►│  Thêm biến   │────►│  Upload      │
  │  form tạo SP │     │  tin cơ bản  │     │  thể (nếu có)│     │  hình ảnh    │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                        │
                    ┌───────────────────────────────────────────────────┘
                    │
         ┌──────────▼──────────┐     ┌──────────────┐     ┌──────────────┐
         │  Nhập giá bán,      │────►│  Chọn loại   │────►│    Lưu       │
         │  giá nhập, tồn kho  │     │  tồn kho     │     │   sản phẩm   │
         └─────────────────────┘     └──────────────┘     └──────────────┘

Thông tin cơ bản:
- Tên sản phẩm
- Mô tả
- Danh mục
- Giá tham khảo

Biến thể (mỗi biến thể có):
- Tên biến thể (VD: "Size M - Màu Đỏ")
- SKU (mã duy nhất)
- Giá bán
- Giá nhập (cost price)
- Số lượng tồn kho
- Loại tồn kho: in_stock / pre_order
- Hình ảnh
```

##### 3.2 Quy trình Cập nhật Giá nhập

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     UPDATE COST PRICE FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │  Admin mở    │────►│  Sửa giá     │────►│  Hệ thống    │────►│  Lưu lịch sử │
  │  chi tiết SP │     │  nhập mới    │     │  detect thay │     │  giá cũ      │
  └──────────────┘     └──────────────┘     │  đổi         │     └──────────────┘
                                            └──────────────┘

Lưu ý: Khi giá nhập thay đổi, trigger tự động lưu vào cost_price_history
       Giá nhập cũ vẫn áp dụng cho các đơn hàng đã tạo trước đó
```

##### 3.3 Quy trình Quản lý Tồn kho

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INVENTORY MANAGEMENT                                    │
└─────────────────────────────────────────────────────────────────────────────┘

  IN_STOCK (Hàng có sẵn):
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │  Nhập hàng   │────►│  stock_qty   │────►│  Bán hàng    │
  │  (+)         │     │  hiện tại    │     │  (-)         │
  └──────────────┘     └──────────────┘     └──────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  stock < threshold│──► Cảnh báo hết hàng
                    └──────────────────┘

  PRE_ORDER (Hàng order từ NCC):
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │  Khách đặt   │────►│  Tạo supplier│────►│  NCC giao    │
  │  hàng        │     │  order       │     │  hàng về     │
  └──────────────┘     └──────────────┘     └──────────────┘
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │  Cập nhật giá    │
                                          │  nhập thực tế    │
                                          └──────────────────┘
```

---

#### 4. Thiết kế UI

##### 4.1 Danh sách Sản phẩm

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🏪 Admin Portal                                    👤 Admin ▼              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Dashboard | Sản phẩm | Khách hàng | Đơn hàng | Chat | Báo cáo              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Quản lý Sản phẩm                                    [+ Thêm sản phẩm]     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🔍 Tìm kiếm...          │ Danh mục ▼ │ Trạng thái ▼ │ Tồn kho ▼    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ □ │ Hình  │ Tên sản phẩm      │ SKU    │ Giá bán  │ Tồn kho│ TT   │   │
│  ├───┼───────┼───────────────────┼────────┼──────────┼────────┼──────┤   │
│  │ □ │ [img] │ Kem dưỡng ABC     │        │          │        │      │   │
│  │   │       │ ├─ Size 30ml      │ ABC-30 │ 350,000₫ │ 25     │ ✅   │   │
│  │   │       │ └─ Size 50ml      │ ABC-50 │ 550,000₫ │ 12     │ ✅   │   │
│  ├───┼───────┼───────────────────┼────────┼──────────┼────────┼──────┤   │
│  │ □ │ [img] │ Son môi XYZ       │        │          │        │      │   │
│  │   │       │ ├─ Màu đỏ         │ XYZ-R  │ 280,000₫ │ 3 ⚠️  │ ✅   │   │
│  │   │       │ ├─ Màu hồng       │ XYZ-P  │ 280,000₫ │ 0 ❌  │ ✅   │   │
│  │   │       │ └─ Màu cam        │ XYZ-O  │ 280,000₫ │ 8      │ ✅   │   │
│  ├───┼───────┼───────────────────┼────────┼──────────┼────────┼──────┤   │
│  │ □ │ [img] │ Nước hoa DEF      │ DEF-01 │ 1,200,000│ --     │ 📦   │   │
│  │   │       │ (Order từ NCC)    │        │          │        │      │   │
│  └───┴───────┴───────────────────┴────────┴──────────┴────────┴──────┘   │
│                                                                             │
│  ⚠️ Sắp hết    ❌ Hết hàng    📦 Pre-order                                  │
│                                                                             │
│  Hiển thị 1-10 của 156 sản phẩm                    < 1 2 3 ... 16 >        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

##### 4.2 Form Tạo/Sửa Sản phẩm

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Thêm sản phẩm mới                                            [X]          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Thông tin cơ bản ──────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Tên sản phẩm *                                                     │   │
│  │  ┌────────────────────────────────────────────────────────────┐     │   │
│  │  │ Kem dưỡng ẩm ABC                                           │     │   │
│  │  └────────────────────────────────────────────────────────────┘     │   │
│  │                                                                      │   │
│  │  Mô tả                                                              │   │
│  │  ┌────────────────────────────────────────────────────────────┐     │   │
│  │  │ Kem dưỡng ẩm cao cấp, chiết xuất từ...                     │     │   │
│  │  │                                                            │     │   │
│  │  └────────────────────────────────────────────────────────────┘     │   │
│  │                                                                      │   │
│  │  Danh mục                    Giá tham khảo                          │   │
│  │  ┌──────────────────┐        ┌──────────────────┐                   │   │
│  │  │ Chăm sóc da    ▼ │        │ 350,000 ₫        │                   │   │
│  │  └──────────────────┘        └──────────────────┘                   │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─ Biến thể ──────────────────────────────────────────────────────────┐   │
│  │                                                          [+ Thêm]   │   │
│  │                                                                      │   │
│  │  ┌─ Biến thể 1 ─────────────────────────────────────────── [🗑️] ─┐  │   │
│  │  │                                                                │  │   │
│  │  │  Tên biến thể *          SKU *                                │  │   │
│  │  │  ┌──────────────────┐    ┌──────────────────┐                 │  │   │
│  │  │  │ Size 30ml        │    │ ABC-30           │                 │  │   │
│  │  │  └──────────────────┘    └──────────────────┘                 │  │   │
│  │  │                                                                │  │   │
│  │  │  Giá bán *          Giá nhập            Tồn kho               │  │   │
│  │  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │  │   │
│  │  │  │ 350,000 ₫    │   │ 180,000 ₫    │   │ 25           │       │  │   │
│  │  │  └──────────────┘   └──────────────┘   └──────────────┘       │  │   │
│  │  │                                                                │  │   │
│  │  │  Loại tồn kho:  ◉ Có sẵn    ○ Order từ NCC                    │  │   │
│  │  │                                                                │  │   │
│  │  │  Hình ảnh:                                                     │  │   │
│  │  │  ┌────┐ ┌────┐ ┌────────┐                                     │  │   │
│  │  │  │img1│ │img2│ │+ Upload│                                     │  │   │
│  │  │  └────┘ └────┘ └────────┘                                     │  │   │
│  │  │                                                                │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  │  ┌─ Biến thể 2 ─────────────────────────────────────────── [🗑️] ─┐  │   │
│  │  │  ...                                                           │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                                          [Hủy]  [Lưu sản phẩm]             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

##### 4.3 Customer Catalog View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🛍️ Shop Name                              🔍    💬    👤 KH001 ▼          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Danh mục: [Tất cả ▼]        Sắp xếp: [Mới nhất ▼]                         │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │             │  │             │  │             │  │             │        │
│  │   [Image]   │  │   [Image]   │  │   [Image]   │  │   [Image]   │        │
│  │             │  │             │  │             │  │             │        │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤        │
│  │ Kem dưỡng   │  │ Son môi     │  │ Nước hoa    │  │ Sữa rửa mặt │        │
│  │ ABC         │  │ XYZ         │  │ DEF         │  │ GHI         │        │
│  │             │  │             │  │             │  │             │        │
│  │ 350,000₫    │  │ 280,000₫    │  │ 1,200,000₫  │  │ 150,000₫    │        │
│  │ ✅ Còn hàng │  │ ✅ Còn hàng │  │ 📦 Đặt trước│  │ ✅ Còn hàng │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    ...      │  │    ...      │  │    ...      │  │    ...      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│                            < 1 2 3 ... >                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

#### 5. Logic xử lý

##### 5.1 Lấy danh sách Sản phẩm (Admin)

```typescript
// app/models/product.server.ts

interface ProductFilters {
  search?: string;
  categoryId?: string;
  status?: "active" | "inactive";
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock" | "pre_order";
  page?: number;
  limit?: number;
}

export async function getProducts(supabase: SupabaseClient, filters: ProductFilters) {
  const { 
    search, 
    categoryId, 
    status, 
    stockStatus, 
    page = 1, 
    limit = 20 
  } = filters;
  
  let query = supabase
    .from("products")
    .select(`
      *,
      category:categories(id, name),
      variants:product_variants(
        *,
        images:variant_images(*)
      )
    `, { count: "exact" });
  
  // Apply filters
  if (search) {
    query = query.or(`name.ilike.%${search}%,variants.sku.ilike.%${search}%`);
  }
  
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  
  if (status === "active") {
    query = query.eq("is_active", true);
  } else if (status === "inactive") {
    query = query.eq("is_active", false);
  }
  
  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to).order("created_at", { ascending: false });
  
  const { data, error, count } = await query;
  
  if (error) throw error;
  
  // Post-process for stock status filter (need to check variants)
  let products = data || [];
  
  if (stockStatus) {
    products = products.filter(product => {
      const hasMatchingVariant = product.variants?.some(v => {
        if (stockStatus === "pre_order") return v.stock_type === "pre_order";
        if (stockStatus === "out_of_stock") return v.stock_quantity === 0 && v.stock_type === "in_stock";
        if (stockStatus === "low_stock") return v.stock_quantity > 0 && v.stock_quantity <= v.low_stock_threshold;
        if (stockStatus === "in_stock") return v.stock_quantity > v.low_stock_threshold;
        return true;
      });
      return hasMatchingVariant;
    });
  }
  
  return {
    products,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}
```

##### 5.2 Tạo Sản phẩm

```typescript
// app/models/product.server.ts

interface CreateProductInput {
  name: string;
  description?: string;
  categoryId?: string;
  basePrice?: number;
  variants: Array<{
    name: string;
    sku: string;
    price: number;
    costPrice?: number;
    stockQuantity?: number;
    stockType: "in_stock" | "pre_order";
    images?: string[]; // URLs from Supabase Storage
  }>;
}

export async function createProduct(supabase: SupabaseClient, input: CreateProductInput) {
  const slug = generateSlug(input.name);
  
  // Check SKU uniqueness
  for (const variant of input.variants) {
    const { data: existingSku } = await supabase
      .from("product_variants")
      .select("id")
      .eq("sku", variant.sku)
      .single();
    
    if (existingSku) {
      throw new Error(`SKU "${variant.sku}" đã tồn tại`);
    }
  }
  
  // Create product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name: input.name,
      slug,
      description: input.description,
      category_id: input.categoryId,
      base_price: input.basePrice || 0,
    })
    .select()
    .single();
  
  if (productError) throw productError;
  
  // Create variants
  for (const variant of input.variants) {
    const { data: createdVariant, error: variantError } = await supabase
      .from("product_variants")
      .insert({
        product_id: product.id,
        name: variant.name,
        sku: variant.sku,
        price: variant.price,
        cost_price: variant.costPrice || 0,
        stock_quantity: variant.stockType === "in_stock" ? (variant.stockQuantity || 0) : 0,
        stock_type: variant.stockType,
      })
      .select()
      .single();
    
    if (variantError) throw variantError;
    
    // Log initial cost price
    if (variant.costPrice) {
      await supabase.from("cost_price_history").insert({
        variant_id: createdVariant.id,
        cost_price: variant.costPrice,
        note: "Giá nhập ban đầu",
      });
    }
    
    // Create variant images
    if (variant.images?.length) {
      const imageRecords = variant.images.map((url, index) => ({
        variant_id: createdVariant.id,
        image_url: url,
        display_order: index,
        is_primary: index === 0,
      }));
      
      await supabase.from("variant_images").insert(imageRecords);
    }
  }
  
  return product;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
```

##### 5.3 Upload hình ảnh

```typescript
// app/lib/storage.server.ts

export async function uploadProductImage(
  supabase: SupabaseClient,
  file: File,
  productId: string
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${productId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(data.path);
  
  return urlData.publicUrl;
}

export async function deleteProductImage(
  supabase: SupabaseClient,
  imageUrl: string
) {
  // Extract path from URL
  const path = imageUrl.split("/product-images/")[1];
  
  const { error } = await supabase.storage
    .from("product-images")
    .remove([path]);
  
  if (error) throw error;
}
```

##### 5.4 Lấy catalog (Customer)

```typescript
// app/models/product.server.ts

export async function getCatalog(
  supabase: SupabaseClient,
  options: {
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
) {
  const { categoryId, search, page = 1, limit = 12 } = options;
  
  let query = supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      base_price,
      variants:product_variants(
        id,
        name,
        sku,
        price,
        stock_quantity,
        stock_type,
        is_active,
        images:variant_images(image_url, is_primary)
      )
    `, { count: "exact" })
    .eq("is_active", true);
  
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  
  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);
  
  const { data, error, count } = await query;
  
  if (error) throw error;
  
  // Transform data for display
  const products = (data || []).map(product => {
    const activeVariants = product.variants?.filter(v => v.is_active) || [];
    const minPrice = Math.min(...activeVariants.map(v => v.price));
    const maxPrice = Math.max(...activeVariants.map(v => v.price));
    
    // Determine stock status
    const hasInStock = activeVariants.some(v => 
      v.stock_type === "in_stock" && v.stock_quantity > 0
    );
    const hasPreOrder = activeVariants.some(v => v.stock_type === "pre_order");
    
    let stockStatus: "in_stock" | "out_of_stock" | "pre_order";
    if (hasInStock) stockStatus = "in_stock";
    else if (hasPreOrder) stockStatus = "pre_order";
    else stockStatus = "out_of_stock";
    
    // Get primary image
    const primaryImage = activeVariants
      .flatMap(v => v.images || [])
      .find(img => img.is_primary)?.image_url;
    
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      priceRange: minPrice === maxPrice 
        ? formatCurrency(minPrice)
        : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`,
      stockStatus,
      image: primaryImage,
      variantCount: activeVariants.length,
    };
  });
  
  return {
    products,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}
```

---

#### 6. Validation Rules

##### 6.1 Product

| Field | Rule | Error Message |
|-------|------|---------------|
| name | Required, 1-255 chars | "Tên sản phẩm không được để trống" |
| slug | Auto-generated, unique | - |
| description | Optional, max 5000 chars | - |
| category_id | Optional, valid UUID | - |
| base_price | >= 0 | "Giá không hợp lệ" |

##### 6.2 Product Variant

| Field | Rule | Error Message |
|-------|------|---------------|
| name | Required, 1-255 chars | "Tên biến thể không được để trống" |
| sku | Required, unique, alphanumeric + dash | "SKU không hợp lệ hoặc đã tồn tại" |
| price | Required, >= 0 | "Giá bán phải >= 0" |
| cost_price | >= 0 | "Giá nhập phải >= 0" |
| stock_quantity | >= 0, integer | "Số lượng không hợp lệ" |
| stock_type | enum: in_stock, pre_order | - |

##### 6.3 Image Upload

| Rule | Value |
|------|-------|
| Max file size | 5MB |
| Allowed types | image/jpeg, image/png, image/webp |
| Max images per variant | 10 |

---

#### 7. Test Cases

##### 7.1 Create Product

| TC ID | Scenario | Input | Expected |
|-------|----------|-------|----------|
| PROD-TC01 | Happy path | Valid product with 2 variants | Product created successfully |
| PROD-TC02 | Duplicate SKU | SKU already exists | Error "SKU đã tồn tại" |
| PROD-TC03 | Missing name | Empty name | Validation error |
| PROD-TC04 | No variants | Product without variants | Error "Cần ít nhất 1 biến thể" |
| PROD-TC05 | Pre-order variant | stock_type = pre_order | stock_quantity ignored |

##### 7.2 Update Product

| TC ID | Scenario | Input | Expected |
|-------|----------|-------|----------|
| PROD-TC06 | Update name | New name | Slug also updated |
| PROD-TC07 | Change cost price | New cost_price | History record created |
| PROD-TC08 | Add variant | New variant to existing product | Variant added |
| PROD-TC09 | Delete variant | Remove 1 variant | Variant soft-deleted |

##### 7.3 Catalog View

| TC ID | Scenario | Input | Expected |
|-------|----------|-------|----------|
| PROD-TC10 | View catalog | Customer logged in | Only active products shown |
| PROD-TC11 | Filter by category | categoryId = X | Only products in category X |
| PROD-TC12 | Search | search = "kem" | Products with "kem" in name |
| PROD-TC13 | Mixed stock | Product has in_stock + pre_order variants | Show as "Còn hàng" |

---

#### 8. Business Rules

##### 8.1 SKU Rules

- Format: Alphanumeric + dash, uppercase
- Must be unique across all variants
- Cannot be changed after orders exist for this variant
- Example: ABC-30, ABC-50, XYZ-RED, XYZ-PINK

##### 8.2 Stock Rules

- **in_stock**: Physical inventory, quantity decreases when ordered
- **pre_order**: No physical inventory, creates supplier_order when ordered
- When stock reaches low_stock_threshold: Show warning in admin
- When stock = 0: Show "Hết hàng" to customer

##### 8.3 Pricing Rules

- cost_price is for internal calculation only, never shown to customer
- price can vary by variant
- base_price on product is for reference only
- profit = price - cost_price (calculated per order item)

##### 8.4 Image Rules

- First uploaded image is primary (shown in listings)
- Maximum 10 images per variant
- Images are shared across variants if needed
- Deleting product soft-deletes images (kept in storage for history)

---

**Lịch sử thay đổi:**

| Version | Ngày | Nội dung |
|---------|------|----------|
| 1.0 | 30/12/2024 | Khởi tạo tài liệu |
