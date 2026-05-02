---
id: ADMIN-TEST-CASES
type: test-cases
status: draft
project: K-SMART Admin Panel
created: 2026-04-30
---

# Test Cases — K-SMART Admin Panel

Bộ test cases toàn diện cho K-SMART Admin Panel, bao gồm happy path, edge cases, validation, và RBAC.

**Test Status Legend:** P1=Critical | P2=High | P3=Medium | P4=Low

---

## 1. Authentication & Authorization (16 test cases)

| Test ID | Tiêu đề | Điều kiện tiên quyết | Các bước | Kết quả mong đợi | Priority |
|---------|---------|---------------------|---------|-----------------|----------|
| TC-AUTH-001 | Valid login with correct credentials | User exists in DB | 1. Navigate to /login 2. Enter valid username & password 3. Click Login | Redirect to dashboard; cookie 'admin_session' set (HttpOnly); user info (name, role) hiển thị trong sidebar | P1 |
| TC-AUTH-002 | Invalid login - wrong password | User exists in DB | 1. Navigate to /login 2. Enter correct username, wrong password 3. Click Login | Banner lỗi đỏ phía trên form: "Tên đăng nhập hoặc mật khẩu không chính xác"; password field highlight đỏ; ở lại /login | P1 |
| TC-AUTH-003 | Invalid login - username not found | Username not in DB | 1. Navigate to /login 2. Enter non-existent username 3. Click Login | Banner lỗi đỏ phía trên form: "Tên đăng nhập hoặc mật khẩu không chính xác"; ở lại /login | P1 |
| TC-AUTH-004 | Empty username field | Fresh login page | 1. Leave username empty 2. Enter password 3. Click Login | Submit button disabled khi username trống; nếu cố submit qua Enter, inline error dưới username: "Username bắt buộc" | P2 |
| TC-AUTH-005 | Empty password field | Fresh login page | 1. Enter username 2. Leave password empty 3. Click Login | Submit button disabled khi password trống; nếu cố submit qua Enter, inline error dưới password: "Mật khẩu bắt buộc" | P2 |
| TC-AUTH-006 | Logout success | User logged in | 1. Click logout button in footer | Redirect về /login; session cookie cleared; toast thành công "Đăng xuất thành công" | P1 |
| TC-AUTH-007 | Logout clears session | User logged in | 1. Logout 2. Nhấn browser back button | Redirect về /login (không quay lại dashboard) | P2 |
| TC-AUTH-008 | Staff sidebar hides restricted modules | Login as Staff | 1. Login as Staff 2. Kiểm tra sidebar | 4 items KHÔNG hiển thị: Nhân sự, Chi phí, Báo cáo, Cài đặt; các items còn lại (Products, Orders, Customers, Suppliers, Supplier Orders, Debts, Chat) hiển thị đủ | P1 |
| TC-AUTH-009 | Manager sidebar shows/hides correctly | Login as Manager | 1. Login as Manager 2. Kiểm tra sidebar | "Báo cáo" visible; "Chi phí", "Nhân sự", "Cài đặt" hidden; operational modules (Products, Orders, Customers, Suppliers, Supplier Orders, Debts, Chat) visible | P1 |
| TC-AUTH-010 | Staff cannot access /users direct URL | Login as Staff | 1. Login as Staff 2. Navigate to /users directly | Redirect về dashboard; toast "Bạn không có quyền truy cập trang này" | P2 |
| TC-AUTH-011 | Staff cannot access /expenses direct URL | Login as Staff | 1. Login as Staff 2. Navigate to /expenses directly | Redirect về dashboard; toast "Bạn không có quyền truy cập trang này" | P2 |
| TC-AUTH-012 | Manager can access /analytics | Login as Manager | 1. Login as Manager 2. Navigate to /analytics | Page loads, displays analytics | P2 |
| TC-AUTH-013 | Staff cannot access /analytics | Login as Staff | 1. Login as Staff 2. Navigate to /analytics directly | Redirect về dashboard; toast "Bạn không có quyền truy cập trang này" | P1 |
| TC-AUTH-014 | Session timeout | Configured timeout=30min; user logged in >30min idle | 1. Để idle >30 phút 2. Try navigate | Redirect về /login; toast "Phiên đăng nhập hết hạn" | P2 |
| TC-AUTH-015 | Fresh login replaces existing session | User1 logged in on Browser A | 1. Ghi lại session cookie của User1 2. Login as User2 trên cùng browser 3. Dùng lại cookie User1 (từ bước 1) gửi request tới API | User2 session active; request với User1 cookie trả về 401 hoặc redirect về /login | P3 |
| TC-AUTH-016 | Owner sidebar shows all modules | Login as Owner | 1. Login as Owner 2. Kiểm tra sidebar | Tất cả 13 modules hiển thị: Dashboard, Products, Categories, Orders, Customers, Suppliers, Supplier Orders, Debts, Chat, Analytics, Expenses, Users, Settings | P1 |

---

## 2. Dashboard (9 test cases)

| Test ID | Tiêu đề | Điều kiện tiên quyết | Các bước | Kết quả mong đợi | Priority |
|---------|---------|---------------------|---------|-----------------|----------|
| TC-DASH-001 | Dashboard loads on login | User logged in | 1. Login successfully | Dashboard displays KPI cards, recent orders, debt summary | P1 |
| TC-DASH-002 | KPI cards display correct values | Orders & revenue exist today | 1. View dashboard 2. Check KPI values | Today's revenue = sum of paid orders, Order count = total orders today | P2 |
| TC-DASH-003 | Recent orders table populated | Orders exist in DB | 1. View dashboard 2. Scroll to recent orders | Table shows 5-10 recent orders with order ID, customer, amount, status | P2 |
| TC-DASH-004 | Debt summary widget displays | Customers with debt exist | 1. View dashboard 2. Check debt widget | Widget shows total customer debt, top debtors | P2 |
| TC-DASH-005 | Links to other modules work | Dashboard loaded | 1. Click "Quản lý kho" button 2. Click "Sản phẩm mới" button | Navigate to /products and /products/add respectively | P3 |
| TC-DASH-006 | Analytics link redirects | Manager logged in | 1. Click "Xem báo cáo đầy đủ" link | Redirect to /analytics | P3 |
| TC-DASH-007 | Dashboard loads in <2 seconds | Fresh dashboard | 1. Load dashboard 2. Measure load time | Time < 2 seconds | P3 |
| TC-DASH-008 | KPI values update after order creation | Order created | 1. Create new order 2. Return to dashboard 3. Check KPI | Revenue & order count updated | P3 |
| TC-DASH-009 | KPI cards show day-over-day comparison | Orders exist today and yesterday | 1. View dashboard 2. Check KPI cards | Mỗi KPI card hiển thị delta so với hôm qua (e.g., "+12% so với hôm qua" hoặc "-5 đơn") | P2 |

