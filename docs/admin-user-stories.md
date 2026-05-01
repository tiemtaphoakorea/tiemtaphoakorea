---
id: ADMIN-USER-STORIES
type: user-stories
status: active
project: K-SMART Admin Panel
created: 2026-04-30
---

# User Stories — K-SMART Admin Panel

Các user story cho K-SMART Admin Panel theo vai trò: Owner, Manager, Staff.

**Vai trò:**
- **Owner** — Truy cập đầy đủ toàn bộ module
- **Manager** — Truy cập vận hành + Analytics, không Users/Expenses/Settings
- **Staff** — Chỉ vận hành (Products, Orders, Customers, Suppliers, Chat)

---

## 1. Xác Thực & Phiên Làm Việc

### US-AUTH-001
**Là** một nhân viên,
**Tôi muốn** đăng nhập bằng tên đăng nhập (username) và mật khẩu,
**Để** truy cập bảng điều khiển admin.

**Acceptance Criteria:**
- Hiển thị form đăng nhập trên `/login` với field "Tên đăng nhập" và "Mật khẩu"
- Xác thực username + password hợp lệ
- Lưu session cookie `admin_session` và redirect đến dashboard
- Hiển thị thông báo lỗi nếu username/password sai

### US-AUTH-002
**Là** một admin,
**Tôi muốn** đăng xuất khỏi hệ thống,
**Để** bảo vệ tài khoản khi rời khỏi máy.

**Acceptance Criteria:**
- Nút logout ở footer sidebar
- Xóa session và redirect về `/login`
- Thành công hiển thị toast thông báo
- Session tự động hết hạn sau 30 phút idle; redirect về `/login` với toast "Phiên đăng nhập hết hạn"
- Đăng nhập mới thay thế session cũ trên cùng browser; session cũ không còn hợp lệ

### US-AUTH-003
**Là** một Staff,
**Tôi muốn** thấy chỉ các module cho phép (không Users, Expenses, Analytics),
**Để** không nhầm lẫn hoặc cố truy cập vùng cấm.

**Acceptance Criteria:**
- Sidebar ẩn Users, Expenses, Analytics, Settings cho Staff
- Chat, Products, Orders, Customers, Suppliers, Supplier Orders, Debts hiển thị cho cả 3 vai trò
- Nếu truy cập trực tiếp URL bị cấm, chuyển hướng về dashboard với thông báo lỗi
- Manager thấy Analytics, Staff không thấy
- Manager không thấy Users, Expenses, Settings

---

## 2. Dashboard & Báo Cáo

### US-DASH-001
**Là** một Owner/Manager/Staff,
**Tôi muốn** xem dashboard tổng quan khi đăng nhập,
**Để** nắm bắt tình hình kinh doanh ngay lập tức.

**Acceptance Criteria:**
- Hiển thị KPI: Doanh thu hôm nay, Số đơn, Khách hàng mới
- Hiển thị so sánh với ngày hôm qua
- Load trong 2 giây

### US-DASH-002
**Là** một Owner/Manager,
**Tôi muốn** xem báo cáo chi tiết (Analytics) với các bộ lọc theo thời gian,
**Để** phân tích xu hướng bán hàng.

**Acceptance Criteria:**
- Trang Analytics với hub/overview
- Sub-navigation: Overview, Finance, Inventory, Product Analytics
- Bộ lọc theo ngày/tuần/tháng

### US-DASH-003
**Là** một Owner,
**Tôi muốn** xem báo cáo tài chính (doanh thu, chi phí, lợi nhuận),
**Để** theo dõi sức khỏe tài chính.

**Acceptance Criteria:**
- Trang Finance Analytics với date range picker
- Hiển thị daily breakdown doanh thu/chi phí
- Tính toán lợi nhuận tự động

---

## 3. Quản Lý Sản Phẩm

