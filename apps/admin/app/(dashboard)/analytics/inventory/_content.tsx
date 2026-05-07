"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import { Card, CardContent } from "@workspace/ui/components/card";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { AnalyticsSubpageHeader } from "@/components/admin/analytics/analytics-subpage-header";
import type { DateRange } from "@/components/admin/analytics/finance-range-picker";
import { InventoryCategoryChart } from "@/components/admin/analytics/inventory-category-chart";
import { InventoryFlowTable } from "@/components/admin/analytics/inventory-flow-table";
import { InventoryMovementLog } from "@/components/admin/analytics/inventory-movement-log";
import { InventoryStats } from "@/components/admin/analytics/inventory-stats";
import type {
  InventoryValuationItem,
  InventoryValuationMetadata,
  InventoryValuationTotals,
} from "@/components/admin/analytics/inventory-valuation-table";
import { InventoryValuationTable } from "@/components/admin/analytics/inventory-valuation-table";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function thisMonthRange(): DateRange {
  const now = new Date();
  return {
    startDate: toISO(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate: toISO(now),
  };
}

function last7DaysRange(): DateRange {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  return { startDate: toISO(start), endDate: toISO(now) };
}

export default function AnalyticsInventoryPage() {
  "use no memo";

  // Valuation / existing state
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [valuationPage, setValuationPage] = useState(1);
  const [debouncedSearch] = useDebounce(search, 300);

  // Inventory flow (in/out/balance) state
  const [flowDateRange, setFlowDateRange] = useState<DateRange>(thisMonthRange);
  const [flowSearch, setFlowSearch] = useState("");
  const [flowCategoryId, setFlowCategoryId] = useState("");
  const [flowPage, setFlowPage] = useState(1);
  const [debouncedFlowSearch] = useDebounce(flowSearch, 300);

  // Movement log state
  const [movDateRange, setMovDateRange] = useState<DateRange>(last7DaysRange);
  const [movType, setMovType] = useState("");
  const [movSearch, setMovSearch] = useState("");
  const [movPage, setMovPage] = useState(1);
  const [debouncedMovSearch] = useDebounce(movSearch, 300);

  // Existing queries
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: queryKeys.admin.analytics,
    queryFn: async () => {
      const result = await adminClient.getAnalytics();
      return result as unknown as AnalyticsData;
    },
  });

  const valuationParams = {
    search: debouncedSearch || undefined,
    categoryId: categoryId || undefined,
    page: valuationPage,
    limit: 20,
  };
  const { data: valuationData, isLoading: isLoadingValuation } = useQuery({
    queryKey: queryKeys.admin.inventory.valuation(valuationParams),
    queryFn: () => adminClient.getInventoryValuation(valuationParams),
  });

  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => adminClient.getCategories(),
  });

  // Inventory flow query
  const flowParams = {
    ...flowDateRange,
    search: debouncedFlowSearch || undefined,
    categoryId: flowCategoryId || undefined,
    page: flowPage,
  };
  const { data: flowData, isLoading: isLoadingFlow } = useQuery({
    queryKey: queryKeys.admin.inventory.flow(flowParams),
    queryFn: () => adminClient.getInventoryFlowReport(flowParams),
  });

  // Movement log query
  const movParams = {
    startDate: movDateRange.startDate,
    endDate: movDateRange.endDate,
    type: movType || undefined,
    search: debouncedMovSearch || undefined,
    page: movPage,
    limit: 20,
  };
  const { data: movData, isLoading: isLoadingMov } = useQuery({
    queryKey: queryKeys.admin.inventory.movements(movParams),
    queryFn: () => adminClient.getInventoryMovements(movParams),
  });

  const flatCategories = (categoriesData?.flatCategories ?? []).map(
    (c: { id: string; name: string }) => ({ id: c.id, name: c.name }),
  );

  function handleFlowDateRange(r: DateRange) {
    setFlowDateRange(r);
    setFlowPage(1);
  }
  function handleFlowSearch(v: string) {
    setFlowSearch(v);
    setFlowPage(1);
  }
  function handleFlowCategory(v: string) {
    setFlowCategoryId(v);
    setFlowPage(1);
  }
  function handleMovDateRange(r: DateRange) {
    setMovDateRange(r);
    setMovPage(1);
  }
  function handleMovSearch(v: string) {
    setMovSearch(v);
    setMovPage(1);
  }
  function handleMovType(v: string) {
    setMovType(v);
    setMovPage(1);
  }
  function handleValuationSearch(v: string) {
    setSearch(v);
    setValuationPage(1);
  }
  function handleValuationCategory(v: string) {
    setCategoryId(v);
    setValuationPage(1);
  }

  return (
    <div className="flex min-w-0 flex-col gap-8 pb-10">
      <AnalyticsSubpageHeader title="Tồn kho" />

      <Card className="border-none shadow-sm ring-1 ring-slate-200">
        <CardContent className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:divide-x lg:divide-slate-100">
          <div className="flex flex-col gap-1">
            <h2 className="mb-1 text-sm font-black uppercase tracking-wider text-slate-700">
              Thống kê tồn kho
            </h2>
            <p className="mb-2 text-xs text-muted-foreground">
              Bấm vào Sắp hết hàng hoặc Hết hàng để xem danh sách chi tiết.
            </p>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />
                ))}
              </div>
            ) : (
              data?.inventory && <InventoryStats data={data.inventory} layout="column" />
            )}
          </div>
          <div className="flex flex-col gap-3 lg:pl-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">
              Tồn kho theo danh mục
            </h2>
            <InventoryCategoryChart
              items={(valuationData?.items ?? []) as InventoryValuationItem[]}
              isLoading={isLoadingValuation}
            />
          </div>
        </CardContent>
      </Card>

      <InventoryFlowTable
        items={flowData?.items ?? []}
        totals={flowData?.totals ?? null}
        metadata={flowData?.metadata ?? null}
        isLoading={isLoadingFlow}
        dateRange={flowDateRange}
        onDateRangeChange={handleFlowDateRange}
        search={flowSearch}
        onSearchChange={handleFlowSearch}
        categoryId={flowCategoryId}
        onCategoryChange={handleFlowCategory}
        categories={flatCategories}
        page={flowPage}
        onPageChange={setFlowPage}
      />

      <InventoryMovementLog
        data={movData?.data ?? []}
        metadata={movData?.metadata ?? null}
        isLoading={isLoadingMov}
        dateRange={movDateRange}
        onDateRangeChange={handleMovDateRange}
        movementType={movType}
        onMovementTypeChange={handleMovType}
        search={movSearch}
        onSearchChange={handleMovSearch}
        page={movPage}
        onPageChange={setMovPage}
      />

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-black tracking-tight text-slate-900">
          Giá trị tồn kho theo SKU
        </h2>
        <InventoryValuationTable
          items={(valuationData?.items ?? []) as InventoryValuationItem[]}
          totals={(valuationData?.totals ?? null) as InventoryValuationTotals | null}
          metadata={(valuationData?.metadata ?? null) as InventoryValuationMetadata | null}
          isLoading={isLoadingValuation}
          search={search}
          onSearchChange={handleValuationSearch}
          categoryId={categoryId}
          onCategoryChange={handleValuationCategory}
          categories={flatCategories}
          page={valuationPage}
          onPageChange={setValuationPage}
        />
      </div>
    </div>
  );
}
