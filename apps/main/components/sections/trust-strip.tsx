import { BadgeCheck, Repeat2, ShieldCheck, Truck, Zap } from "lucide-react";
import { GENERATED_ICONS, GeneratedIcon } from "./generated-icon";

type Item = {
  icon: typeof Truck;
  title: string;
  desc: string;
  mobileIcon: string;
  iconBg: string;
  iconColor: string;
};

const ITEMS: Item[] = [
  {
    icon: Truck,
    title: "Freeship 299k",
    desc: "Giao toàn quốc 1‑3 ngày",
    mobileIcon: GENERATED_ICONS.delivery,
    iconBg: "#EEF2FF",
    iconColor: "#6366F1",
  },
  {
    icon: BadgeCheck,
    title: "Hàng Hàn chính hãng",
    desc: "Nhập khẩu chính ngạch 100%",
    mobileIcon: GENERATED_ICONS.korea,
    iconBg: "#DCFCE7",
    iconColor: "#15803D",
  },
  {
    icon: Zap,
    title: "Giao 2H nội thành",
    desc: "HCM & Hà Nội",
    mobileIcon: GENERATED_ICONS.flash,
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
  },
  {
    icon: Repeat2,
    title: "Đổi trả 7 ngày",
    desc: "Lỗi do shop, đổi miễn phí",
    mobileIcon: GENERATED_ICONS.gift,
    iconBg: "#DBEAFE",
    iconColor: "#3B82F6",
  },
];

export function TrustStrip() {
  return (
    <section className="px-4 pt-2 md:container md:mx-auto md:py-8">
      {/* Mobile: simplified 3-up grid using generated icons */}
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-surface p-3.5 md:hidden">
        {ITEMS.slice(0, 3).map((it) => (
          <div key={it.title} className="text-center">
            <div className="grid place-items-center">
              <GeneratedIcon src={it.mobileIcon} className="h-7 w-7 rounded-lg object-cover" />
            </div>
            <ShieldCheck className="hidden" />
            <div className="mt-1 text-[11px] font-bold text-foreground">{it.title}</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">{it.desc}</div>
          </div>
        ))}
      </div>

      {/* Desktop: 4-up USP card with icons */}
      <div className="hidden rounded-2xl border border-border bg-white px-6 py-5 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-4">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.title} className="flex items-center gap-3.5">
              <div
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                style={{ background: it.iconBg }}
              >
                <Icon className="h-5 w-5" style={{ color: it.iconColor }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold leading-tight text-foreground">
                  {it.title}
                </div>
                <div className="mt-0.5 text-xs leading-snug text-muted-foreground">{it.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