### US-PROD-001
**Là** một Staff/Manager/Owner,
**Tôi muốn** xem danh sách sản phẩm với tìm kiếm và phân trang,
**Để** nhanh chóng tìm thấy sản phẩm cần quản lý.

**Acceptance Criteria:**
- Hiển thị bảng với tên, giá, tồn kho, danh mục
- Tìm kiếm theo tên (real-time với debounce)
- Phân trang 10/25/50 items
- Lọc theo danh mục

### US-PROD-002
**Là** một Staff/Manager/Owner,
**Tôi muốn** thêm sản phẩm mới với chi tiết, giá, biến thể,
**Để** bổ sung các mặt hàng mới vào kho.

**Acceptance Criteria:**
- Form thêm sản phẩm: tên, mô tả, giá, chi phí, danh mục
- Upload ảnh sản phẩm
- Thêm biến thể (size, màu)
- Lưu thành công hiển thị toast
- Cho phép trùng tên sản phẩm (không có ràng buộc unique trên name; products phân biệt bởi ID)

### US-PROD-003
**Là** một Staff/Manager/Owner,
**Tôi muốn** chỉnh sửa thông tin sản phẩm (giá, tồn kho, biến thể),
**Để** cập nhật khi thay đổi.

**Acceptance Criteria:**
- Form sửa sản phẩm từ /products/[id]/edit
- Cho phép sửa giá, chi phí, tồn kho
- Quản lý biến thể (thêm/sửa/xóa)
- Lưu thành công cập nhật danh sách

### US-PROD-004
**Là** một Staff/Manager/Owner,
**Tôi muốn** xóa sản phẩm (một hoặc nhiều),
**Để** loại bỏ hàng không cần quản lý nữa.

**Acceptance Criteria:**
- Dropdown menu xóa trên mỗi hàng
- Nhấn xóa → hiển thị confirm dialog
- Xóa 1 sản phẩm hoặc chọn nhiều xóa hàng loạt
- Cập nhật danh sách sau xóa
- Không cho phép xóa sản phẩm đang có đơn hàng chưa hoàn thành; hiển thị lỗi "Sản phẩm có đơn hàng, không thể xóa"

### US-PROD-005
**Là** một Staff/Manager/Owner,
**Tôi muốn** xem lịch sử thay đổi giá bán của biến thể,
**Để** audit thay đổi giá.

**Acceptance Criteria:**
- Trang variant detail hiển thị history
- Bảng: Ngày, Giá cũ, Giá mới, Người thay đổi

---

## 4. Quản Lý Danh Mục

### US-CAT-001
**Là** một Staff/Manager/Owner,
**Tôi muốn** xem cây danh mục sản phẩm,
**Để** tổ chức sản phẩm theo loại.

**Acceptance Criteria:**
- Hiển thị danh mục dạng tree hoặc flat list
- Cho phép thêm danh mục cha/con
- Hiển thị số sản phẩm trong mỗi danh mục

### US-CAT-002
**Là** một Staff/Manager/Owner,
**Tôi muốn** thêm/sửa/xóa danh mục,
**Để** quản lý phân loại sản phẩm.

**Acceptance Criteria:**
- Form thêm danh mục: tên, danh mục cha
- Sửa tên danh mục, chuyển danh mục cha
- Xóa danh mục rỗng (không có sản phẩm và không có danh mục con)
- Không xóa nếu còn sản phẩm hoặc còn danh mục con; hiển thị thông báo lỗi tương ứng

---

## 5. Quản Lý Đơn Hàng

### US-ORD-001
**Là** một Staff/Manager/Owner,
**Tôi muốn** xem danh sách đơn hàng với tìm kiếm, bộ lọc,
**Để** nhanh chóng xác định đơn cần xử lý.

**Acceptance Criteria:**
- Bảng đơn hàng: ID, Khách, Tổng tiền, Trạng thái thanh toán, Trạng thái vận chuyển
- Tìm kiếm theo ID hoặc tên khách
- Lọc theo trạng thái thanh toán (All, Pending, Paid, Failed)
- Lọc theo trạng thái vận chuyển (Chờ xử lý, Đã xuất kho, Hoàn tất)
- Lọc "Công nợ" (chỉ đơn chưa thanh toán)
- Phân trang

