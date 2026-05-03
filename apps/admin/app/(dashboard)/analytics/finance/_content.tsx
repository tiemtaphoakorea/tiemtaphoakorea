"use client";

import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import { ErrorBoundary } from "@workspace/ui/components/error-boundary";
import { CalendarDays } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { AnalyticsSubpageHeader } from "@/components/admin/analytics/analytics-subpage-header";

const FinanceStats = dynamic(
  () =>
    import("@/components/admin/finance/finance-stats").then((m) => ({ default: m.FinanceStats })),
  { ssr: false },
);

export default function AnalyticsFinancePage() {
  return (
    <div className="flex flex-col gap-8 pb-10">
      <AnalyticsSubpageHeader
        title="Tài chính & Lợi nhuận"
        actions={
          <Button variant="outline" size="sm" className="gap-2 font-bold" asChild>
            <Link href={ADMIN_ROUTES.ANALYTICS_FINANCE_DETAIL}>
              <CalendarDays className="h-4 w-4" />
              Chi tiết theo ngày
            </Link>
          </Button>
        }
      />

      <p className="-mt-4 text-sm font-medium text-muted-foreground">
        Tổng hợp toàn bộ shop · tính trên tất cả đơn đã thanh toán và sản phẩm
      </p>

      <ErrorBoundary>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-gray-200" />}>
          <FinanceStats />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