---

## 3. Products (24 test cases)

| Test ID | Tiêu đề | Điều kiện tiên quyết | Các bước | Kết quả mong đợi | Priority |
|---------|---------|---------------------|---------|-----------------|----------|
| TC-PROD-001 | Product list displays | Products exist in DB | 1. Navigate to /products | Table displays products with name, price, stock, category | P1 |
| TC-PROD-002 | Search product by name (real-time) | Multiple products exist | 1. Go to /products 2. Type "laptop" in search 3. Wait 300ms | List filters to products containing "laptop" | P2 |
| TC-PROD-003 | Search empty result | Products exist | 1. Search for "xyz999" (no matches) | Show empty state message | P2 |
| TC-PROD-004 | Filter by category | Products in multiple categories | 1. Click category filter 2. Select "Điện tử" | List shows only products in "Điện tử" | P2 |
| TC-PROD-005 | Pagination 10/25/50 items | >50 products exist | 1. Change pagination to 25 2. Check page count | Correct number of pages displayed | P2 |
| TC-PROD-006 | Add product form validation - empty name | Fresh add form | 1. Leave name empty 2. Fill other fields 3. Click Save | Inline error dưới field tên: "Tên sản phẩm bắt buộc"; form không submit; các field khác giữ nguyên | P2 |
| TC-PROD-007 | Add product - successful | Admin user logged in | 1. Go to /products/add 2. Fill: tên, giá, chi phí, danh mục 3. Upload image 4. Click Save | Product created, redirect to /products, success toast | P1 |
| TC-PROD-008 | Add product with image | Admin user logged in | 1. Add product 2. Upload image 3. Save | Image saved and displayed in list | P2 |
| TC-PROD-009 | Add product variants | Admin user logged in | 1. Add product 2. Click "Thêm biến thể" 3. Fill size/color 4. Save | Variants saved, displayed in detail | P2 |
| TC-PROD-010 | Edit product name | Product exists | 1. Go to /products/[id]/edit 2. Change name 3. Save | Name updated in list | P1 |
| TC-PROD-011 | Edit product price | Product exists with variant | 1. Edit product 2. Change variant price 3. Save | Price updated; entry mới trong price history: Date, Old Price, New Price, Changed By | P2 |
| TC-PROD-012 | Edit product stock | Product exists | 1. Edit product 2. Change stock 3. Save | Stock updated | P2 |
| TC-PROD-013 | Delete product - single | Product exists, no active orders | 1. Hover product row 2. Click delete dropdown 3. Confirm | Product deleted, list updated | P1 |
| TC-PROD-014 | Delete product with confirmation | Product exists | 1. Click delete 2. Cancel confirm dialog | Product NOT deleted | P2 |
| TC-PROD-015 | Bulk delete products | Multiple products exist | 1. Enter select mode 2. Check 3+ products 3. Click bulk delete 4. Confirm | All selected products deleted | P2 |
| TC-PROD-016 | Cannot delete product with active orders | Product has orders | 1. Try delete product 2. Click delete | Toast error: "Sản phẩm có đơn hàng, không thể xóa"; row giữ nguyên trong list, total count unchanged | P2 |
| TC-PROD-017 | Product price history | Variant price edited multiple times | 1. View product variants 2. Click variant 3. View history | Table shows: Date, Old Price, New Price, Changed By (price — theo US-PROD-005) | P3 |
| TC-PROD-018 | Duplicate product name allowed | Product "Laptop Dell" exists | 1. Try add product named "Laptop Dell" | Product created (duplicate names allowed; products differentiated by ID/variant) | P2 |
| TC-PROD-019 | Staff can add products | Staff logged in | 1. Go to /products/add 2. Add product | Product created and appears in list | P2 |
| TC-PROD-020 | Product price cannot be negative | Add product form | 1. Enter -100 into price field 2. Click Save | Inline error dưới field giá: "Giá phải lớn hơn 0"; form không submit | P2 |
| TC-PROD-021 | Variant price history shows "Changed By" correctly | Admin user edits variant price | 1. Login as admin A 2. Edit variant price 3. View price history | "Người thay đổi" column shows admin A's fullName | P2 |
| TC-PROD-022 | Add product without category (if required) | Fresh add form | 1. Fill name & price 2. Leave category unselected 3. Click Save | Inline error dưới field danh mục: "Danh mục bắt buộc" | P2 |
| TC-PROD-023 | Add variant with empty name | Product add form | 1. Click "Thêm biến thể" 2. Leave tên biến thể trống 3. Click Save | Inline error dưới field biến thể: "Tên biến thể bắt buộc" | P3 |
| TC-PROD-024 | Upload image with wrong format | Add product form | 1. Upload file .pdf hoặc .txt thay vì ảnh | Inline error dưới upload field: "Chỉ chấp nhận file ảnh (jpg, png, webp)"; form không submit | P2 |

---

## 4. Categories (9 test cases)

