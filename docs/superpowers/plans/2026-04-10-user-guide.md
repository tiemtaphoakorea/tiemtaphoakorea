# K-SMART User Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Mintlify documentation site in Vietnamese guiding K-SMART admin staff (Owner, Manager, Staff) through all features of the admin dashboard.

**Architecture:** Three-tab Mintlify site (`owner/`, `manager/`, `staff/`) under `docs/guide/`. Each tab contains role-specific MDX pages covering only the features accessible to that role. Content is Vietnamese; all file and folder names are English.

**Tech Stack:** Mintlify (MDX), Vietnamese content, deployed as a static site.

---

## File Map

| File | Purpose |
|------|---------|
| `docs/guide/mint.json` | Mintlify config — tabs, colors, navigation, logo |
| `docs/guide/owner/introduction.mdx` | Chủ shop: Giới thiệu và vai trò |
| `docs/guide/owner/dashboard.mdx` | Chủ shop: Dashboard & KPI |
| `docs/guide/owner/products.mdx` | Chủ shop: Quản lý sản phẩm |
| `docs/guide/owner/categories.mdx` | Chủ shop: Danh mục |
| `docs/guide/owner/orders.mdx` | Chủ shop: Đơn hàng |
| `docs/guide/owner/supplier-orders.mdx` | Chủ shop: Nhập hàng |
| `docs/guide/owner/suppliers.mdx` | Chủ shop: Nhà cung cấp |
| `docs/guide/owner/customers.mdx` | Chủ shop: Khách hàng |
| `docs/guide/owner/chat.mdx` | Chủ shop: Tin nhắn |
| `docs/guide/owner/analytics.mdx` | Chủ shop: Báo cáo & Phân tích |
| `docs/guide/owner/expenses.mdx` | Chủ shop: Chi phí (Owner only) |
| `docs/guide/owner/finance.mdx` | Chủ shop: Tài chính (Owner only) |
| `docs/guide/owner/users.mdx` | Chủ shop: Nhân sự (Owner only) |
| `docs/guide/manager/introduction.mdx` | Quản lý: Giới thiệu và vai trò |
| `docs/guide/manager/dashboard.mdx` | Quản lý: Dashboard & KPI |
| `docs/guide/manager/products.mdx` | Quản lý: Sản phẩm |
| `docs/guide/manager/categories.mdx` | Quản lý: Danh mục |
| `docs/guide/manager/orders.mdx` | Quản lý: Đơn hàng |
| `docs/guide/manager/supplier-orders.mdx` | Quản lý: Nhập hàng |
| `docs/guide/manager/suppliers.mdx` | Quản lý: Nhà cung cấp |
| `docs/guide/manager/customers.mdx` | Quản lý: Khách hàng |
| `docs/guide/manager/chat.mdx` | Quản lý: Tin nhắn |
| `docs/guide/manager/analytics.mdx` | Quản lý: Báo cáo & Phân tích |
| `docs/guide/staff/introduction.mdx` | Nhân viên: Giới thiệu và vai trò |
| `docs/guide/staff/dashboard.mdx` | Nhân viên: Dashboard |
| `docs/guide/staff/products.mdx` | Nhân viên: Sản phẩm |
| `docs/guide/staff/categories.mdx` | Nhân viên: Danh mục |
| `docs/guide/staff/orders.mdx` | Nhân viên: Đơn hàng |
| `docs/guide/staff/supplier-orders.mdx` | Nhân viên: Nhập hàng |
| `docs/guide/staff/suppliers.mdx` | Nhân viên: Nhà cung cấp |
| `docs/guide/staff/customers.mdx` | Nhân viên: Khách hàng |
| `docs/guide/staff/chat.mdx` | Nhân viên: Tin nhắn |

---

## MDX Page Template

Every page follows this structure:

```mdx
---
title: "Tên tính năng"
description: "Một câu mô tả ngắn tính năng này làm gì."
---

## Mô tả

Đoạn 1-2 câu giải thích mục đích của tính năng.

## Cách truy cập

Menu bên trái → **Tên mục** (có thể kèm icon).

## Các thao tác chính

<Steps>
  <Step title="Tên bước">
    Mô tả chi tiết bước này.
  </Step>
</Steps>

<Note>
Lưu ý hoặc mẹo quan trọng.
</Note>
```

---

## RBAC Summary (for content accuracy)

| Tính năng | Owner | Manager | Staff |
|-----------|:-----:|:-------:|:-----:|
| Dashboard | ✅ | ✅ | ✅ |
| Sản phẩm | ✅ | ✅ | ✅ |
| Danh mục | ✅ | ✅ | ✅ |
| Đơn hàng | ✅ | ✅ | ✅ |
| Nhập hàng | ✅ | ✅ | ✅ |
| Nhà cung cấp | ✅ | ✅ | ✅ |
| Khách hàng | ✅ | ✅ | ✅ |
| Tin nhắn | ✅ | ✅ | ✅ |
| Upload file/ảnh | ✅ | ✅ | ❌ |
| Báo cáo/Analytics | ✅ | ✅ | ❌ |
| Chi phí | ✅ | ❌ | ❌ |
| Tài chính | ✅ | ❌ | ❌ |
| Nhân sự | ✅ | ❌ | ❌ |

---

## Task 1: Mintlify Setup — `mint.json` và cấu trúc thư mục

**Files:**
- Create: `docs/guide/mint.json`
- Create: `docs/guide/owner/` (empty dir placeholder)
- Create: `docs/guide/manager/` (empty dir placeholder)
- Create: `docs/guide/staff/` (empty dir placeholder)

- [ ] **Step 1: Tạo cấu trúc thư mục**

```bash
mkdir -p docs/guide/owner docs/guide/manager docs/guide/staff
```

- [ ] **Step 2: Tạo `docs/guide/mint.json`**

