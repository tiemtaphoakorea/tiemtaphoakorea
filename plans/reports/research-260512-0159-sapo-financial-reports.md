# Nghiên cứu: Báo cáo Tài chính Sapo

**Nguồn:** https://help.sapo.vn/tong-quan-bao-cao-tai-chinh
**Ngày:** 2026-05-12

## Tổng quan

Sapo có 3 báo cáo tài chính chính:
1. **Báo cáo lãi lỗ**
2. **Báo cáo công nợ khách hàng**
3. **Báo cáo công nợ nhà cung cấp**

Đường dẫn truy cập chung: `Danh mục > Báo cáo > Báo cáo tài chính > [Tên báo cáo]`

---

## 1. Báo cáo Lãi Lỗ

### Bộ lọc
- **Thời gian**: Kỳ hiện tại, 30 ngày trước, tháng trước, tuần trước, tùy chỉnh
- **Chi nhánh**: Theo từng chi nhánh hoặc tất cả

### Chỉ số chính

| Chỉ số | Công thức |
|--------|-----------|
| **Doanh thu bán hàng** | Tiền hàng thực bán + VAT + phí giao hàng − chiết khấu |
| **Chi phí bán hàng** | Giá vốn hàng hoá + thanh toán điểm + phí giao hàng shop trả |
| **Thu nhập khác** | Phiếu thu + phí khách trả hàng |
| **Chi phí khác** | Phiếu chi tạo thủ công |
| **Lợi nhuận** | Doanh thu + Thu nhập khác − Chi phí bán hàng − Chi phí khác |

### Tùy chọn hiển thị thêm
Nút "Tùy chọn hiển thị" bật 3 chỉ số: **Lợi nhuận gộp**, **Lợi nhuận ròng**, **Lợi nhuận khác**

### Cấu trúc bảng
So sánh **Kỳ trước** | **Kỳ hiện tại** | **% thay đổi**

### Thao tác
- Xuất Excel (tổng quan)
- Xuất chi tiết từng loại phiếu thu/chi
- Nút giải thích thuật ngữ

### Quyền
`Báo cáo > Báo cáo lãi lỗ`

---

## 2. Báo cáo Công nợ Khách hàng

### Bộ lọc
- Nhân viên phụ trách
- Nhóm khách hàng (VIP, lẻ, doanh nghiệp...)
- Khoảng giá trị nợ cuối kỳ
- Tìm theo mã/tên/SĐT

### Chỉ số

| Chỉ số | Ý nghĩa |
|--------|---------|
| **Nợ đầu kỳ** | Công nợ tới hết ngày trước kỳ |
| **Nợ tăng trong kỳ** | Tiền khách phải trả + phiếu chi + hoàn trả |
| **Nợ giảm trong kỳ** | Phiếu thu + trả hàng + hủy đơn |
| **Nợ cuối kỳ** | Nợ đầu kỳ + nợ còn trong kỳ |

### Cột bảng
Mã/tên/SĐT khách → Nhân viên phụ trách → Nợ đầu kỳ → Nợ tăng → Nợ giảm → Nợ cuối kỳ

### Thao tác
- Click "Nợ tăng/giảm" → xem chi tiết giao dịch
- ⚙️ tùy chỉnh cột
- Sort theo "Nợ cuối kỳ"
- Xuất file: **tổng quan** hoặc **chi tiết** (kèm sản phẩm, giá, chiết khấu)
- Mặc định chỉ hiện khách có nợ ≠ 0 (có thể tắt filter)

---

## 3. Báo cáo Công nợ Nhà cung cấp

### Bộ lọc
- Nhân viên phụ trách
- Nhóm NCC
- Khoảng giá trị nợ cuối kỳ
- Tìm theo mã/tên/SĐT NCC
- Mặc định chỉ hiện NCC có nợ ≠ 0

### Chỉ số

| Chỉ số | Ý nghĩa |
|--------|---------|
| **Nợ đầu kỳ** | Dương = cửa hàng nợ NCC; Âm = NCC nợ cửa hàng |
| **Nợ tăng trong kỳ** | Nhập hàng + phiếu thu trả hàng |
| **Nợ giảm trong kỳ** | Thanh toán + giá trị hàng trả lại |
| **Nợ còn trong kỳ** | Nợ tăng − nợ giảm |
| **Nợ cuối kỳ** | Nợ đầu kỳ + nợ còn trong kỳ |

### Logic phát sinh công nợ
- Đơn nhập hàng → **tăng nợ**
- Trả hàng nhập → **giảm nợ**
- Phiếu chi/thanh toán → **giảm nợ**
- Phiếu thu trả hàng → **giảm nợ**

### Thao tác
- Sort theo "Nợ cuối kỳ" (A-Z / Z-A)
- Click số liệu nợ tăng/giảm → chi tiết giao dịch
- ⚙️ tùy chỉnh cột
- Xuất file: tổng quan hoặc chi tiết theo giao dịch

### Quyền
`Báo cáo công nợ khách hàng/nhà cung cấp` (chung 1 quyền cho cả 2 báo cáo)

---

## Insights cho project (auth_shop_platform)

1. **Cấu trúc kỳ báo cáo** dùng pattern: Nợ đầu kỳ + (Tăng − Giảm) = Nợ cuối kỳ → cần snapshot công nợ tại thời điểm.
2. **Báo cáo lãi lỗ** tách rõ "doanh thu bán" vs "thu nhập khác" và "chi phí bán" vs "chi phí khác" → cần phân loại phiếu thu/chi.
3. **Drill-down** ở mọi metric (click số → list giao dịch) là chuẩn UX.
4. **Xuất file 2 cấp**: tổng quan và chi tiết — chi tiết kèm break-down theo dòng sản phẩm.
5. **Filter "khác 0"** mặc định là pattern hữu ích cho công nợ.
6. **Phân quyền** riêng từng loại báo cáo.

## Câu hỏi chưa giải đáp

- Sapo có báo cáo dòng tiền (cash flow) riêng không? Trang tổng quan không nhắc tới.
- Báo cáo theo kênh bán (Website/sàn TMĐT) tổ chức ra sao? Trang chỉ nói "tích hợp vào báo cáo chung".
- Logic "thanh toán điểm" trong chi phí bán hàng — chương trình loyalty point trừ điểm có vào chi phí.
- Cách Sapo xử lý đơn nhập multi-currency (nếu có).
