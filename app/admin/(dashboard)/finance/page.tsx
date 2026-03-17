"use client";

import { Suspense, useState } from "react";
import { FinanceStats } from "@/components/admin/finance/finance-stats";
import { FinanceStatsSkeleton } from "@/components/admin/finance/finance-stats-skeleton";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FinancePage() {
  const [date, setDate] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const months = [
    { value: 1, label: "Tháng 1" },
    { value: 2, label: "Tháng 2" },
    { value: 3, label: "Tháng 3" },
    { value: 4, label: "Tháng 4" },
    { value: 5, label: "Tháng 5" },
    { value: 6, label: "Tháng 6" },
    { value: 7, label: "Tháng 7" },
    { value: 8, label: "Tháng 8" },
    { value: 9, label: "Tháng 9" },
    { value: 10, label: "Tháng 10" },
    { value: 11, label: "Tháng 11" },
    { value: 12, label: "Tháng 12" },
  ];

  const years = [2024, 2025, 2026];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Tài chính & Lợi nhuận</h1>
          <p className="text-muted-foreground font-medium">
            Báo cáo kết quả kinh doanh (P&L) cho tháng {date.month}/{date.year}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={date.month.toString()}
            onValueChange={(v) => setDate({ ...date, month: parseInt(v, 10) })}
          >
            <SelectTrigger className="h-11 w-[140px] rounded-xl font-bold">
              <SelectValue placeholder="Chọn tháng" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()} className="font-medium">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={date.year.toString()}
            onValueChange={(v) => setDate({ ...date, year: parseInt(v, 10) })}
          >
            <SelectTrigger className="h-11 w-[100px] rounded-xl font-bold">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()} className="font-medium">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ErrorBoundary>
        <Suspense fallback={<FinanceStatsSkeleton />}>
          <FinanceStats date={date} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