```json
{
  "$schema": "https://mintlify.com/schema.json",
  "name": "K-SMART Hướng dẫn sử dụng",
  "logo": {
    "light": "/logo/light.svg",
    "dark": "/logo/dark.svg"
  },
  "favicon": "/favicon.svg",
  "colors": {
    "primary": "#6366f1",
    "light": "#818cf8",
    "dark": "#4f46e5"
  },
  "tabs": [
    { "name": "Chủ shop", "url": "owner" },
    { "name": "Quản lý", "url": "manager" },
    { "name": "Nhân viên", "url": "staff" }
  ],
  "navigation": [
    {
      "tab": "Chủ shop",
      "groups": [
        {
          "group": "Bắt đầu",
          "pages": ["owner/introduction"]
        },
        {
          "group": "Vận hành",
          "pages": [
            "owner/dashboard",
            "owner/products",
            "owner/categories",
            "owner/orders",
            "owner/supplier-orders",
            "owner/suppliers",
            "owner/customers",
            "owner/chat"
          ]
        },
        {
          "group": "Quản lý cấp cao",
          "pages": [
            "owner/analytics",
            "owner/expenses",
            "owner/finance",
            "owner/users"
          ]
        }
      ]
    },
    {
      "tab": "Quản lý",
      "groups": [
        {
          "group": "Bắt đầu",
          "pages": ["manager/introduction"]
        },
        {
          "group": "Vận hành",
          "pages": [
            "manager/dashboard",
            "manager/products",
            "manager/categories",
            "manager/orders",
            "manager/supplier-orders",
            "manager/suppliers",
            "manager/customers",
            "manager/chat"
          ]
        },
        {
          "group": "Báo cáo",
          "pages": ["manager/analytics"]
        }
      ]
    },
    {
      "tab": "Nhân viên",
      "groups": [
        {
          "group": "Bắt đầu",
          "pages": ["staff/introduction"]
        },
        {
          "group": "Vận hành",
          "pages": [
            "staff/dashboard",
            "staff/products",
            "staff/categories",
            "staff/orders",
            "staff/supplier-orders",
            "staff/suppliers",
            "staff/customers",
            "staff/chat"
          ]
        }
      ]
    }
  ]
}
```

- [ ] **Step 3: Cài Mintlify CLI (nếu chưa có)**

```bash
npm install -g mintlify
```

Verify: `mintlify --version` trả về version number.

- [ ] **Step 4: Commit**

```bash
git add docs/guide/mint.json
git commit -m "feat(guide): add Mintlify config with 3-role tab structure"
```

---

## Task 2: Owner Tab — Giới thiệu & Dashboard

**Files:**
- Create: `docs/guide/owner/introduction.mdx`
- Create: `docs/guide/owner/dashboard.mdx`

- [ ] **Step 1: Tạo `docs/guide/owner/introduction.mdx`**

```mdx
---
title: "Giới thiệu — Chủ shop"
description: "Tổng quan về vai trò Chủ shop và các quyền hạn trong hệ thống K-SMART."
---

## Vai trò Chủ shop

Chủ shop là vai trò có quyền cao nhất trong hệ thống K-SMART. Bạn có toàn quyền truy cập tất cả các tính năng, bao gồm quản lý tài chính, nhân sự và chi phí vận hành.

## Các tính năng bạn có thể sử dụng

| Nhóm | Tính năng |
|------|-----------|
| Vận hành | Dashboard, Sản phẩm, Danh mục, Đơn hàng, Nhập hàng, Nhà cung cấp, Khách hàng, Tin nhắn |
| Quản lý cấp cao | Báo cáo, Chi phí, Tài chính, Nhân sự |

## Truy cập hệ thống

Đăng nhập tại trang admin với tài khoản được cấp quyền **Owner**.

<Note>
Các mục **Chi phí**, **Tài chính** và **Nhân sự** chỉ hiển thị trong menu khi bạn đăng nhập bằng tài khoản Chủ shop.
</Note>
```

- [ ] **Step 2: Tạo `docs/guide/owner/dashboard.mdx`**

```mdx
---
title: "Dashboard & KPI"
description: "Trang tổng quan hiển thị các chỉ số kinh doanh quan trọng theo thời gian thực."
---

## Mô tả

Dashboard là trang đầu tiên hiển thị khi bạn đăng nhập. Trang tổng hợp các chỉ số vận hành và tài chính quan trọng nhất của cửa hàng.

## Cách truy cập

Menu bên trái → **Dashboard** (biểu tượng ngôi nhà, mục đầu tiên).

## Các widget KPI

<CardGroup cols={2}>
  <Card title="Doanh thu hôm nay" icon="chart-line">
    Tổng doanh thu từ các đơn hàng được thanh toán trong ngày.
  </Card>
  <Card title="Đơn hàng mới" icon="shopping-cart">
    Số đơn hàng mới trong ngày, kèm trạng thái pending/paid.
  </Card>
  <Card title="Sản phẩm sắp hết hàng" icon="warning">
    Danh sách sản phẩm có tồn kho thấp cần nhập thêm.
  </Card>
  <Card title="Lợi nhuận tháng" icon="dollar-sign">
    Tổng lợi nhuận (doanh thu trừ giá vốn và chi phí) trong tháng hiện tại.
  </Card>
</CardGroup>

## Các thao tác chính

<Steps>
  <Step title="Xem tổng quan kinh doanh">
    Mở Dashboard để xem ngay doanh thu, số đơn hàng và lợi nhuận hôm nay.
  </Step>
  <Step title="Theo dõi sản phẩm sắp hết">
    Nhấn vào widget **Sản phẩm sắp hết hàng** để xem danh sách chi tiết và chuyển đến trang Sản phẩm để xử lý.
  </Step>
  <Step title="Xem đơn hàng cần xử lý">
    Widget đơn hàng mới hiển thị các đơn chưa xác nhận — nhấn để chuyển thẳng đến trang Đơn hàng.
  </Step>
</Steps>

<Note>
Dữ liệu trên Dashboard được cập nhật theo thời gian thực. Tải lại trang nếu số liệu chưa phản ánh các thao tác vừa thực hiện.
</Note>
```

- [ ] **Step 3: Commit**

```bash
git add docs/guide/owner/introduction.mdx docs/guide/owner/dashboard.mdx
git commit -m "feat(guide): add owner introduction and dashboard pages"
```

---

## Task 3: Owner Tab — Sản phẩm & Danh mục

**Files:**
- Create: `docs/guide/owner/products.mdx`
- Create: `docs/guide/owner/categories.mdx`

- [ ] **Step 1: Tạo `docs/guide/owner/products.mdx`**

