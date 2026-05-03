import type { Metadata } from "next";
import { StaticPageShell } from "@/components/sections/static-page-shell";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng | K-SMART",
  description: "Điều khoản sử dụng dịch vụ của K-SMART.",
};

export default function TermsPage() {
  return (
    <StaticPageShell
      title="Điều khoản sử dụng"
      description="Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng dịch vụ của K-SMART."
    >
      <h2>1. Chấp nhận điều khoản</h2>
      <p>
        Khi truy cập và sử dụng K-SMART, bạn đồng ý tuân thủ các điều khoản và quy định được liệt kê
        tại trang này. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.
      </p>

      <h2>2. Tài khoản và bảo mật</h2>
      <p>
        Bạn chịu trách nhiệm bảo mật tài khoản và mọi hoạt động phát sinh dưới tài khoản của mình.
        K-SMART không chịu trách nhiệm về thiệt hại do bạn không tuân thủ quy định bảo mật.
      </p>

      <h2>3. Quyền sở hữu nội dung</h2>
      <p>
        Toàn bộ nội dung, hình ảnh, logo, mã nguồn trên K-SMART thuộc quyền sở hữu của K-SMART hoặc
        các bên cấp phép. Nghiêm cấm sao chép, phân phối khi không có sự cho phép bằng văn bản.
      </p>

      <h2>4. Giới hạn trách nhiệm</h2>
      <p>
        K-SMART không chịu trách nhiệm về bất kỳ tổn thất gián tiếp nào phát sinh từ việc sử dụng
        dịch vụ ngoài phạm vi quy định của pháp luật Việt Nam.
      </p>

      <h2>5. Cập nhật điều khoản</h2>
      <p>
        K-SMART có thể cập nhật điều khoản sử dụng theo thời gian. Phiên bản mới có hiệu lực kể từ
        thời điểm đăng tải tại trang này.
      </p>
    </StaticPageShell>
  );
}