### US-ORD-002
**Là** một Staff/Manager/Owner,
**Tôi muốn** xem chi tiết đơn hàng (items, địa chỉ, lịch sử),
**Để** kiểm tra thông tin đơn trước khi xử lý.

**Acceptance Criteria:**
- Trang detail `/orders/[id]`
- Hiển thị danh sách sản phẩm, giá, số lượng
- Hiển thị địa chỉ giao hàng
- Lịch sử trạng thái (timeline)
- Trạng thái thanh toán

### US-ORD-003
**Là** một Staff/Manager/Owner,
**Tôi muốn** tạo đơn hàng mới từ admin,
**Để** xử lý đơn từ các kênh khác (điện thoại, offline).

**Acceptance Criteria:**
- Form tạo đơn: chọn khách, thêm sản phẩm
- Tính tổng tiền tự động
- Chọn địa chỉ giao hàng
- Lưu & redirect đến detail order

### US-ORD-004
**Là** một Staff/Manager/Owner,
**Tôi muốn** cập nhật trạng thái vận chuyển (Chờ xử lý → Đã xuất kho → Hoàn tất),
**Để** theo dõi tiến độ giao hàng.

**Acceptance Criteria:**
- Dropdown cập nhật fulfillment status
- Chỉ cho phép chuyển trạng thái theo thứ tự: pending → stock_out → completed (không bỏ bước)
- Mỗi lần thay đổi lưu vào history với timestamp và fullName người thực hiện
- Option tiếp theo bị disabled nếu chưa qua bước trước (e.g., "Hoàn tất" disabled khi đang "Chờ xử lý")
- Đơn đã Hoàn tất (completed) không thể chỉnh sửa; tất cả fields disabled với banner "Đơn đã giao, không thể chỉnh sửa"

### US-ORD-005
**Là** một Staff/Manager/Owner,
**Tôi muốn** ghi nhận thanh toán cho đơn hàng,
**Để** cập nhật công nợ khách.

**Acceptance Criteria:**
- Button "Ghi nhận thanh toán" (Record Payment)
- Dialog nhập số tiền, phương thức, ghi chú
- Cập nhật payment status → Paid
- Lưu vào lịch sử thanh toán

### US-ORD-006
**Là** một Staff/Manager/Owner,
**Tôi muốn** hủy đơn hàng,
**Để** xử lý đơn nhầm hoặc hủy theo yêu cầu khách.

**Acceptance Criteria:**
- Button "Hủy đơn"
- Confirm dialog
- Khôi phục tồn kho sản phẩm
- Ghi nhận thay đổi trong lịch sử

### US-ORD-007
**Là** một Staff/Manager/Owner,
**Tôi muốn** xem thống kê đơn hàng (số đơn, tổng doanh thu, top khách),
**Để** đánh giá hiệu suất bán hàng.

**Acceptance Criteria:**
- Widget Order Stats trên trang orders
- Hiển thị: Total Orders, Revenue, Avg Order Value
- Biểu đồ theo thời gian

---

## 6. Quản Lý Khách Hàng

### US-CUST-001
**Là** một Staff/Manager/Owner,
**Tôi muốn** xem danh sách khách hàng với tìm kiếm,
**Để** nhanh chóng tìm thông tin khách.

**Acceptance Criteria:**
- Bảng: Tên, Điện thoại, Loại (sỉ/lẻ), Tổng chi tiêu, Tier badge, Trạng thái
- Tìm kiếm theo tên/điện thoại (real-time)
- Lọc theo loại khách (wholesale/retail)
- Lọc theo trạng thái (active/inactive)
- Hiển thị tier badge: "Thân thiết" (loyal) hoặc "Mua nhiều" (frequent); không có badge nếu chưa đạt ngưỡng
- Phân trang

