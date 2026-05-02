import type { Metadata } from "next";
import { StaticPageShell } from "@/components/sections/static-page-shell";

export const metadata: Metadata = {
  title: "Liên hệ | K-SMART",
  description: "Thông tin liên hệ K-SMART — hỗ trợ đặt hàng, đổi trả, hợp tác.",
};

export default function ContactPage() {
  return (
    <StaticPageShell
      title="Liên hệ"
      description="Chúng tôi luôn sẵn sàng hỗ trợ bạn về đơn hàng, sản phẩm và các yêu cầu hợp tác."
    >
      <h2>Hỗ trợ khách hàng</h2>
      <ul>
        <li>Email: support@k-smart.vn</li>
        <li>Giờ làm việc: 8:00 — 18:00 (Thứ 2 đến Thứ 7)</li>
      </ul>

      <h2>Văn phòng</h2>
      <p>Quận 1, TP. Hồ Chí Minh, Việt Nam.</p>

      <h2>Hợp tác kinh doanh</h2>
      <p>
        Đối tác bán sỉ, agency, hoặc cơ hội phân phối — vui lòng gửi email tới{" "}
        <a href="mailto:partners@k-smart.vn">partners@k-smart.vn</a>.
      </p>
    </StaticPageShell>
  );
}
