"use client";

import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Card } from "@workspace/ui/components/card";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  Package,
  ShoppingBag,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { BarChartMini } from "@/components/admin/shared/bar-chart-mini";
import { TonePill } from "@/components/admin/shared/status-badge";

// Monthly revenue (in millions VND).
const MONTHLY = [
  { l: "T1", v: 85 },
  { l: "T2", v: 72 },
  { l: "T3", v: 98 },
  { l: "T4", v: 110 },
  { l: "T5", v: 125.4 },
];

interface ReportCard {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  iconClass: string;
  desc: string;
  value: string;
  sub: string;
  valueClass: string;
  bg: string;
}

const REPORT_CARDS: ReportCard[] = [
  {
    id: "daily",
    href: ADMIN_ROUTES.ANALYTICS_FINANCE_DETAIL,
    label: "Doanh thu theo ngày",
    icon: CalendarDays,
    iconClass: "text-primary",
    desc: "So sánh từng ngày, delta % so hôm qua",
    value: "12.4 triệu",
    sub: "Hôm nay · 47 đơn",
    valueClass: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: "monthly",
    href: ADMIN_ROUTES.ANALYTICS_FINANCE,
    label: "Doanh thu theo tháng",
    icon: CalendarRange,
    iconClass: "text-emerald-600",
    desc: "Tổng hợp từng tháng, tăng trưởng MoM",
    value: "125.4 triệu",
    sub: "Tháng 5 · 542 đơn",
    valueClass: "text-emerald-700",
    bg: "bg-emerald-100",
  },
  {
    id: "orders_by_day",
    href: ADMIN_ROUTES.ANALYTICS_FINANCE_DETAIL,
    label: "Đơn hàng theo ngày",
    icon: ShoppingBag,
    iconClass: "text-amber-600",
    desc: "Danh sách đơn, tổng tiền, trạng thái từng ngày",
    value: "47 đơn",
    sub: "Hôm nay · 12.4 triệu",
    valueClass: "text-amber-700",
    bg: "bg-amber-100",
  },
  {
    id: "summary",
    href: ADMIN_ROUTES.ANALYTICS_OVERVIEW,
    label: "Tổng hợp doanh thu",
    icon: BarChart3,
    iconClass: "text-blue-600",
    desc: "Overview toàn bộ, cơ cấu danh mục",
    value: "125.4 triệu",
    sub: "Tháng 5/2024",
    valueClass: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    id: "products",
    href: ADMIN_ROUTES.ANALYTICS_PRODUCTS,
    label: "Doanh thu theo SP",
    icon: Package,
    iconClass: "text-primary",
    desc: "Rank sản phẩm, tỷ trọng, doanh thu",
    value: "8 sản phẩm",
    sub: "Tháng 5/2024",
    valueClass: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: "kpi",
    href: ADMIN_ROUTES.ANALYTICS_OVERVIEW,
    label: "KPI & Mục tiêu",
    icon: Target,
    iconClass: "text-emerald-600",
    desc: "Tiến độ mục tiêu tháng, tăng trưởng",
    value: "83.6%",
    sub: "Tiến độ DT tháng 5",
    valueClass: "text-emerald-700",
    bg: "bg-emerald-100",
  },
];

export default function AdminAnalytics() {
  return (
    <div className="flex flex-col gap-5">
      {/* Report card grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORT_CARDS.map((c) => (
          <Link key={c.id} href={c.href} className="group">
            <Card className="flex h-full cursor-pointer flex-col gap-4 border border-border p-5 shadow-none transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${c.bg}`}>
                  <c.icon className={`h-5 w-5 ${c.iconClass}`} strokeWidth={2} />
                </div>
                <ChevronRight
                  className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground/70"
                  strokeWidth={2}
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-[15px] font-bold leading-tight">{c.label}</div>
                <div className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                  {c.desc}
                </div>
              </div>
              <div className="flex items-baseline justify-between border-t border-border pt-3">
                <span
                  className={`text-[28px] font-semibold leading-none tabular-nums tracking-tight ${c.valueClass}`}
                >
                  {c.value}
                </span>
                <span className="text-xs text-muted-foreground">{c.sub}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick stats — 5 month bar chart */}
      <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
        <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <TrendingUp className="h-[15px] w-[15px] text-primary" strokeWidth={2} />
            Doanh thu 5 tháng gần nhất
          </h3>
          <TonePill tone="green">+14% so T4</TonePill>
        </div>
        <BarChartMini data={MONTHLY} />
      </Card>
    </div>
  );
}
