"use client";

import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import { ErrorBoundary } from "@workspace/ui/components/error-boundary";
import { CalendarDays } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";

const FinanceStats = dynamic(
  () =>
    import("@/components/admin/finance/finance-stats").then((m) => ({ default: m.FinanceStats })),
  { ssr: false },
);

export default function AnalyticsFinancePage() {
  const now = new Date();
  const financeDate = { month: now.getMonth() + 1, year: now.getFullYear() };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={ADMIN_ROUTES.ANALYTICS}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Báo cáo
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Tài chính & Lợi nhuận
          </h1>
        </div>
        <Button variant="outline" size="sm" className="gap-2 font-bold" asChild>
          <Link href={ADMIN_ROUTES.ANALYTICS_FINANCE_DETAIL}>
            <CalendarDays className="h-4 w-4" />
            Chi tiết theo ngày
          </Link>
        </Button>
      </div>

      <ErrorBoundary>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-gray-200" />}>
          <FinanceStats date={financeDate} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