```mdx
---
title: "Sản phẩm"
description: "Quản lý toàn bộ danh mục sản phẩm, biến thể, tồn kho và lịch sử giá vốn."
---

## Mô tả

Trang Sản phẩm cho phép bạn thêm, chỉnh sửa, và quản lý tất cả sản phẩm trong cửa hàng, bao gồm các biến thể (size, màu sắc) và tồn kho từng biến thể.

## Cách truy cập

Menu bên trái → **Sản phẩm**.

## Các thao tác chính

<Steps>
  <Step title="Xem danh sách sản phẩm">
    Trang hiển thị bảng danh sách tất cả sản phẩm với tên, danh mục, giá bán và trạng thái tồn kho.
  </Step>
  <Step title="Thêm sản phẩm mới">
    Nhấn nút **Thêm sản phẩm** ở góc trên phải. Điền thông tin:
    - Tên sản phẩm, mô tả, danh mục
    - Ảnh sản phẩm (tải lên hoặc nhập URL)
    - Giá bán, giá vốn
    - Thêm biến thể (nếu có nhiều kích thước/màu sắc)
  </Step>
  <Step title="Quản lý biến thể">
    Mỗi sản phẩm có thể có nhiều biến thể. Mỗi biến thể có giá bán, giá vốn và tồn kho riêng. Nhấn vào sản phẩm → tab **Biến thể** để quản lý.
  </Step>
  <Step title="Cập nhật tồn kho">
    Trong trang chi tiết sản phẩm, nhấn vào biến thể cần cập nhật và chỉnh sửa số lượng tồn kho.
  </Step>
  <Step title="Xem lịch sử giá vốn">
    Hệ thống lưu lịch sử thay đổi giá vốn để tính lợi nhuận chính xác theo từng thời điểm nhập hàng.
  </Step>
</Steps>

<Warning>
Giá vốn ảnh hưởng trực tiếp đến báo cáo lợi nhuận. Hãy cập nhật giá vốn mỗi khi nhập hàng với giá mới.
</Warning>

<Note>
Staff không thể upload ảnh sản phẩm. Chỉ Chủ shop và Quản lý mới có quyền tải lên hình ảnh.
</Note>
```

- [ ] **Step 2: Tạo `docs/guide/owner/categories.mdx`**

```mdx
---
title: "Danh mục"
description: "Quản lý phân loại sản phẩm để khách hàng dễ tìm kiếm trên cửa hàng."
---

## Mô tả

Danh mục giúp tổ chức sản phẩm thành các nhóm có ý nghĩa (ví dụ: Áo, Quần, Phụ kiện). Khách hàng có thể lọc sản phẩm theo danh mục trên storefront.

## Cách truy cập

Menu bên trái → **Danh mục**.

## Các thao tác chính

<Steps>
  <Step title="Xem danh sách danh mục">
    Trang hiển thị tất cả danh mục hiện có cùng số lượng sản phẩm trong mỗi danh mục.
  </Step>
  <Step title="Thêm danh mục mới">
    Nhấn **Thêm danh mục**, nhập tên danh mục và nhấn **Lưu**.
  </Step>
  <Step title="Chỉnh sửa danh mục">
    Nhấn vào tên danh mục hoặc biểu tượng chỉnh sửa để đổi tên.
  </Step>
  <Step title="Xóa danh mục">
    Nhấn biểu tượng xóa. Chỉ xóa được danh mục không còn sản phẩm nào.
  </Step>
</Steps>

<Warning>
Không thể xóa danh mục đang có sản phẩm. Hãy chuyển sản phẩm sang danh mục khác trước khi xóa.
</Warning>
```

- [ ] **Step 3: Commit**

```bash
git add docs/guide/owner/products.mdx docs/guide/owner/categories.mdx
git commit -m "feat(guide): add owner products and categories pages"
```

---

## Task 4: Owner Tab — Đơn hàng & Nhập hàng

**Files:**
- Create: `docs/guide/owner/orders.mdx`
- Create: `docs/guide/owner/supplier-orders.mdx`

- [ ] **Step 1: Tạo `docs/guide/owner/orders.mdx`**

```mdx
---
title: "Đơn hàng"
description: "Quản lý toàn bộ đơn hàng khách hàng từ khi đặt đến khi giao thành công."
---

## Mô tả

Trang Đơn hàng là trung tâm xử lý tất cả đơn hàng của khách hàng. Bạn có thể xem, xác nhận, cập nhật trạng thái và theo dõi thanh toán.

## Cách truy cập

Menu bên trái → **Đơn hàng**.

## Vòng đời đơn hàng

```
Chờ xác nhận (pending) → Đã thanh toán (paid) → Đang chuẩn bị (preparing) → Đang giao (shipping) → Đã giao (delivered)
```

Đơn hàng có thể bị hủy (`cancelled`) ở bất kỳ bước nào trước khi giao.

## Các thao tác chính

<Steps>
  <Step title="Xem danh sách đơn hàng">
    Bảng hiển thị tất cả đơn hàng với mã đơn, tên khách, tổng tiền, trạng thái và ngày đặt. Dùng bộ lọc để tìm theo trạng thái hoặc khoảng thời gian.
  </Step>
  <Step title="Xác nhận thanh toán">
    Mở đơn hàng → nhấn **Xác nhận thanh toán**. Chọn phương thức thanh toán (tiền mặt, chuyển khoản, thẻ) và nhập số tiền đã nhận.
  </Step>
  <Step title="Cập nhật trạng thái">
    Trong trang chi tiết đơn hàng, nhấn nút tương ứng để chuyển trạng thái: **Đang chuẩn bị** → **Đang giao** → **Đã giao**.
  </Step>
  <Step title="Xem lợi nhuận đơn hàng">
    Mỗi đơn hàng hiển thị lợi nhuận tính theo giá vốn tại thời điểm bán. Chủ shop có thể xem chi phí và lãi gộp từng sản phẩm trong đơn.
  </Step>
  <Step title="Xử lý đơn tách (split orders)">
    Nếu khách chọn giao từng phần (giao khi có hàng), hệ thống tự tách đơn. Mỗi phần đơn được quản lý độc lập.
  </Step>
</Steps>

<Note>
Đơn hàng hỗ trợ thanh toán một phần. Khách có thể đặt cọc trước và thanh toán phần còn lại khi nhận hàng.
</Note>
```

- [ ] **Step 2: Tạo `docs/guide/owner/supplier-orders.mdx`**

```mdx
---
title: "Nhập hàng"
description: "Quản lý đơn đặt hàng từ nhà cung cấp để nhập tồn kho."
---

## Mô tả

Trang Nhập hàng dùng để tạo và theo dõi các đơn mua hàng từ nhà cung cấp. Sau khi xác nhận nhận hàng, tồn kho sản phẩm tương ứng được cập nhật tự động.

## Cách truy cập

Menu bên trái → **Nhập hàng**.

## Các thao tác chính

<Steps>
  <Step title="Tạo đơn nhập hàng mới">
    Nhấn **Tạo đơn nhập** → chọn nhà cung cấp → thêm sản phẩm và số lượng cần nhập → nhập giá vốn → **Lưu**.
  </Step>
  <Step title="Xác nhận nhận hàng">
    Khi hàng về, mở đơn nhập → nhấn **Xác nhận nhận hàng**. Tồn kho và giá vốn sản phẩm được cập nhật ngay lập tức.
  </Step>
  <Step title="Theo dõi đơn nhập">
    Danh sách đơn nhập hiển thị trạng thái (chờ xác nhận / đã nhận) và tổng giá trị từng đơn.
  </Step>
</Steps>

<Note>
Giá vốn nhập trong đơn nhập hàng sẽ được ghi vào lịch sử giá vốn sản phẩm, ảnh hưởng đến tính toán lợi nhuận của các đơn hàng tiếp theo.
</Note>
```