| Test ID | Tiêu đề | Điều kiện tiên quyết | Các bước | Kết quả mong đợi | Priority |
|---------|---------|---------------------|---------|-----------------|----------|
| TC-CAT-001 | Categories list displays | Categories exist | 1. Navigate to /categories | Tree or list shows all categories | P1 |
| TC-CAT-002 | Add category | Categories page | 1. Click "Thêm danh mục" 2. Fill name 3. Select parent (optional) 4. Save | Category created, appears in list | P1 |
| TC-CAT-003 | Edit category name | Category exists | 1. Edit category 2. Change name 3. Save | Name updated in list | P2 |
| TC-CAT-004 | Delete empty category | Category exists, no products | 1. Delete category 2. Confirm | Category deleted | P1 |
| TC-CAT-005 | Cannot delete category with products | Category has products | 1. Try delete category with products | Toast error đỏ: "Danh mục có sản phẩm, không thể xóa"; item không bị xóa khỏi list | P2 |
| TC-CAT-006 | Category count shows product qty | Categories with products | 1. View category list 2. Check product count | Correct number displayed | P3 |
| TC-CAT-007 | Cannot delete category with subcategories | Category has 1 child category (no products) | 1. Try delete parent category 2. Confirm | Toast error đỏ: "Danh mục có danh mục con, không thể xóa"; item không bị xóa khỏi list | P2 |
| TC-CAT-008 | Add category with empty name | Category form | 1. Leave tên trống 2. Click Save | Inline error dưới field tên: "Tên danh mục bắt buộc"; form không submit | P2 |
| TC-CAT-009 | Reparent category - change parent | Category "Con A" under "Cha X"; category "Cha Y" exists | 1. Edit "Con A" 2. Đổi parent từ "Cha X" sang "Cha Y" 3. Save | Category tree cập nhật: "Con A" xuất hiện dưới "Cha Y", không còn dưới "Cha X" | P3 |

---

## 5. Orders (28 test cases)

| Test ID | Tiêu đề | Điều kiện tiên quyết | Các bước | Kết quả mong đợi | Priority |
|---------|---------|---------------------|---------|-----------------|----------|
| TC-ORD-001 | Orders list displays | Orders exist | 1. Navigate to /orders | Table shows ID, customer, amount, payment status, fulfillment status | P1 |
| TC-ORD-002 | Search order by ID | Multiple orders | 1. Type order ID in search | List filters to matching order | P2 |
| TC-ORD-003 | Search order by customer name | Multiple orders | 1. Type customer name in search | List filters to customer's orders | P2 |
| TC-ORD-004 | Filter by payment status - All | Orders with mixed payment status | 1. Select "All" payment status filter | All orders displayed | P2 |
| TC-ORD-005 | Filter by payment status - Pending | Orders exist with pending payment | 1. Select "Pending" 2. Check list | Only orders with payment_status=Pending shown | P2 |
| TC-ORD-006 | Filter by payment status - Paid | Orders exist with paid status | 1. Select "Paid" 2. Check list | Only orders with payment_status=Paid shown | P2 |
| TC-ORD-007 | Filter by fulfillment status | Orders with mixed statuses | 1. Select "Đã xuất kho" filter | Chỉ hiển thị orders có fulfillment_status=stock_out | P2 |
| TC-ORD-008 | Filter - Debt only (unpaid orders) | Unpaid orders exist | 1. Click "Công nợ" or debtOnly filter | Only orders with payment_status != Paid shown | P2 |
| TC-ORD-009 | View order detail | Order exists | 1. Click order in list 2. View /orders/[id] | Display items, customer, address, payment history, timeline | P1 |
| TC-ORD-010 | Create new order | Customers exist, products exist | 1. Go to /orders 2. Click "Tạo đơn" 3. Select customer 4. Add 2 products 5. Set address 6. Save | Order created, redirect to detail | P1 |
| TC-ORD-011 | Create order - auto calculate total | Order form | 1. Add products with known prices 2. Check total | Total = sum of item totals | P2 |
| TC-ORD-012 | Record payment - partial | Order exists, unpaid | 1. Go to order detail 2. Click "Ghi nhận thanh toán" 3. Select payment method 4. Add note (optional) 5. Enter amount < total 6. Save | Payment recorded; remaining debt shown; payment method + note hiển thị trong history | P1 |
| TC-ORD-013 | Record payment - full | Order exists, partial paid | 1. Record payment for remaining balance | Payment status → Paid | P1 |
| TC-ORD-014 | Update fulfillment status - Chờ xử lý→Đã xuất kho | Order với fulfillment_status=pending | 1. Click status dropdown 2. Select "Đã xuất kho" | Status updated; history timeline ghi: timestamp chính xác + fullName của staff thực hiện thay đổi | P2 |
| TC-ORD-015 | Update fulfillment status - Đã xuất kho→Hoàn tất | Order với fulfillment_status=stock_out | 1. Update to "Hoàn tất" | Status updated | P2 |
| TC-ORD-017 | Cannot skip fulfillment status (e.g., Chờ xử lý→Hoàn tất) | Order với fulfillment_status=pending | 1. Mở dropdown status 2. Xem options | Option "Hoàn tất" bị disabled; chỉ "Đã xuất kho" khả dụng | P3 |
| TC-ORD-018 | Cancel order - restores stock | Order with 2 products (qty=5 each) | 1. Note current stock 2. Cancel order 3. Check stock | Stock increased by 5 for each product | P1 |
| TC-ORD-019 | Cancel order - confirm dialog | Order exists | 1. Click "Hủy đơn" 2. Cancel dialog | Order NOT cancelled | P2 |
| TC-ORD-020 | Order stats widget displays | Orders exist | 1. View /orders 2. Check OrderStats widget | Shows Total Orders, Total Revenue, Avg Order Value | P3 |
| TC-ORD-021 | Cannot modify completed order | Order fulfillment_status=completed (Hoàn tất) | 1. Try edit order 2. Try change status | Tất cả fields bị disabled; banner "Đơn đã giao, không thể chỉnh sửa" hiển thị trên form; status dropdown disabled | P2 |
| TC-ORD-022 | Pagination orders list | >25 orders | 1. Change pagination to 25 2. Navigate pages | Correct orders per page, page count accurate | P2 |
| TC-ORD-023 | Create order without selecting customer | Order form | 1. Click "Tạo đơn" 2. Add sản phẩm 3. Bỏ qua chọn khách 4. Click Save | Inline error dưới field khách hàng: "Vui lòng chọn khách hàng"; form không submit | P2 |
| TC-ORD-024 | Create order with no items | Order form | 1. Click "Tạo đơn" 2. Chọn khách 3. Không thêm sản phẩm 4. Click Save | Inline banner trên form: "Đơn hàng phải có ít nhất 1 sản phẩm"; Save button disabled khi items rỗng | P2 |
| TC-ORD-025 | Record payment with amount = 0 | Order exists, unpaid | 1. Mở dialog "Ghi nhận thanh toán" 2. Nhập 0 3. Click Save | Inline error dưới field số tiền: "Số tiền phải lớn hơn 0"; dialog không đóng | P2 |
| TC-ORD-026 | Create order item with quantity = 0 | Order form, product selected | 1. Thêm sản phẩm vào đơn 2. Set quantity = 0 3. Click Save | Inline error trên hàng sản phẩm: "Số lượng phải ≥ 1" | P2 |
| TC-ORD-027 | Filter by fulfillment status - Chờ xử lý | Orders có fulfillment_status=pending | 1. Select "Chờ xử lý" fulfillment filter | Chỉ hiển thị orders có fulfillment_status=pending | P2 |
| TC-ORD-028 | Filter by fulfillment status - Đã xuất kho | Orders có fulfillment_status=stock_out | 1. Select "Đã xuất kho" fulfillment filter | Chỉ hiển thị orders có fulfillment_status=stock_out | P2 |
| TC-ORD-029 | Filter by fulfillment status - Hoàn tất | Orders có fulfillment_status=completed | 1. Select "Hoàn tất" fulfillment filter | Chỉ hiển thị orders có fulfillment_status=completed | P2 |