### US-CUST-002
**Là** một Staff/Manager/Owner,
**Tôi muốn** thêm khách hàng mới,
**Để** quản lý khách mới trong hệ thống.

**Acceptance Criteria:**
- Sheet form: Tên (bắt buộc), Điện thoại, Địa chỉ, Loại
- Validate số điện thoại: 10 chữ số, bắt đầu bằng 0; không trùng với khách khác
- Chọn loại (wholesale/retail)
- Lưu thành công hiển thị toast

### US-CUST-003
**Là** một Staff/Manager/Owner,
**Tôi muốn** chỉnh sửa thông tin khách,
**Để** cập nhật khi khách thay đổi thông tin.

**Acceptance Criteria:**
- Sheet form sửa khách (tương tự thêm)
- Cho phép sửa tên, điện thoại, địa chỉ, loại
- Lưu cập nhật danh sách

### US-CUST-004
**Là** một Owner/Manager,
**Tôi muốn** xem trang chi tiết khách (profile, lịch sử mua, công nợ),
**Để** hiểu rõ về khách và quản lý tài chính.

**Acceptance Criteria:**
- Trang `/customers/[id]`
- Sections: Profile info, Financial stats, Order history, Location
- Hiển thị: Tổng chi tiêu (không tính đơn cancelled), Công nợ, Đơn hàng gần đây

### US-CUST-005
**Là** một Staff/Manager/Owner,
**Tôi muốn** kích hoạt/vô hiệu hóa tài khoản khách,
**Để** kiểm soát truy cập của khách.

**Acceptance Criteria:**
- Dropdown menu "Activate/Deactivate"
- Confirm dialog
- Cập nhật trạng thái khách

### US-CUST-006
**Là** một Owner/Manager,
**Tôi muốn** xem tier của khách (tier badge),
**Để** nhận diện khách VIP.

**Acceptance Criteria:**
- 2 tier: "Thân thiết" (loyal) và "Mua nhiều" (frequent); ngưỡng cấu hình được qua dialog từ /customers
- Tier tính theo OR logic: đạt minOrders HOẶC minSpent là đủ
- "Thân thiết" ưu tiên cao hơn "Mua nhiều" (hiển thị badge Thân thiết nếu đạt cả hai)
- Hiển thị tier badge trên danh sách khách; không có badge nếu chưa đạt ngưỡng nào
- Khi đơn hàng bị hủy, total_spent được tính lại (bỏ đơn cancelled) và tier badge tự động cập nhật

---

## 7. Quản Lý Nhà Cung Cấp

### US-SUPP-001
**Là** một Staff/Manager/Owner,
**Tôi muốn** xem danh sách nhà cung cấp,
**Để** quản lý các NCC.

**Acceptance Criteria:**
- Bảng: Tên, Email, Điện thoại, Địa chỉ, Số đơn
- Tìm kiếm theo tên/email
- Hiển thị thống kê NCC (số đơn, tổng chi phí)
- Phân trang

### US-SUPP-002
**Là** một Staff/Manager/Owner,
**Tôi muốn** thêm/sửa nhà cung cấp,
**Để** quản lý thông tin NCC.

**Acceptance Criteria:**
- Form: Tên, Email, Điện thoại, Địa chỉ
- Thêm & sửa qua sheet form
- Validate dữ liệu
- Cập nhật danh sách
- Xóa nhà cung cấp chỉ khi không có đơn nhập hàng; nếu có đơn → error toast "Không thể xóa nhà cung cấp có đơn nhập hàng"

---

## 8. Quản Lý Đơn Nhập Hàng

### US-SUPP-ORD-001
**Là** một Staff/Manager/Owner,
**Tôi muốn** xem danh sách đơn nhập hàng từ NCC,
**Để** theo dõi nhập kho.

