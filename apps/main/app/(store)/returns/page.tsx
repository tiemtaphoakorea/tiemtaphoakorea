import type { Metadata } from "next";
import { StaticPageShell } from "@/components/sections/static-page-shell";

export const metadata: Metadata = {
  title: "Chính sách đổi trả | K-SMART",
  description: "Quy định và quy trình đổi trả hàng tại K-SMART.",
};

export default function ReturnsPage() {
  return (
    <StaticPageShell
      title="Chính sách đổi trả"
      description="K-SMART hỗ trợ đổi trả hàng trong các trường hợp lỗi do nhà sản xuất hoặc giao sai mẫu."
    >
      <h2>Điều kiện đổi trả</h2>
      <ul>
        <li>Sản phẩm còn nguyên tem mác, bao bì và phụ kiện đi kèm.</li>
        <li>Có hóa đơn hoặc mã đơn hàng từ K-SMART.</li>
        <li>Yêu cầu đổi trả gửi trong thời hạn ghi trên trang sản phẩm.</li>
      </ul>

      <h2>Trường hợp được đổi trả</h2>
      <ul>
        <li>Sản phẩm lỗi do nhà sản xuất.</li>
        <li>Giao sai mẫu/sai số lượng so với đơn hàng.</li>
        <li>Sản phẩm hư hỏng trong quá trình vận chuyển.</li>
      </ul>

      <h2>Quy trình</h2>
      <ol>
        <li>Liên hệ bộ phận hỗ trợ qua email hoặc trang Liên hệ.</li>
        <li>Cung cấp mã đơn hàng và hình ảnh/video minh chứng.</li>
        <li>Nhận hướng dẫn gửi trả và xử lý hoàn tiền hoặc đổi sản phẩm.</li>
      </ol>

      <h2>Thời gian xử lý</h2>
      <p>
        Sau khi K-SMART nhận được hàng đổi trả và xác minh, kết quả sẽ được phản hồi trong vòng 3—5
        ngày làm việc.
      </p>
    </StaticPageShell>
  );
}