- [ ] **Step 3: Commit**

```bash
git add docs/guide/owner/orders.mdx docs/guide/owner/supplier-orders.mdx
git commit -m "feat(guide): add owner orders and supplier-orders pages"
```

---

## Task 5: Owner Tab — Nhà cung cấp, Khách hàng & Tin nhắn

**Files:**
- Create: `docs/guide/owner/suppliers.mdx`
- Create: `docs/guide/owner/customers.mdx`
- Create: `docs/guide/owner/chat.mdx`

- [ ] **Step 1: Tạo `docs/guide/owner/suppliers.mdx`**

```mdx
---
title: "Nhà cung cấp"
description: "Quản lý danh sách nhà cung cấp và thông tin liên hệ."
---

## Mô tả

Trang Nhà cung cấp lưu trữ thông tin tất cả nhà cung cấp (vendor) của cửa hàng. Thông tin này được dùng khi tạo đơn nhập hàng.

## Cách truy cập

Menu bên trái → **Nhà cung cấp**.

## Các thao tác chính

<Steps>
  <Step title="Xem danh sách nhà cung cấp">
    Bảng hiển thị tên, số điện thoại, địa chỉ và số đơn nhập hàng của từng nhà cung cấp.
  </Step>
  <Step title="Thêm nhà cung cấp mới">
    Nhấn **Thêm nhà cung cấp** → điền tên, thông tin liên hệ → **Lưu**.
  </Step>
  <Step title="Chỉnh sửa thông tin">
    Nhấn vào tên nhà cung cấp để mở trang chi tiết và chỉnh sửa thông tin.
  </Step>
</Steps>
```

- [ ] **Step 2: Tạo `docs/guide/owner/customers.mdx`**

```mdx
---
title: "Khách hàng"
description: "Xem và quản lý thông tin khách hàng, lịch sử mua hàng."
---

## Mô tả

Trang Khách hàng là cơ sở dữ liệu CRM nội bộ — lưu thông tin và lịch sử mua hàng của từng khách.

## Cách truy cập

Menu bên trái → **Khách hàng**.

## Các thao tác chính

<Steps>
  <Step title="Xem danh sách khách hàng">
    Bảng hiển thị tên, email, số điện thoại, tổng số đơn và tổng chi tiêu của từng khách.
  </Step>
  <Step title="Xem hồ sơ khách hàng">
    Nhấn vào tên khách để xem chi tiết: thông tin cá nhân, lịch sử đơn hàng, và lịch sử chat hỗ trợ.
  </Step>
  <Step title="Tìm kiếm khách hàng">
    Dùng ô tìm kiếm để tìm theo tên hoặc email.
  </Step>
</Steps>
```

- [ ] **Step 3: Tạo `docs/guide/owner/chat.mdx`**

```mdx
---
title: "Tin nhắn"
description: "Quản lý hộp thư hỗ trợ khách hàng theo thời gian thực."
---

## Mô tả

Trang Tin nhắn là hộp thư nội bộ để nhân viên phản hồi câu hỏi và yêu cầu hỗ trợ từ khách hàng. Tin nhắn được cập nhật theo thời gian thực.

## Cách truy cập

Menu bên trái → **Tin nhắn**.

## Các thao tác chính

<Steps>
  <Step title="Xem danh sách hội thoại">
    Cột bên trái liệt kê tất cả các phòng chat với khách hàng, sắp xếp theo tin nhắn mới nhất.
  </Step>
  <Step title="Đọc và trả lời tin nhắn">
    Nhấn vào một hội thoại để đọc lịch sử tin nhắn. Gõ phản hồi vào ô nhập liệu bên dưới và nhấn **Gửi** hoặc Enter.
  </Step>
  <Step title="Gửi hình ảnh">
    Nhấn biểu tượng đính kèm để tải lên và gửi hình ảnh cho khách.
  </Step>
</Steps>

<Note>
Hệ thống có thể được cấu hình để AI tự động trả lời tin nhắn khách hàng. Chủ shop có thể bật/tắt tính năng này trong phần cài đặt.
</Note>
```

- [ ] **Step 4: Commit**

```bash
git add docs/guide/owner/suppliers.mdx docs/guide/owner/customers.mdx docs/guide/owner/chat.mdx
git commit -m "feat(guide): add owner suppliers, customers, and chat pages"
```

---

## Task 6: Owner Tab — Tính năng độc quyền (Analytics, Chi phí, Tài chính, Nhân sự)

**Files:**
- Create: `docs/guide/owner/analytics.mdx`
- Create: `docs/guide/owner/expenses.mdx`
- Create: `docs/guide/owner/finance.mdx`
- Create: `docs/guide/owner/users.mdx`

- [ ] **Step 1: Tạo `docs/guide/owner/analytics.mdx`**

```mdx
---
title: "Báo cáo & Phân tích"
description: "Xem báo cáo kinh doanh chi tiết, phân tích xu hướng bán hàng và lợi nhuận."
---

## Mô tả

Trang Báo cáo cung cấp dữ liệu phân tích chuyên sâu về hoạt động kinh doanh: doanh thu, lợi nhuận, top sản phẩm bán chạy, và xu hướng theo thời gian.

## Cách truy cập

Menu bên trái → **Báo cáo**.

## Các thao tác chính

<Steps>
  <Step title="Chọn khoảng thời gian">
    Dùng bộ chọn ngày ở đầu trang để lọc dữ liệu theo ngày, tuần, tháng hoặc khoảng tùy chỉnh.
  </Step>
  <Step title="Xem doanh thu và lợi nhuận">
    Biểu đồ tổng quan hiển thị doanh thu và lợi nhuận gộp theo từng ngày trong khoảng chọn.
  </Step>
  <Step title="Xem top sản phẩm">
    Bảng xếp hạng sản phẩm bán chạy nhất theo số lượng và theo doanh thu.
  </Step>
</Steps>

<Note>
Trang Báo cáo chỉ dành cho Chủ shop và Quản lý.
</Note>
```