**Acceptance Criteria:**
- Bảng: ID, NCC, Ngày, Trạng thái, Tổng giá
- Lọc theo trạng thái (Pending, Confirmed, Delivered, Cancelled)
- Tìm kiếm theo ID/NCC
- Phân trang

### US-SUPP-ORD-002
**Là** một Staff/Manager/Owner,
**Tôi muốn** tạo đơn nhập hàng,
**Để** đặt hàng từ NCC.

**Acceptance Criteria:**
- Form: Chọn NCC, thêm sản phẩm (quantity, cost)
- Tính tổng giá tự động
- Lưu & redirect đến detail

### US-SUPP-ORD-003
**Là** một Staff/Manager/Owner,
**Tôi muốn** cập nhật trạng thái đơn nhập,
**Để** theo dõi giai đoạn nhập hàng.

**Acceptance Criteria:**
- Cập nhật trạng thái: Pending → Confirmed → Delivered
- Khi Delivered, cập nhật tồn kho tự động
- Ghi nhận lịch sử thay đổi

---

## 9. Quản Lý Công Nợ (Debts)

### US-DEBT-001
**Là** một Staff/Manager/Owner,
**Tôi muốn** xem danh sách công nợ theo khách,
**Để** theo dõi ai còn nợ.

**Acceptance Criteria:**
- Trang Debts hiển thị: Khách, Tổng nợ, Ngày nợ lâu nhất
- Sắp xếp theo nợ cao nhất
- Lọc theo mức nợ (optional)
- Click khách → detail trang khách

### US-DEBT-002
**Là** một Staff/Manager/Owner,
**Tôi muốn** ghi nhận thanh toán nợ cho khách,
**Để** giảm công nợ.

**Acceptance Criteria:**
- Nút "Ghi nhận thanh toán" ở detail khách hoặc danh sách nợ
- Dialog: Nhập số tiền, phương thức, ghi chú
- Lưu & cập nhật tổng nợ

### US-DEBT-003
**Là** một Staff/Manager/Owner,
**Tôi muốn** xem báo cáo công nợ (customer debt detail),
**Để** phân tích và thu hồi công nợ.

**Acceptance Criteria:**
- Trang detail nợ theo khách: danh sách đơn nợ, timeline thanh toán
- Hiển thị: Đơn, Số tiền, Ngày, Thanh toán
- Tất cả 3 roles được xem /debts (Staff cần để thu tiền hàng ngày)

---

## 10. Quản Lý Chi Phí (Owner Only)

### US-EXP-001
**Là** một Owner,
**Tôi muốn** ghi nhận chi phí vận hành,
**Để** theo dõi chi phí kinh doanh.

**Acceptance Criteria:**
- Form thêm chi phí: Danh mục, Số tiền, Mô tả, Ngày
- Danh mục: Tiền thuê, Lương, Quảng cáo, Vận chuyển, Khác
- Lưu thành công cập nhật danh sách
- Cho phép sửa và xóa chi phí đã tạo

### US-EXP-002
**Là** một Owner,
**Tôi muốn** xem danh sách chi phí theo thời gian,
**Để** phân tích chi phí theo kỳ.

**Acceptance Criteria:**
- Bảng chi phí: Ngày, Danh mục, Số tiền, Mô tả
- Lọc theo danh mục & khoảng thời gian
- Tổng chi phí theo danh mục (widget)

---

## 11. Quản Lý Nhân Sự (Owner Only)

### US-HR-001
**Là** một Owner,
**Tôi muốn** xem danh sách nhân viên admin (Users),
**Để** quản lý nhân sự nội bộ.

**Acceptance Criteria:**
- Bảng: Tên đầy đủ, Username, Vai trò (Owner/Manager/Staff), Điện thoại, Trạng thái
- Hiển thị trạng thái active/inactive
- Tìm kiếm theo tên/username
- Owner duy nhất trong hệ thống không thể bị đổi vai trò hoặc deactivate
- Khi Owner thay đổi vai trò của nhân viên đang đăng nhập, session của nhân viên đó bị vô hiệu hóa và yêu cầu đăng nhập lại

