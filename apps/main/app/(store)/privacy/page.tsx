import type { Metadata } from "next";
import { StaticPageShell } from "@/components/sections/static-page-shell";

export const metadata: Metadata = {
  title: "Chính sách bảo mật | K-SMART",
  description: "Chính sách thu thập và sử dụng dữ liệu cá nhân tại K-SMART.",
};

export default function PrivacyPage() {
  return (
    <StaticPageShell
      title="Chính sách bảo mật"
      description="K-SMART tôn trọng quyền riêng tư và cam kết bảo vệ dữ liệu cá nhân của khách hàng."
    >
      <h2>1. Dữ liệu thu thập</h2>
      <ul>
        <li>Thông tin tài khoản: tên, số điện thoại, địa chỉ giao hàng.</li>
        <li>Thông tin đơn hàng và lịch sử mua sắm.</li>
        <li>Dữ liệu kỹ thuật: cookie, địa chỉ IP, loại trình duyệt nhằm phục vụ phân tích.</li>
      </ul>

      <h2>2. Mục đích sử dụng</h2>
      <ul>
        <li>Xử lý đơn hàng và giao vận.</li>
        <li>Cung cấp hỗ trợ khách hàng và xử lý khiếu nại.</li>
        <li>
          Gửi thông tin khuyến mãi nếu bạn đăng ký nhận bản tin (có thể hủy đăng ký bất cứ lúc nào).
        </li>
      </ul>

      <h2>3. Chia sẻ dữ liệu</h2>
      <p>
        K-SMART chỉ chia sẻ dữ liệu với các đối tác cần thiết để vận hành dịch vụ (đơn vị vận
        chuyển, cổng thanh toán) và tuân thủ yêu cầu pháp lý từ cơ quan có thẩm quyền.
      </p>

      <h2>4. Quyền của khách hàng</h2>
      <p>
        Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa dữ liệu cá nhân tại bất kỳ thời điểm nào thông
        qua bộ phận hỗ trợ.
      </p>

      <h2>5. Liên hệ</h2>
      <p>
        Mọi thắc mắc về chính sách bảo mật, vui lòng gửi email tới{" "}
        <a href="mailto:privacy@k-smart.vn">privacy@k-smart.vn</a>.
      </p>
    </StaticPageShell>
  );
}