---

## 6. Customers (17 test cases)

| Test ID | Tiêu đề | Điều kiện tiên quyết | Các bước | Kết quả mong đợi | Priority |
|---------|---------|---------------------|---------|-----------------|----------|
| TC-CUST-001 | Customer list displays | Customers exist | 1. Navigate to /customers | Table shows name, phone, type (sỉ/lẻ), total spent, tier badge | P1 |
| TC-CUST-002 | Search customer by name | Multiple customers | 1. Type customer name | List filters in real-time | P2 |
| TC-CUST-004 | Search customer by phone | Multiple customers | 1. Type phone number | List filters to matching customer | P2 |
| TC-CUST-005 | Filter by customer type - Wholesale | Wholesale & retail customers | 1. Select "Khách sỉ" filter | Only wholesale customers shown | P2 |
| TC-CUST-006 | Add customer - required fields | Customer page | 1. Open add sheet 2. Fill name, phone 3. Save | Customer created | P1 |
| TC-CUST-009 | Add customer - duplicate phone | Customer "0901234567" exists | 1. Try add customer with same phone | Inline error dưới field điện thoại: "Số điện thoại đã tồn tại" | P2 |
| TC-CUST-010 | Edit customer info | Customer exists | 1. Click edit 2. Change name, address 3. Save | Customer updated in list | P1 |
| TC-CUST-011 | Customer detail page - all sections | Customer exists with order history | 1. Click customer 2. View /customers/[id] | Displays: Profile, Financial Stats, Order History, Location, Security | P2 |
| TC-CUST-012 | Customer detail - financial stats accurate | Customer with multiple orders | 1. View detail 2. Check "Total Spent" vs order sum | Values match | P2 |
| TC-CUST-013 | Customer detail - order history | Customer with 3+ orders | 1. View detail → Order History tab | All orders listed with date, amount, status | P2 |
| TC-CUST-014 | Activate/Deactivate customer | Customer exists, active | 1. Click dropdown menu 2. Select "Deactivate" 3. Confirm | Customer status → inactive; hiển thị trong UI với badge "Inactive"; không bị xóa khỏi DB (soft deactivate only, không hard-delete) | P2 |
| TC-CUST-015 | Customer tier badge displayed | Customers with different tiers | 1. View list 2. Check tier badges | "Thân thiết" badge shown nếu orderCount ≥ loyalMinOrders OR totalSpent ≥ loyalMinSpent; "Mua nhiều" badge nếu chỉ đạt frequentMin; không có badge nếu không đạt ngưỡng nào | P2 |
| TC-CUST-017 | Cannot add customer without name | Add sheet | 1. Leave name empty 2. Try save | Inline error dưới field tên: "Tên khách hàng bắt buộc"; sheet không đóng | P2 |
| TC-CUST-018 | Pagination customers | >25 customers | 1. Navigate pages | Correct customers per page | P2 |
| TC-CUST-019 | Add customer - invalid phone format | Add sheet | 1. Enter "abc123" hoặc số ít hơn 10 chữ số vào phone 2. Try save | Inline error dưới field điện thoại: "Số điện thoại không hợp lệ" | P2 |
| TC-CUST-021 | Filter by customer type - Retail | Wholesale & retail customers exist | 1. Select "Khách lẻ" filter | Chỉ hiển thị retail customers; wholesale customers ẩn | P2 |
| TC-CUST-022 | Tier badge downgrades when order cancelled | Customer total_spent=6,000,000 (Thân thiết, loyalMinSpent=5,000,000); 1 order = 2,000,000 chưa cancel | 1. Cancel order 2,000,000 2. View customer | total_spent giảm về 4,000,000; tier badge tự động cập nhật (không còn đủ Thân thiết) | P2 |
| TC-CUST-023 | Filter by customer status - Active/Inactive | Customers gồm cả active và inactive | 1. Select "Inactive" filter 2. Check list; sau đó 3. Select "Active" filter | Bước 2: Chỉ hiển thị inactive customers; Bước 3: Chỉ hiển thị active customers | P2 |

---

## 7. Suppliers (10 test cases)

