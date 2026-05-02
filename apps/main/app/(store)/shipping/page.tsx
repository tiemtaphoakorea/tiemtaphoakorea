import type { Metadata } from "next";
import { StaticPageShell } from "@/components/sections/static-page-shell";

export const metadata: Metadata = {
  title: "Vận chuyển & Giao hàng | K-SMART",
  description: "Chính sách và thời gian giao hàng của K-SMART trên toàn quốc.",
};

export default function ShippingPage() {
  return (
    <StaticPageShell
      title="Vận chuyển & Giao hàng"
      description="Thông tin về phương thức vận chuyển, thời gian giao hàng và phí ship áp dụng cho đơn hàng tại K-SMART."
    >
      <h2>Phạm vi giao hàng</h2>
      <p>
        K-SMART giao hàng trên toàn quốc thông qua các đối tác vận chuyển uy tín. Thời gian giao
        hàng cụ thể phụ thuộc vào khu vực và tình trạng kho.
      </p>

      <h2>Thời gian xử lý</h2>
      <ul>
        <li>Đơn đặt trong giờ làm việc: xử lý trong 24 giờ.</li>
        <li>Đơn đặt ngoài giờ hoặc cuối tuần: xử lý vào ngày làm việc kế tiếp.</li>
      </ul>

      <h2>Phí vận chuyển</h2>
      <p>
        Phí vận chuyển được tính tại bước thanh toán dựa trên địa chỉ nhận hàng và khối lượng đơn
        hàng. Các chương trình freeship và ngưỡng miễn phí giao hàng (nếu có) sẽ được hiển thị trong
        giỏ hàng.
      </p>

      <h2>Theo dõi đơn hàng</h2>
      <p>
        Sau khi đơn được bàn giao cho đơn vị vận chuyển, mã vận đơn sẽ được gửi qua email/SMS để bạn
        theo dõi.
      </p>
    </StaticPageShell>
  );
}
