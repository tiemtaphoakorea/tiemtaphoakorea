import type { Metadata } from "next";
import { StaticPageShell } from "@/components/sections/static-page-shell";

export const metadata: Metadata = {
  title: "Kiểm tra đơn hàng | K-SMART",
  description: "Tra cứu trạng thái đơn hàng K-SMART bằng mã đơn và số điện thoại.",
};

export default function OrderLookupPage() {
  return (
    <StaticPageShell
      title="Kiểm tra đơn hàng"
      description="Nhập mã đơn hàng và số điện thoại đặt hàng để xem trạng thái mới nhất."
    >
      <p>
        Tính năng tra cứu trực tuyến đang được hoàn thiện. Trong thời gian chờ, vui lòng liên hệ bộ
        phận hỗ trợ qua trang <a href="/contact">Liên hệ</a> kèm mã đơn và số điện thoại đặt hàng để
        được phản hồi nhanh nhất.
      </p>
    </StaticPageShell>
  );
}
