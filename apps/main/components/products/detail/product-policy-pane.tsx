import { CreditCard, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import type { ComponentType } from "react";

type Policy = {
  Icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
};

const POLICIES: Policy[] = [
  {
    Icon: Truck,
    title: "Giao hàng nhanh",
    desc: "Giao trong 2 giờ khu vực nội thành HCM và Hà Nội. Toàn quốc 1–3 ngày làm việc. Freeship đơn từ 299.000đ.",
  },
  {
    Icon: RotateCcw,
    title: "Đổi trả dễ dàng",
    desc: "Đổi trả trong 7 ngày kể từ ngày nhận hàng nếu sản phẩm lỗi, hết hạn, hoặc không đúng mô tả. Không cần lý do với đơn trên 500k.",
  },
  {
    Icon: ShieldCheck,
    title: "Chính hãng 100%",
    desc: "Toàn bộ sản phẩm nhập khẩu chính ngạch từ Hàn Quốc. Có tem phụ tiếng Việt, hóa đơn VAT, chứng nhận kiểm định.",
  },
  {
    Icon: CreditCard,
    title: "Thanh toán linh hoạt",
    desc: "Chấp nhận COD, chuyển khoản, Momo, ZaloPay, VNPay, thẻ tín dụng/ghi nợ. Trả góp 0% qua thẻ ngân hàng từ 500k.",
  },
];

export function ProductPolicyPane() {
  return (
    <div className="grid grid-cols-1 gap-5 py-6 lg:grid-cols-2">
      {POLICIES.map((p) => (
        <div key={p.title} className="flex flex-col gap-2.5 rounded-2xl bg-secondary/60 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <p.Icon className="h-5 w-5 text-primary" />
          </div>
          <h4 className="text-sm font-bold text-foreground">{p.title}</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
        </div>
      ))}
    </div>
  );
}