| Test ID | Tiêu đề | Điều kiện tiên quyết | Các bước | Kết quả mong đợi | Priority |
|---------|---------|---------------------|---------|-----------------|----------|
| TC-SUPP-001 | Suppliers list displays | Suppliers exist | 1. Navigate to /suppliers | Table shows name, email, phone, address, order count | P1 |
| TC-SUPP-002 | Search supplier by name | Multiple suppliers | 1. Type supplier name | List filters | P2 |
| TC-SUPP-003 | Add supplier | Suppliers page | 1. Click "Thêm NCC" 2. Fill name, email, phone, address 3. Save | Supplier created | P1 |
| TC-SUPP-004 | Edit supplier info | Supplier exists | 1. Edit supplier 2. Change name 3. Save | Supplier updated in list | P1 |
| TC-SUPP-005 | Supplier detail - stats | Supplier with multiple orders | 1. View supplier detail 2. Check stats | Shows: Total Orders, Total Spent, Recent Orders | P2 |
| TC-SUPP-006 | Validate supplier email format | Add/Edit form | 1. Enter invalid email 2. Save | Inline error dưới field email: "Email không hợp lệ"; form không submit | P2 |
| TC-SUPP-007 | Duplicate supplier name allowed | Supplier "ABC Corp" exists | 1. Try add with name "ABC Corp" | Supplier created (duplicates allowed, no uniqueness constraint on name) | P3 |
| TC-SUPP-008 | Delete supplier with no orders | Supplier exists, no orders | 1. Delete supplier 2. Confirm | Supplier deleted | P2 |
| TC-SUPP-009 | Add supplier without name | Supplier form | 1. Leave tên trống 2. Click Save | Inline error dưới field tên: "Tên nhà cung cấp bắt buộc" | P2 |
| TC-SUPP-010 | Cannot delete supplier with existing orders | Supplier has supplier orders | 1. Try delete supplier 2. Confirm | Error toast: "Không thể xóa nhà cung cấp có đơn nhập hàng" | P2 |

---

## 8. Supplier Orders (14 test cases)

| Test ID | Tiêu đề | Điều kiện tiên quyết | Các bước | Kết quả mong đợi | Priority |
|---------|---------|---------------------|---------|-----------------|----------|
| TC-SUPP-ORD-001 | Supplier orders list | Supplier orders exist | 1. Navigate to /supplier-orders | Table shows ID, supplier, date, status, total cost | P1 |
| TC-SUPP-ORD-002 | Filter by status - Pending | Orders with Pending status | 1. Select "Pending" filter | Only Pending orders shown | P2 |
| TC-SUPP-ORD-003 | Search supplier order by ID | Multiple orders | 1. Type order ID | List filters | P2 |
| TC-SUPP-ORD-004 | Create supplier order | Suppliers & products exist | 1. Click "Tạo đơn" 2. Select supplier 3. Add 2 products (qty, cost) 4. Save | Order created, redirected to detail | P1 |
| TC-SUPP-ORD-005 | Supplier order auto-calc total | Order form | 1. Add products with known costs 2. Check total | Total = sum of product costs | P2 |
| TC-SUPP-ORD-006 | Update order status Pending→Confirmed | Order Pending | 1. Update status to "Confirmed" | Status updated | P2 |
| TC-SUPP-ORD-007 | Update order status Confirmed→Delivered | Order Confirmed | 1. Update status to "Delivered" 2. Check stock | Order status updated, product stock increased | P2 |
| TC-SUPP-ORD-008 | Stock increases when supplier order delivered | Product stock=10, order qty=5 | 1. Deliver supplier order 2. Check product stock | Stock = 15 | P1 |
| TC-SUPP-ORD-009 | Cannot create order without products | Supplier selected | 1. Try save empty order (no items) | Inline banner hoặc toast: "Phải có ít nhất 1 sản phẩm"; form không submit | P2 |
| TC-SUPP-ORD-010 | Supplier order detail shows history | Order created > 1 hour ago | 1. View detail 2. Check status timeline | Timeline shows all status changes with timestamps | P3 |
| TC-SUPP-ORD-011 | Cancel supplier order (Pending only) | Supplier order with Pending status | 1. Open order detail 2. Click "Hủy đơn" 3. Confirm | Order status → Cancelled; stock not affected (not yet delivered) | P2 |
| TC-SUPP-ORD-012 | Cannot cancel confirmed/delivered order | Order status=Confirmed | 1. Open order detail 2. Check "Hủy đơn" button | Nút "Hủy đơn" bị disabled; hover tooltip: "Không thể hủy đơn đã xác nhận" | P2 |
| TC-SUPP-ORD-013 | Add item with quantity = 0 | Supplier order form | 1. Thêm sản phẩm 2. Set quantity = 0 3. Click Save | Inline error trên hàng sản phẩm: "Số lượng phải ≥ 1" | P2 |
| TC-SUPP-ORD-014 | Add item with negative cost | Supplier order form | 1. Thêm sản phẩm 2. Enter cost = -500 3. Click Save | Inline error trên hàng sản phẩm: "Giá nhập phải ≥ 0" | P2 |

---

## 9. Debts (11 test cases)

| Test ID | Tiêu đề | Điều kiện tiên quyết | Các bước | Kết quả mong đợi | Priority |
|---------|---------|---------------------|---------|-----------------|----------|
| TC-DEBT-001 | Debts list displays | Customers with debt exist | 1. Navigate to /debts | Table shows customer, total debt, oldest debt date | P1 |
| TC-DEBT-002 | Debts sorted by highest amount | Customers with varying debts | 1. View debts list 2. Check sort order | Sorted descending by debt amount | P2 |
| TC-DEBT-003 | Search debtor by name | Multiple debtors | 1. Type customer name | List filters | P2 |
| TC-DEBT-004 | Customer detail - debt section | Customer detail page | 1. Click customer 2. View debts section | Shows total debt, list of unpaid orders | P2 |
| TC-DEBT-005 | Record payment from debts list | Customer with debt | 1. Click "Ghi nhận thanh toán" 2. Enter amount (số nguyên dương, VND không có decimal) 3. Save | Payment recorded, debt reduced; amount field chỉ nhận số nguyên dương | P2 |
| TC-DEBT-006 | Cannot record payment exceeding debt | Debt = 100,000 | 1. Try record payment 200,000 | Inline error dưới input số tiền: "Số tiền thanh toán không được vượt quá công nợ hiện tại"; dialog không đóng; Save disabled | P2 |
| TC-DEBT-007 | Debt cleared after full payment | Debt = 500,000 | 1. Record payment 500,000 | Debt removed from list | P2 |
| TC-DEBT-008 | Debt report - detail per customer | Customer with 3 unpaid orders + 1 partial payment | 1. Click customer debt detail 2. View orders 3. View payment history | All unpaid orders listed; payment timeline hiển thị: ngày, số tiền, phương thức thanh toán của từng lần ghi nhận | P3 |
| TC-DEBT-009 | Staff can access /debts | Staff logged in, debtors exist | 1. Login as Staff 2. Navigate to /debts | Debts page loads normally; Staff được phép xem /debts để thu tiền hàng ngày | P1 |
| TC-DEBT-010 | Manager can access /debts | Manager logged in | 1. Login as Manager 2. Navigate to /debts | Debts page loads normally | P2 |
| TC-DEBT-011 | Record payment with amount = 0 | Customer with debt | 1. Mở dialog "Ghi nhận thanh toán" 2. Nhập 0 3. Click Save | Inline error dưới field số tiền: "Số tiền phải lớn hơn 0"; dialog không đóng | P2 |

