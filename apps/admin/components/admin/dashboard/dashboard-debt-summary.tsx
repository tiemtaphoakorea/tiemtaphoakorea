"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export function DashboardDebtSummary() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.debtSummary,
    queryFn: () => adminClient.getDebtSummary(),
  });

  return (
    <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
          Công nợ cần thu
        </CardTitle>
        <AlertCircle className="h-4 w-4 text-amber-500" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-36 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
            <div className="h-3 w-28 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-black text-amber-600">
              {formatCurrency(data?.totalDebt ?? 0)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs font-medium">
              {data?.customerCount ?? 0} khách hàng chưa thanh toán
            </p>
          </>
        )}
        <Link
          href={ADMIN_ROUTES.DEBTS}
          className="mt-3 flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline"
        >
          Xem tất cả <ChevronRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
