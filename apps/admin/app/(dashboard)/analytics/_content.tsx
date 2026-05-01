"use client";

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
    <div className="flex flex-col gap-4">
      {/* Report card grid */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
        {REPORT_CARDS.map((c) => (
          <Card
            key={c.id}
            className="flex cursor-pointer flex-col gap-3 border border-border p-[18px_20px] transition-transform hover:-translate-y-0.5 hover:shadow-md shadow-none"
          >
            <div className="flex items-start justify-between">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[10px] ${c.bg}`}>
                <c.icon className={`h-5 w-5 ${c.iconClass}`} strokeWidth={2} />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/60" strokeWidth={2} />
            </div>
            <div>
              <div className="mb-1 text-[15px] font-bold leading-tight">{c.label}</div>
              <div className="text-xs leading-snug text-muted-foreground">{c.desc}</div>
            </div>
            <div className="flex items-baseline justify-between border-t border-border pt-2.5">
              <span className={`text-lg font-bold tabular-nums ${c.valueClass}`}>{c.value}</span>
              <span className="text-[11px] text-muted-foreground">{c.sub}</span>
            </div>
          </Card>
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