---

## 10. Expenses (Owner Only, 12 test cases)

| Test ID | Tiêu đề | Điều kiện tiên quyết | Các bước | Kết quả mong đợi | Priority |
|---------|---------|---------------------|---------|-----------------|----------|
| TC-EXP-001 | Expenses list displays (Owner only) | Owner logged in, expenses exist | 1. Navigate to /expenses | Table shows date, category, amount, description | P1 |
| TC-EXP-002 | Add expense | Owner logged in | 1. Click "Thêm chi phí" 2. Select category 3. Enter amount, description 4. Save | Expense created, appears in list | P1 |
| TC-EXP-003 | Expense categories dropdown | Expense form | 1. Click category select | Shows: Tiền thuê, Lương, Quảng cáo, Vận chuyển, Khác | P2 |
| TC-EXP-004 | Validate expense amount required | Add form | 1. Leave amount empty 2. Try save | Inline error dưới field số tiền: "Số tiền bắt buộc"; form không submit | P2 |
| TC-EXP-005 | Expense amount cannot be negative | Add form | 1. Enter negative amount 2. Try save | Inline error dưới field số tiền: "Số tiền phải > 0"; form không submit | P2 |
| TC-EXP-006 | Filter expenses by category | Expenses in multiple categories | 1. Select "Lương" filter | Only salary expenses shown | P2 |
| TC-EXP-007 | Filter expenses by date range | Expenses exist across dates | 1. Select date range 2. Apply | Only expenses in range shown | P2 |
| TC-EXP-008 | Staff cannot access /expenses | Staff logged in | 1. Navigate to /expenses | Redirect về dashboard; toast "Bạn không có quyền truy cập trang này" | P1 |
| TC-EXP-009 | Manager cannot access /expenses | Manager logged in | 1. Navigate to /expenses | Redirect về dashboard; toast "Bạn không có quyền truy cập trang này" | P1 |
| TC-EXP-010 | Add expense without selecting category | Expense form | 1. Leave category unselected 2. Enter amount 3. Click Save | Inline error dưới field danh mục: "Vui lòng chọn danh mục chi phí" | P2 |
| TC-EXP-011 | Edit expense | Owner logged in, expense exists | 1. Click edit trên expense row 2. Thay đổi amount và description 3. Save | Expense updated; new values hiển thị trong list | P2 |
| TC-EXP-012 | Delete expense | Owner logged in, expense exists | 1. Click delete trên expense row 2. Confirm dialog | Expense removed from list; toast thành công | P2 |

---

## 11. Analytics (Owner & Manager, 8 test cases)

| Test ID | Tiêu đề | Điều kiện tiên quyết | Các bước | Kết quả mong đợi | Priority |
|---------|---------|---------------------|---------|-----------------|----------|
| TC-ANALYTICS-001 | Analytics hub displays sub-sections | Owner/Manager logged in | 1. Navigate to /analytics | Shows: Overview, Finance, Inventory, Product Analytics | P1 |
| TC-ANALYTICS-002 | Overview dashboard loads | Analytics page | 1. View Overview tab | KPIs, charts, recent activities displayed | P2 |
| TC-ANALYTICS-003 | Finance analytics with date range | Owner logged in, Finance tab | 1. Select date range (e.g., this month) 2. View | Revenue, expenses, profit displayed | P2 |
| TC-ANALYTICS-004 | Finance daily breakdown | Date range selected | 1. View daily breakdown table | Shows: Date, Revenue, Expenses, Profit per day | P2 |
| TC-ANALYTICS-005 | Inventory analytics loads | Analytics page | 1. View Inventory tab | Stock levels, low-stock alerts, turnover shown | P3 |
| TC-ANALYTICS-006 | Staff cannot access analytics | Staff logged in | 1. Navigate to /analytics | Redirect về dashboard; toast "Bạn không có quyền truy cập trang này" | P1 |
| TC-ANALYTICS-007 | Product Analytics tab loads | Owner/Manager on analytics page | 1. Click "Product Analytics" sub-tab | Product performance data displayed (top sellers, revenue per product) | P2 |
| TC-ANALYTICS-008 | Analytics - empty state when no data in range | Date range có 0 giao dịch | 1. Chọn date range trong quá khứ xa không có data 2. View | Hiển thị empty state "Không có dữ liệu cho khoảng thời gian này" thay vì lỗi hoặc 0 | P3 |

---

## 12. Users / HR (Owner Only, 12 test cases)

