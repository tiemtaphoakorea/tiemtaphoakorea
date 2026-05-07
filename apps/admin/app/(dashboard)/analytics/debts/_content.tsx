"use client";

import { useQuery } from "@tanstack/react-query";
import { AnalyticsSubpageHeader } from "@/components/admin/analytics/analytics-subpage-header";
import type { SupplierDebtRow } from "@/components/admin/analytics/supplier-debts-table";
import { SupplierDebtsTable } from "@/components/admin/analytics/supplier-debts-table";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export default function AnalyticsDebtsPage() {
  "use no memo";

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.supplierDebts,
    queryFn: () => adminClient.getSupplierDebts(),
  });

  return (
    <div className="flex flex-col gap-8 pb-10">
      <AnalyticsSubpageHeader title="Công nợ NCC" />
      <SupplierDebtsTable items={(data ?? []) as SupplierDebtRow[]} isLoading={isLoading} />
    </div>
  );
}