### US-HR-002
**Là** một Owner,
**Tôi muốn** thêm nhân viên mới,
**Để** cấp quyền truy cập admin mới.

**Acceptance Criteria:**
- Form: Username, Tên đầy đủ, Điện thoại, Vai trò, Mật khẩu
- Validate username chưa tồn tại
- Lưu & hiển thị danh sách

### US-HR-003
**Là** một Owner,
**Tôi muốn** reset mật khẩu nhân viên,
**Để** hỗ trợ nhân viên quên mật khẩu.

**Acceptance Criteria:**
- Dropdown menu "Reset Password"
- Generate mật khẩu tạm (random 8 ký tự), hiển thị ngay trong dialog để admin thông báo cho nhân viên
- Nhân viên tự đổi mật khẩu nếu muốn (không bắt buộc force-change)
- Thông báo thành công

---

## 12. Cài Đặt (Owner Only)

### US-SETTINGS-001
**Là** một Owner,
**Tôi muốn** cấu hình ngưỡng tầng khách (customer tier thresholds),
**Để** điều chỉnh điều kiện đạt tier "Thân thiết" và "Mua nhiều".

**Acceptance Criteria:**
- Dialog cấu hình tier truy cập từ trang /customers (không phải /settings)
- 4 trường cấu hình: loyalMinOrders, loyalMinSpent, frequentMinOrders, frequentMinSpent
- Lưu dưới dạng 1 object config duy nhất (PUT /api/admin/settings/customer-tier)
- Lưu thành công → tier badge của tất cả khách được tính lại ngay

### US-SETTINGS-002
**Là** một Owner,
**Tôi muốn** quản lý banner quảng cáo,
**Để** hiển thị banner trên storefront.

**Acceptance Criteria:**
- Trang Settings → Banners
- Thêm: Upload ảnh, tiêu đề, URL, vị trí, trạng thái
- Sửa/Xóa banner
- Sắp xếp thứ tự (drag & drop)

---

## 13. Chat (Nhắn Tin)

### US-CHAT-001
**Là** một Staff/Manager/Owner,
**Tôi muốn** xem hộp thư chat với khách,
**Để** trả lời tin nhắn từ khách.

**Acceptance Criteria:**
- Trang Chat với danh sách phòng
- Hiển thị: Khách, Tin nhắn cuối, Thời gian, Unread count
- Tìm kiếm phòng chat theo tên khách
- Click vào phòng → chi tiết chat

### US-CHAT-002
**Là** một Staff/Manager/Owner,
**Tôi muốn** gửi tin nhắn cho khách,
**Để** liên lạc và hỗ trợ khách.

**Acceptance Criteria:**
- Chat input area ở detail phòng
- Gửi tin nhắn text
- Hiển thị tin nhắn sent/received
- Scroll lên xem lịch sử cũ

---

## 14. Cross-Cutting (Error Handling & UX)

### US-CROSS-001
**Là** một admin (mọi role),
**Tôi muốn** nhận phản hồi rõ ràng khi thao tác thất bại,
**Để** biết lỗi ở đâu và cách khắc phục.

**Acceptance Criteria:**
- Validation error hiển thị inline dưới field tương ứng; form không submit
- Lỗi network/server hiển thị toast đỏ với text mô tả lỗi + nút retry (nếu có thể)
- Inline error biến mất khi user sửa giá trị field thành hợp lệ
- Dữ liệu form được giữ nguyên sau khi server trả về lỗi 500; form không bị clear
- Khi thao tác optimistic UI thất bại (status update, etc.), UI rollback về trạng thái trước với toast thông báo
- Redirect sau RBAC block hiển thị toast "Bạn không có quyền truy cập trang này"
- Trên viewport ≤768px, sidebar thu gọn và hiện menu icon

---

End of User Stories