| Test ID | Tiêu đề | Điều kiện tiên quyết | Các bước | Kết quả mong đợi | Priority |
|---------|---------|---------------------|---------|-----------------|----------|
| TC-USERS-001 | Users list displays (Owner only) | Owner logged in, users exist | 1. Navigate to /users | Table shows fullName, username, role, phone, status | P1 |
| TC-USERS-002 | Add user | Owner logged in | 1. Click "Thêm nhân viên" 2. Fill username, fullName, phone, role, password 3. Save | User created, appears in list | P1 |
| TC-USERS-003 | Set user role during creation | Add user form | 1. Select role dropdown | Shows: Owner, Manager, Staff options | P2 |
| TC-USERS-004 | Reset user password | User exists | 1. Click dropdown 2. "Reset Password" 3. Confirm | Dialog shows generated temporary password (8 chars); staff tự đổi mật khẩu nếu muốn (không bắt buộc) | P2 |
| TC-USERS-005 | Validate username unique | User "staff01" exists | 1. Try add user with same username "staff01" | Inline error dưới field username: "Username đã tồn tại"; form không submit | P2 |
| TC-USERS-006 | Staff cannot access /users | Staff logged in | 1. Navigate to /users | Redirect về dashboard; toast "Bạn không có quyền truy cập trang này" | P1 |
| TC-USERS-007 | Add user with weak password | Add user form | 1. Enter password "123" (< 6 ký tự) 2. Click Save | Inline error dưới field mật khẩu: "Mật khẩu tối thiểu 6 ký tự" | P2 |
| TC-USERS-008 | Add user without username | Add user form | 1. Leave username trống 2. Fill other fields 3. Click Save | Inline error dưới field username: "Username bắt buộc" | P2 |
| TC-USERS-009 | Manager cannot access /users | Manager logged in | 1. Navigate to /users | Redirect về dashboard; toast "Bạn không có quyền truy cập trang này" | P1 |
| TC-USERS-010 | Password change after reset (manual) | Owner reset staff password → temp 8-char | 1. Staff nhận temp password 2. Staff tự vào đổi mật khẩu nếu muốn | Staff có thể đổi mật khẩu bình thường; không bắt buộc force-change | P3 |
| TC-USERS-011 | Last Owner cannot be demoted or deactivated | Only 1 Owner exists in system | 1. Try change last Owner's role to Manager 2. Try deactivate last Owner | Action bị block; error toast: "Phải có ít nhất 1 Owner trong hệ thống" | P1 |
| TC-USERS-012 | Role change forces active session to re-login | Staff A đang đăng nhập; Owner đổi role A từ Staff → Manager | 1. Owner đổi role của Staff A 2. Staff A thực hiện action | Staff A nhận redirect về /login; toast "Quyền truy cập đã thay đổi, vui lòng đăng nhập lại" | P2 |
| TC-USERS-013 | Search users by name or username | 3+ users exist with different names | 1. Navigate to /users 2. Type partial name or username in search 3. Wait 300ms | List filters in real-time; chỉ hiển thị users có tên hoặc username khớp | P2 |
| TC-USERS-014 | Deactivate and reactivate non-owner user | Active non-Owner user exists | 1. Click dropdown on user row 2. Select "Deactivate" 3. Confirm; sau đó 4. Select "Activate" 5. Confirm | User status → inactive sau bước 3 (badge "Inactive" hiển thị, user không thể login); status → active sau bước 5 | P2 |

---

## 13. Settings (Owner Only, 11 test cases)

| Test ID | Tiêu đề | Điều kiện tiên quyết | Các bước | Kết quả mong đợi | Priority |
|---------|---------|---------------------|---------|-----------------|----------|
| TC-SETTINGS-001 | Settings page accessible (Owner only) | Owner logged in | 1. Navigate to /settings | Tabs "Danh mục điều hướng" và "Banners" hiển thị | P1 |
| TC-SETTINGS-002 | Customer tier config dialog - update thresholds | Owner logged in, /customers | 1. Click nút cài đặt tier 2. Đổi loyalMinSpent = 3,000,000 3. Click "Lưu cấu hình" | Config saved; customer tier badges recalculated immediately trên customer list | P2 |
| TC-SETTINGS-004 | Manage banners - add | Banners section | 1. Click "Thêm banner" 2. Upload image, add title, URL, chọn position (top/middle/bottom), set status (active/inactive) 3. Save | Banner created; appears in list với đúng position + status hiển thị | P2 |
| TC-SETTINGS-005 | Manage banners - reorder | 2+ banners exist | 1. Drag banner to new position 2. Save | Order updated | P3 |
| TC-SETTINGS-006 | Staff cannot access /settings | Staff logged in | 1. Navigate to /settings | Redirect về dashboard; toast "Bạn không có quyền truy cập trang này" | P1 |
| TC-SETTINGS-007 | Tier threshold update recalculates customer badges | Customer "A" total_spent=5,500,000 (Thân thiết, loyalMinSpent=5,000,000) | 1. Open tier config dialog (từ /customers) 2. Đổi loyalMinSpent = 6,000,000 3. Save 4. View customer list | Customer "A" không còn đủ Thân thiết; badge cập nhật (xuống Mua nhiều nếu đạt frequent, hoặc không có badge) | P2 |
| TC-SETTINGS-008 | Banner reorder persists after page reload | 3 banners in order [A, B, C] | 1. Drag B to first position 2. Save 3. Reload page | Order remains [B, A, C] | P2 |
| TC-SETTINGS-011 | Add banner without image | Banners section | 1. Click "Thêm banner" 2. Fill title & URL 3. Leave image trống 4. Save | Inline error: "Vui lòng upload ảnh banner" | P2 |
| TC-SETTINGS-012 | Manager cannot access /settings | Manager logged in | 1. Navigate to /settings | Redirect về dashboard; toast "Bạn không có quyền truy cập trang này" | P1 |
| TC-SETTINGS-014 | Edit banner - update title and URL | Banner exists | 1. Click edit on banner 2. Change title + URL 3. Save | Banner updated; new title + URL hiển thị trong list | P2 |
| TC-SETTINGS-015 | Delete banner | Banner exists | 1. Click delete on banner 2. Confirm | Banner removed from list; toast thành công | P2 |

---

## 14. Chat (7 test cases)

| Test ID | Tiêu đề | Điều kiện tiên quyết | Các bước | Kết quả mong đợi | Priority |
|---------|---------|---------------------|---------|-----------------|----------|
| TC-CHAT-001 | Chat rooms list displays | Chat rooms exist | 1. Navigate to /chat | List shows customer name, last message, time, unread count | P1 |
| TC-CHAT-002 | Search chat room | Multiple rooms | 1. Type customer name in search | List filters to matching room | P2 |
| TC-CHAT-003 | Open chat room - view messages | Room with message history | 1. Click room 2. View chat | Messages display with sender, timestamp, content | P2 |
| TC-CHAT-004 | Send message | Chat room open | 1. Type message in input 2. Click send | Message appears in thread, sent status shown | P1 |
| TC-CHAT-005 | Message input disabled when empty or whitespace-only | Chat open | 1. Leave input empty 2. Type "   " (spaces only) | Send button disabled trong cả hai trường hợp | P3 |
| TC-CHAT-006 | Scroll chat history | Room with 50+ messages | 1. Scroll up to load older messages | Earlier messages displayed | P3 |
| TC-CHAT-007 | Send message fails (network error) | Chat open, network disconnected | 1. Disconnect network 2. Type message 3. Click send | Message hiển thị trạng thái "failed" với nút retry; error toast "Gửi tin nhắn thất bại" | P2 |

