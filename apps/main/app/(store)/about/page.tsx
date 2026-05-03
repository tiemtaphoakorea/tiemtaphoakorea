import type { Metadata } from "next";
import { StaticPageShell } from "@/components/sections/static-page-shell";

export const metadata: Metadata = {
  title: "Giới thiệu | K-SMART",
  description: "Giới thiệu về K-SMART — nền tảng mỹ phẩm và đồ gia dụng Hàn Quốc chính hãng.",
};

export default function AboutPage() {
  return (
    <StaticPageShell
      title="Giới thiệu"
      description="K-SMART là nền tảng thương mại điện tử chuyên cung cấp mỹ phẩm và đồ gia dụng Hàn Quốc chính hãng tại Việt Nam."
    >
      <h2>Sứ mệnh</h2>
      <p>
        Mang sản phẩm Hàn Quốc chính hãng đến tay người tiêu dùng Việt với giá hợp lý, dịch vụ nhanh
        và minh bạch.
      </p>

      <h2>Cam kết</h2>
      <ul>
        <li>Hàng nhập khẩu chính ngạch, đầy đủ tem phụ và hóa đơn.</li>
        <li>Quy trình kiểm hàng nhiều lớp trước khi giao.</li>
        <li>Đội ngũ chăm sóc khách hàng phản hồi trong giờ làm việc.</li>
      </ul>

      <p>
        Để biết thêm chi tiết về sản phẩm, chính sách hoặc hợp tác, vui lòng truy cập trang{" "}
        <a href="/contact">Liên hệ</a>.
      </p>
    </StaticPageShell>
  );
}