- [ ] **Step 2: Tạo `docs/guide/owner/expenses.mdx`**

```mdx
---
title: "Chi phí"
description: "Theo dõi và quản lý chi phí vận hành cố định và biến đổi của cửa hàng."
---

## Mô tả

Trang Chi phí ghi nhận tất cả các khoản chi của cửa hàng ngoài giá vốn hàng hóa — ví dụ: tiền thuê mặt bằng, điện nước, lương nhân viên, vận chuyển. Dữ liệu này được dùng để tính lợi nhuận thực trong trang Tài chính.

## Cách truy cập

Menu bên trái → **Chi phí** *(chỉ hiển thị với tài khoản Chủ shop)*.

## Loại chi phí

- **Chi phí cố định:** Phát sinh đều đặn hàng tháng (tiền thuê, lương cứng...).
- **Chi phí biến đổi:** Phát sinh không đều (vận chuyển, sửa chữa...).

## Các thao tác chính

<Steps>
  <Step title="Xem danh sách chi phí">
    Bảng hiển thị tên khoản chi, phân loại, số tiền và ngày phát sinh.
  </Step>
  <Step title="Thêm chi phí mới">
    Nhấn **Thêm chi phí** → chọn loại (cố định/biến đổi), nhập tên, số tiền, ngày → **Lưu**.
  </Step>
  <Step title="Chỉnh sửa hoặc xóa chi phí">
    Nhấn biểu tượng chỉnh sửa hoặc xóa trên dòng chi phí cần thay đổi.
  </Step>
</Steps>

<Warning>
Tính năng này chỉ dành riêng cho Chủ shop. Quản lý và Nhân viên không có quyền truy cập.
</Warning>
```

- [ ] **Step 3: Tạo `docs/guide/owner/finance.mdx`**

```mdx
---
title: "Tài chính"
description: "Tổng quan P&L (lãi lỗ), doanh thu, giá vốn và chi phí vận hành theo tháng."
---

## Mô tả

Trang Tài chính cung cấp báo cáo lãi/lỗ tổng hợp — bao gồm doanh thu, giá vốn hàng bán, chi phí vận hành và lợi nhuận ròng. Đây là nguồn dữ liệu chính để ra quyết định kinh doanh.

## Cách truy cập

Menu bên trái → **Tài chính** *(chỉ hiển thị với tài khoản Chủ shop)*.

## Các chỉ số chính

| Chỉ số | Ý nghĩa |
|--------|---------|
| Doanh thu | Tổng giá bán của các đơn hàng đã thanh toán |
| Giá vốn | Tổng chi phí nhập hàng của sản phẩm đã bán |
| Lợi nhuận gộp | Doanh thu − Giá vốn |
| Chi phí vận hành | Tổng chi phí từ trang Chi phí |
| Lợi nhuận ròng | Lợi nhuận gộp − Chi phí vận hành |

## Các thao tác chính

<Steps>
  <Step title="Chọn kỳ báo cáo">
    Dùng bộ chọn tháng/năm để xem báo cáo theo kỳ mong muốn.
  </Step>
  <Step title="Xem P&L tổng quan">
    Màn hình hiển thị tất cả chỉ số tài chính trong kỳ, phân tách rõ doanh thu, giá vốn, chi phí và lợi nhuận.
  </Step>
  <Step title="Xem chi tiết lợi nhuận theo sản phẩm">
    Cuộn xuống để xem bảng top sản phẩm lãi cao nhất và lãi thấp nhất.
  </Step>
</Steps>

<Warning>
Tính năng này chỉ dành riêng cho Chủ shop.
</Warning>
```

- [ ] **Step 4: Tạo `docs/guide/owner/users.mdx`**

```mdx
---
title: "Nhân sự"
description: "Quản lý tài khoản nhân viên nội bộ, phân quyền vai trò."
---

## Mô tả

Trang Nhân sự cho phép Chủ shop tạo, chỉnh sửa và phân quyền tài khoản cho nhân viên. Mỗi tài khoản được gán vai trò **Quản lý** hoặc **Nhân viên**, quyết định các tính năng họ được truy cập.

## Cách truy cập

Menu bên trái → **Nhân sự** *(chỉ hiển thị với tài khoản Chủ shop)*.

## Các thao tác chính

<Steps>
  <Step title="Xem danh sách nhân viên">
    Bảng hiển thị tên, email, vai trò và ngày tạo tài khoản của từng nhân viên.
  </Step>
  <Step title="Tạo tài khoản nhân viên mới">
    Nhấn **Thêm nhân viên** → nhập tên, email → chọn vai trò (Quản lý / Nhân viên) → **Lưu**.
    Hệ thống sẽ gửi email mời đặt mật khẩu cho nhân viên.
  </Step>
  <Step title="Thay đổi vai trò">
    Nhấn vào tài khoản nhân viên → chỉnh vai trò → **Lưu**. Thay đổi có hiệu lực ngay lập tức.
  </Step>
  <Step title="Vô hiệu hóa tài khoản">
    Nhấn **Vô hiệu hóa** trên tài khoản nhân viên đã nghỉ việc. Tài khoản bị khóa, dữ liệu lịch sử vẫn được giữ lại.
  </Step>
</Steps>

<Warning>
Chỉ Chủ shop mới có thể tạo, chỉnh sửa và vô hiệu hóa tài khoản nhân viên.
</Warning>
```

- [ ] **Step 5: Commit**

```bash
git add docs/guide/owner/analytics.mdx docs/guide/owner/expenses.mdx docs/guide/owner/finance.mdx docs/guide/owner/users.mdx
git commit -m "feat(guide): add owner analytics, expenses, finance, users pages"
```

---

## Task 7: Manager Tab — Tất cả trang

**Files:**
- Create: `docs/guide/manager/introduction.mdx`
- Create: `docs/guide/manager/dashboard.mdx`
- Create: `docs/guide/manager/products.mdx`
- Create: `docs/guide/manager/categories.mdx`
- Create: `docs/guide/manager/orders.mdx`
- Create: `docs/guide/manager/supplier-orders.mdx`
- Create: `docs/guide/manager/suppliers.mdx`
- Create: `docs/guide/manager/customers.mdx`
- Create: `docs/guide/manager/chat.mdx`
- Create: `docs/guide/manager/analytics.mdx`

- [ ] **Step 1: Tạo `docs/guide/manager/introduction.mdx`**