---

## 15. Error Handling & Edge Cases (13 test cases)

| Test ID | Tiêu đề | Điều kiện tiên quyết | Các bước | Kết quả mong đợi | Priority |
|---------|---------|---------------------|---------|-----------------|----------|
| TC-ERROR-001 | Network error - no internet | Any page loaded | 1. Disconnect network 2. Try action (e.g., save product) | Error toast "Mất kết nối", user can retry when online | P2 |
| TC-ERROR-002 | API timeout - slow response | Save form action | 1. Trigger save 2. Wait 30+ seconds | Loading spinner persists, option to cancel/retry | P2 |
| TC-ERROR-003 | Session expired during form submission | Form filled, session expires | 1. Fill long form 2. Wait until session expires 3. Submit | Redirect về /login; toast "Phiên đăng nhập hết hạn"; form data mất (không draft localStorage) | P2 |
| TC-ERROR-004 | Invalid response from API | API returns malformed data | 1. Trigger action with bad backend | Error toast, graceful handling, no crash | P2 |
| TC-ERROR-005 | Concurrent edit - last write wins | Two users edit same product simultaneously | 1. User1 & User2 đều mở form edit product 2. User1 save trước 3. User2 save sau | User2's save thành công; User2's data ghi đè User1's data (last-write-wins, no conflict warning) | P3 |
| TC-ERROR-006 | Empty list - empty state message | Navigate to product list with no products | 1. Go to /products, 0 products in DB | Display "Không có sản phẩm" + link to create | P2 |
| TC-ERROR-007 | Large data load - pagination works | 10,000+ products | 1. Navigate /products 2. Load multiple pages | Each page loads in <2 seconds | P3 |
| TC-ERROR-008 | File upload - oversized image | Upload > 10MB image | 1. Try upload large file | Inline error dưới upload field: "File quá lớn, max 10MB"; file không được lưu | P2 |
| TC-ERROR-009 | Form validation - missing required field | Any form | 1. Leave required field empty 2. Try submit | Error message under field, focus field | P2 |
| TC-ERROR-010 | Mobile responsiveness - sidebar collapse | Desktop or mobile | 1. Resize to viewport ≤768px 2. Check sidebar | Sidebar collapses/hides, menu icon appears | P3 |
| TC-ERROR-011 | Inline error clears when user corrects field | Form with inline validation error showing | 1. See inline error dưới field email 2. Correct value 3. Move focus ra khỏi field (onBlur) | Inline error biến mất khi blur; error không chờ đến submit | P3 |
| TC-ERROR-012 | Form data preserved after server error 500 | Form filled với dữ liệu đầy đủ | 1. Fill form completely 2. Backend returns 500 3. Check form | All field values còn nguyên; error toast "Lỗi máy chủ, vui lòng thử lại"; form không bị clear | P2 |
| TC-ERROR-013 | Optimistic UI rollback when status update fails | Order status=Pending | 1. Click status dropdown 2. Select "Confirmed" (optimistic update shown) 3. API returns 500 | UI rollback về Pending; error toast "Không thể cập nhật trạng thái"; status dropdown hiển thị lại Pending | P2 |

---

## Summary

**Total Test Cases:** 205

**Coverage by Module:**
- Authentication & RBAC: 16 (P1: 9, P2: 6, P3: 1)
- Dashboard: 9 (P1: 1, P2: 5, P3: 3)
- Products: 24 (P1: 4, P2: 17, P3: 3)
- Categories: 9 (P1: 3, P2: 5, P3: 1)
- Orders: 28 (P1: 5, P2: 20, P3: 3)
- Customers: 18 (P1: 2, P2: 15, P3: 1)
- Suppliers: 10 (P1: 2, P2: 7, P3: 1)
- Supplier Orders: 14 (P1: 3, P2: 10, P3: 1)
- Debts: 11 (P1: 2, P2: 8, P3: 1)
- Expenses: 12 (P1: 3, P2: 8, P3: 1)
- Analytics: 8 (P1: 2, P2: 4, P3: 2)
- Users/HR: 14 (P1: 5, P2: 8, P3: 1)
- Settings: 11 (P1: 2, P2: 8, P3: 1)
- Chat: 7 (P1: 1, P2: 3, P3: 3)
- Error Handling: 13 (P1: 0, P2: 8, P3: 5)

**Business Rules Decided:**
- Duplicate product/supplier names: allowed
- Overpayment on debt: rejected with error
- HR (admin staff) password reset: 8-char temp password, no force-change required (staff tự đổi nếu muốn)
- Category deletion: blocked if has products OR subcategories
- Fulfillment status flow: pending → stock_out → completed (sequential, no skip); cancelled is terminal
- Customer delete: deactivate only (no hard-delete)
- Customer tiers: 2 fixed tiers ("Thân thiết" = loyal, "Mua nhiều" = frequent); configurable 4-field thresholds from /customers page; boundary = OR logic (meets minOrders OR minSpent)
- Concurrent edit: last-write-wins (no conflict warning)
- Session expired form: data lost (no localStorage draft)
- Role change: active session force re-login
- Last Owner: cannot be demoted or deactivated
- /debts access: all 3 roles (Staff included)
- Variant price history: tracks price (not cost)
- Payment amounts: integer (VND, no decimal)
- Banner positions: top / middle / bottom
- Actor in history logs: fullName
- Tier recalculates on order cancel/refund
- Expense edit/delete: in scope v1
- API-level RBAC tests: out of scope for this UI test suite

---

End of Test Cases
