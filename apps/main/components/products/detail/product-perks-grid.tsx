import { Gift, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import type { ComponentType } from "react";

type Perk = {
  Icon: ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
};

const PERKS: Perk[] = [
  {
    Icon: Truck,
    iconBg: "bg-warning-soft",
    iconColor: "text-warning",
    title: "Giao hàng 2H",
    desc: "Nội thành HCM & HN",
  },
  {
    Icon: RotateCcw,
    iconBg: "bg-success-soft",
    iconColor: "text-success",
    title: "Đổi trả 7 ngày",
    desc: "Không cần lý do",
  },
  {
    Icon: ShieldCheck,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "Hàng chính hãng",
    desc: "100% nhập khẩu Hàn",
  },
  {
    Icon: Gift,
    iconBg: "bg-destructive-soft",
    iconColor: "text-destructive",
    title: "Quà tặng kèm",
    desc: "Khi mua từ 3 hộp",
  },
];

export function ProductPerksGrid() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PERKS.map((perk) => (
        <div
          key={perk.title}
          className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3"
        >
          <div
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${perk.iconBg}`}
          >
            <perk.Icon className={`h-4 w-4 ${perk.iconColor}`} />
          </div>
          <div className="text-xs font-semibold leading-tight text-foreground">
            {perk.title}
            <small className="mt-0.5 block font-normal text-muted-foreground">{perk.desc}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