```mdx
---
title: "Giới thiệu — Quản lý"
description: "Tổng quan về vai trò Quản lý và các quyền hạn trong hệ thống K-SMART."
---

## Vai trò Quản lý

Quản lý có toàn quyền trên các module vận hành và có thể xem báo cáo phân tích kinh doanh. Quản lý không truy cập được các tính năng tài chính, nhân sự và chi phí vận hành.

## Các tính năng bạn có thể sử dụng

| Nhóm | Tính năng |
|------|-----------|
| Vận hành | Dashboard, Sản phẩm, Danh mục, Đơn hàng, Nhập hàng, Nhà cung cấp, Khách hàng, Tin nhắn |
| Báo cáo | Báo cáo & Phân tích |

<Note>
Các mục **Chi phí**, **Tài chính** và **Nhân sự** không hiển thị trong menu của tài khoản Quản lý.
</Note>
```

- [ ] **Step 2: Tạo các trang vận hành cho Manager**

Tạo `docs/guide/manager/dashboard.mdx`:

```mdx
---
title: "Dashboard & KPI"
description: "Trang tổng quan hiển thị các chỉ số vận hành quan trọng."
---

## Mô tả

Dashboard hiển thị các chỉ số vận hành chính: đơn hàng mới, sản phẩm sắp hết hàng và doanh thu trong ngày.

## Cách truy cập

Menu bên trái → **Dashboard**.

## Các thao tác chính

<Steps>
  <Step title="Theo dõi đơn hàng cần xử lý">
    Widget đơn hàng mới hiển thị số đơn chưa xác nhận — nhấn để chuyển đến trang Đơn hàng.
  </Step>
  <Step title="Theo dõi tồn kho thấp">
    Widget sản phẩm sắp hết hàng cảnh báo các sản phẩm cần nhập thêm.
  </Step>
</Steps>
```

Tạo `docs/guide/manager/products.mdx`:

```mdx
---
title: "Sản phẩm"
description: "Quản lý sản phẩm, biến thể và tồn kho."
---

## Mô tả

Trang Sản phẩm cho phép thêm, chỉnh sửa sản phẩm và quản lý tồn kho từng biến thể.

## Cách truy cập

Menu bên trái → **Sản phẩm**.

## Các thao tác chính

<Steps>
  <Step title="Thêm sản phẩm mới">
    Nhấn **Thêm sản phẩm** → điền tên, danh mục, giá bán, ảnh → **Lưu**.
  </Step>
  <Step title="Quản lý biến thể và tồn kho">
    Mở sản phẩm → tab **Biến thể** → cập nhật số lượng tồn kho từng biến thể.
  </Step>
  <Step title="Tải lên ảnh sản phẩm">
    Quản lý có quyền upload ảnh sản phẩm. Nhấn vào vùng ảnh để tải lên.
  </Step>
</Steps>
```

Tạo `docs/guide/manager/categories.mdx`:

```mdx
---
title: "Danh mục"
description: "Quản lý phân loại sản phẩm."
---

## Mô tả

Danh mục tổ chức sản phẩm thành các nhóm cho khách hàng dễ tìm kiếm.

## Cách truy cập

Menu bên trái → **Danh mục**.

## Các thao tác chính

<Steps>
  <Step title="Thêm danh mục">
    Nhấn **Thêm danh mục**, nhập tên và nhấn **Lưu**.
  </Step>
  <Step title="Chỉnh sửa hoặc xóa">
    Nhấn biểu tượng chỉnh sửa/xóa trên dòng danh mục cần thay đổi.
  </Step>
</Steps>

<Warning>
Không thể xóa danh mục đang có sản phẩm.
</Warning>
```

Tạo `docs/guide/manager/orders.mdx`:

```mdx
---
title: "Đơn hàng"
description: "Xử lý và theo dõi đơn hàng khách hàng."
---

## Mô tả

Trang Đơn hàng là trung tâm xử lý tất cả đơn hàng: xác nhận thanh toán, cập nhật trạng thái giao hàng.

## Cách truy cập

Menu bên trái → **Đơn hàng**.

## Vòng đời đơn hàng

```
Chờ xác nhận → Đã thanh toán → Đang chuẩn bị → Đang giao → Đã giao
```

## Các thao tác chính

<Steps>
  <Step title="Xác nhận thanh toán">
    Mở đơn hàng → nhấn **Xác nhận thanh toán** → chọn phương thức và nhập số tiền nhận được.
  </Step>
  <Step title="Cập nhật trạng thái giao hàng">
    Nhấn nút chuyển trạng thái: **Đang chuẩn bị** → **Đang giao** → **Đã giao**.
  </Step>
  <Step title="Lọc đơn hàng">
    Dùng bộ lọc trạng thái và khoảng ngày để tìm đơn hàng cần xử lý.
  </Step>
</Steps>
```

Tạo `docs/guide/manager/supplier-orders.mdx`:

```mdx
---
title: "Nhập hàng"
description: "Tạo và xác nhận đơn nhập hàng từ nhà cung cấp."
---

## Mô tả

Trang Nhập hàng quản lý các đơn mua hàng từ nhà cung cấp. Xác nhận nhận hàng sẽ cập nhật tồn kho tự động.

## Cách truy cập

Menu bên trái → **Nhập hàng**.

## Các thao tác chính

<Steps>
  <Step title="Tạo đơn nhập">
    Nhấn **Tạo đơn nhập** → chọn nhà cung cấp → thêm sản phẩm, số lượng, giá vốn → **Lưu**.
  </Step>
  <Step title="Xác nhận nhận hàng">
    Khi hàng về, mở đơn nhập → nhấn **Xác nhận nhận hàng** để cập nhật tồn kho.
  </Step>
</Steps>
```

Tạo `docs/guide/manager/suppliers.mdx`:

```mdx
---
title: "Nhà cung cấp"
description: "Quản lý thông tin nhà cung cấp."
---

## Mô tả

Trang Nhà cung cấp lưu thông tin liên hệ của các nhà cung cấp, dùng khi tạo đơn nhập hàng.

## Cách truy cập

Menu bên trái → **Nhà cung cấp**.

## Các thao tác chính

<Steps>
  <Step title="Thêm nhà cung cấp">
    Nhấn **Thêm nhà cung cấp** → nhập tên và thông tin liên hệ → **Lưu**.
  </Step>
  <Step title="Chỉnh sửa thông tin">
    Nhấn vào tên nhà cung cấp để mở và chỉnh sửa thông tin.
  </Step>
</Steps>
```

Tạo `docs/guide/manager/customers.mdx`:

```mdx
---
title: "Khách hàng"
description: "Xem thông tin và lịch sử mua hàng của khách hàng."
---

## Mô tả

Trang Khách hàng lưu hồ sơ và lịch sử mua hàng của từng khách.

## Cách truy cập

Menu bên trái → **Khách hàng**.

## Các thao tác chính

<Steps>
  <Step title="Xem danh sách khách hàng">
    Bảng hiển thị tên, email, số đơn hàng và tổng chi tiêu.
  </Step>
  <Step title="Xem hồ sơ chi tiết">
    Nhấn vào tên khách để xem lịch sử đơn hàng và lịch sử chat hỗ trợ.
  </Step>
</Steps>
```

Tạo `docs/guide/manager/chat.mdx`:

```mdx
---
title: "Tin nhắn"
description: "Phản hồi tin nhắn hỗ trợ từ khách hàng theo thời gian thực."
---

## Mô tả

Trang Tin nhắn là hộp thư hỗ trợ khách hàng, cập nhật theo thời gian thực.

## Cách truy cập

Menu bên trái → **Tin nhắn**.

## Các thao tác chính

<Steps>
  <Step title="Xem hội thoại">
    Cột bên trái liệt kê tất cả phòng chat, sắp xếp theo tin nhắn mới nhất.
  </Step>
  <Step title="Trả lời khách hàng">
    Nhấn vào hội thoại → gõ tin nhắn vào ô bên dưới → nhấn **Gửi** hoặc Enter.
  </Step>
  <Step title="Gửi hình ảnh">
    Nhấn biểu tượng đính kèm để upload và gửi hình ảnh.
  </Step>
</Steps>
```

Tạo `docs/guide/manager/analytics.mdx`:

```mdx
---
title: "Báo cáo & Phân tích"
description: "Xem báo cáo doanh thu, sản phẩm bán chạy và xu hướng kinh doanh."
---

## Mô tả

Trang Báo cáo cung cấp dữ liệu phân tích về doanh thu và hiệu quả bán hàng, giúp Quản lý đưa ra quyết định vận hành.

## Cách truy cập

Menu bên trái → **Báo cáo**.

## Các thao tác chính

<Steps>
  <Step title="Chọn khoảng thời gian">
    Dùng bộ chọn ngày để lọc dữ liệu theo ngày, tuần hoặc tháng.
  </Step>
  <Step title="Xem doanh thu">
    Biểu đồ doanh thu theo ngày trong khoảng thời gian đã chọn.
  </Step>
  <Step title="Xem top sản phẩm">
    Bảng sản phẩm bán chạy nhất theo số lượng và theo doanh thu.
  </Step>
</Steps>

<Note>
Trang Báo cáo không hiển thị chi phí vận hành hay lợi nhuận ròng. Dữ liệu tài chính đầy đủ chỉ dành cho Chủ shop.
</Note>
```

- [ ] **Step 3: Commit**

```bash
git add docs/guide/manager/
git commit -m "feat(guide): add all manager tab pages (10 pages)"
```

---

## Task 8: Staff Tab — Tất cả trang

**Files:**
- Create: `docs/guide/staff/introduction.mdx`
- Create: `docs/guide/staff/dashboard.mdx`
- Create: `docs/guide/staff/products.mdx`
- Create: `docs/guide/staff/categories.mdx`
- Create: `docs/guide/staff/orders.mdx`
- Create: `docs/guide/staff/supplier-orders.mdx`
- Create: `docs/guide/staff/suppliers.mdx`
- Create: `docs/guide/staff/customers.mdx`
- Create: `docs/guide/staff/chat.mdx`

- [ ] **Step 1: Tạo `docs/guide/staff/introduction.mdx`**

```mdx
---
title: "Giới thiệu — Nhân viên"
description: "Tổng quan về vai trò Nhân viên và các tính năng trong hệ thống K-SMART."
---

## Vai trò Nhân viên

Nhân viên có quyền truy cập các module vận hành hàng ngày: xử lý đơn hàng, cập nhật sản phẩm, hỗ trợ khách hàng. Nhân viên không truy cập được báo cáo, tài chính, chi phí hay nhân sự.

## Các tính năng bạn có thể sử dụng

| Nhóm | Tính năng |
|------|-----------|
| Vận hành | Dashboard, Sản phẩm, Danh mục, Đơn hàng, Nhập hàng, Nhà cung cấp, Khách hàng, Tin nhắn |

<Note>
Nhân viên không có quyền upload ảnh sản phẩm. Liên hệ Chủ shop hoặc Quản lý để được hỗ trợ.
</Note>
```

- [ ] **Step 2: Tạo các trang vận hành cho Staff**

Tạo `docs/guide/staff/dashboard.mdx`:

```mdx
---
title: "Dashboard"
description: "Trang tổng quan với các chỉ số vận hành cần theo dõi hàng ngày."
---

## Mô tả

Dashboard hiển thị các chỉ số vận hành quan trọng: đơn hàng cần xử lý và sản phẩm sắp hết hàng.

## Cách truy cập

Menu bên trái → **Dashboard**.

## Các thao tác chính

<Steps>
  <Step title="Kiểm tra đơn hàng mới">
    Xem widget đơn hàng mới để biết có đơn nào cần xử lý không.
  </Step>
  <Step title="Kiểm tra tồn kho thấp">
    Widget sản phẩm sắp hết hàng cảnh báo các sản phẩm cần nhập thêm — báo lại cho Quản lý hoặc Chủ shop.
  </Step>
</Steps>
```

Tạo `docs/guide/staff/products.mdx`:

```mdx
---
title: "Sản phẩm"
description: "Xem và cập nhật thông tin sản phẩm, tồn kho."
---

## Mô tả

Nhân viên có thể xem và chỉnh sửa thông tin sản phẩm, cập nhật tồn kho biến thể.

## Cách truy cập

Menu bên trái → **Sản phẩm**.

## Các thao tác chính

<Steps>
  <Step title="Tìm sản phẩm">
    Dùng ô tìm kiếm hoặc lọc theo danh mục để tìm sản phẩm cần cập nhật.
  </Step>
  <Step title="Cập nhật tồn kho">
    Mở sản phẩm → tab **Biến thể** → chỉnh sửa số lượng tồn kho từng biến thể.
  </Step>
  <Step title="Chỉnh sửa thông tin sản phẩm">
    Nhấn **Chỉnh sửa** để cập nhật tên, mô tả hoặc giá bán.
  </Step>
</Steps>

<Warning>
Nhân viên không có quyền tải lên ảnh sản phẩm. Liên hệ Quản lý hoặc Chủ shop để cập nhật hình ảnh.
</Warning>
```

Tạo `docs/guide/staff/categories.mdx`:

```mdx
---
title: "Danh mục"
description: "Xem và quản lý phân loại sản phẩm."
---

## Mô tả

Danh mục giúp tổ chức sản phẩm theo nhóm.

## Cách truy cập

Menu bên trái → **Danh mục**.

## Các thao tác chính

<Steps>
  <Step title="Thêm danh mục">
    Nhấn **Thêm danh mục**, nhập tên và nhấn **Lưu**.
  </Step>
  <Step title="Chỉnh sửa hoặc xóa">
    Nhấn biểu tượng chỉnh sửa/xóa trên dòng danh mục cần thay đổi.
  </Step>
</Steps>
```

Tạo `docs/guide/staff/orders.mdx`:

```mdx
---
title: "Đơn hàng"
description: "Xử lý đơn hàng khách hàng: xác nhận thanh toán và cập nhật trạng thái giao hàng."
---

## Mô tả

Nhân viên xử lý các đơn hàng trong ngày: xác nhận thanh toán và cập nhật trạng thái giao hàng.

## Cách truy cập

Menu bên trái → **Đơn hàng**.

## Vòng đời đơn hàng

```
Chờ xác nhận → Đã thanh toán → Đang chuẩn bị → Đang giao → Đã giao
```

## Các thao tác chính

<Steps>
  <Step title="Tìm đơn hàng cần xử lý">
    Lọc theo trạng thái **Chờ xác nhận** để thấy các đơn chưa được xử lý.
  </Step>
  <Step title="Xác nhận thanh toán">
    Mở đơn → nhấn **Xác nhận thanh toán** → chọn phương thức (tiền mặt/chuyển khoản/thẻ) → nhập số tiền → **Xác nhận**.
  </Step>
  <Step title="Cập nhật trạng thái giao hàng">
    Nhấn **Đang chuẩn bị** khi bắt đầu đóng gói, **Đang giao** khi giao cho shipper, **Đã giao** khi khách nhận được hàng.
  </Step>
</Steps>

<Note>
Đơn hàng hỗ trợ thanh toán một phần. Nhập đúng số tiền khách đã trả — phần còn lại sẽ ghi nhận là nợ.
</Note>
```

Tạo `docs/guide/staff/supplier-orders.mdx`:

```mdx
---
title: "Nhập hàng"
description: "Tạo và xác nhận đơn nhập hàng từ nhà cung cấp."
---

## Mô tả

Trang Nhập hàng dùng để tạo đơn mua hàng và xác nhận nhận hàng — tồn kho được cập nhật tự động sau khi xác nhận.

## Cách truy cập

Menu bên trái → **Nhập hàng**.

## Các thao tác chính

<Steps>
  <Step title="Tạo đơn nhập hàng">
    Nhấn **Tạo đơn nhập** → chọn nhà cung cấp → thêm sản phẩm và số lượng → nhập giá vốn → **Lưu**.
  </Step>
  <Step title="Xác nhận nhận hàng">
    Khi hàng về, mở đơn nhập → nhấn **Xác nhận nhận hàng**. Tồn kho được cập nhật ngay.
  </Step>
</Steps>
```

Tạo `docs/guide/staff/suppliers.mdx`:

```mdx
---
title: "Nhà cung cấp"
description: "Xem thông tin nhà cung cấp."
---

## Mô tả

Trang Nhà cung cấp lưu thông tin liên hệ dùng khi tạo đơn nhập hàng.

## Cách truy cập

Menu bên trái → **Nhà cung cấp**.

## Các thao tác chính

<Steps>
  <Step title="Xem danh sách">
    Bảng hiển thị tên, số điện thoại và địa chỉ nhà cung cấp.
  </Step>
  <Step title="Thêm nhà cung cấp">
    Nhấn **Thêm nhà cung cấp** → nhập tên và thông tin liên hệ → **Lưu**.
  </Step>
</Steps>
```

Tạo `docs/guide/staff/customers.mdx`:

```mdx
---
title: "Khách hàng"
description: "Xem thông tin và lịch sử đơn hàng của khách hàng."
---

## Mô tả

Trang Khách hàng giúp tra cứu thông tin và lịch sử mua hàng khi cần hỗ trợ khách.

## Cách truy cập

Menu bên trái → **Khách hàng**.

## Các thao tác chính

<Steps>
  <Step title="Tìm khách hàng">
    Nhập tên hoặc email vào ô tìm kiếm.
  </Step>
  <Step title="Xem lịch sử đơn hàng">
    Nhấn vào tên khách để xem danh sách đơn hàng đã đặt.
  </Step>
</Steps>
```

Tạo `docs/guide/staff/chat.mdx`:

```mdx
---
title: "Tin nhắn"
description: "Hỗ trợ khách hàng qua tin nhắn trực tiếp."
---

## Mô tả

Trang Tin nhắn để phản hồi câu hỏi và hỗ trợ khách hàng theo thời gian thực.

## Cách truy cập

Menu bên trái → **Tin nhắn**.

## Các thao tác chính

<Steps>
  <Step title="Xem tin nhắn mới">
    Cột bên trái hiển thị danh sách hội thoại. Hội thoại có tin nhắn chưa đọc được đánh dấu nổi bật.
  </Step>
  <Step title="Trả lời khách hàng">
    Nhấn vào hội thoại → gõ phản hồi → nhấn **Gửi** hoặc Enter.
  </Step>
</Steps>
```

- [ ] **Step 3: Commit**

```bash
git add docs/guide/staff/
git commit -m "feat(guide): add all staff tab pages (9 pages)"
```

---

## Task 9: Verify — Chạy Mintlify local preview

- [ ] **Step 1: Chạy Mintlify dev server**

```bash
cd docs/guide
mintlify dev
```

Expected: Server khởi động tại `http://localhost:3000`. Kiểm tra:
- 3 tab (Chủ shop / Quản lý / Nhân viên) hiển thị đúng
- Sidebar đúng với từng tab
- Tất cả link hoạt động (không có 404)
- Nội dung hiển thị đúng tiếng Việt

- [ ] **Step 2: Kiểm tra từng tab**

Chủ shop: Mở tab → xác nhận có 3 nhóm (Bắt đầu / Vận hành / Quản lý cấp cao) với đủ 13 trang.

Quản lý: Mở tab → xác nhận có 2 nhóm (Bắt đầu / Vận hành + Báo cáo) với đủ 10 trang.

Nhân viên: Mở tab → xác nhận có 2 nhóm (Bắt đầu / Vận hành) với đủ 9 trang.

- [ ] **Step 3: Commit final**

```bash
git add .
git commit -m "feat(guide): complete K-SMART Vietnamese user guide (Mintlify)"
```
