"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import { Card, CardContent } from "@workspace/ui/components/card";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { AnalyticsSubpageHeader } from "@/components/admin/analytics/analytics-subpage-header";
import type { DateRange } from "@/components/admin/analytics/finance-range-picker";
import { InventoryCategoryChart } from "@/components/admin/analytics/inventory-category-chart";
import { InventoryMovementLog } from "@/components/admin/analytics/inventory-movement-log";
import { InventoryStats } from "@/components/admin/analytics/inventory-stats";
import type {
  InventoryValuationItem,
  InventoryValuationTotals,
} from "@/components/admin/analytics/inventory-valuation-table";
import { InventoryValuationTable } from "@/components/admin/analytics/inventory-valuation-table";
import { InventoryXntTable } from "@/components/admin/analytics/inventory-xnt-table";
import { LowStockList } from "@/components/admin/analytics/low-stock-list";
import { OutOfStockList } from "@/components/admin/analytics/out-of-stock-list";
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
  const [debouncedSearch] = useDebounce(search, 300);

  // XNT state
  const [xntDateRange, setXntDateRange] = useState<DateRange>(thisMonthRange);
  const [xntSearch, setXntSearch] = useState("");
  const [xntCategoryId, setXntCategoryId] = useState("");
  const [xntPage, setXntPage] = useState(1);
  const [debouncedXntSearch] = useDebounce(xntSearch, 300);

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

  const { data: stockAlerts, isLoading: isLoadingStock } = useQuery({
    queryKey: queryKeys.admin.stockAlerts,
    queryFn: () => adminClient.getStockAlerts(),
  });

  const valuationParams = {
    search: debouncedSearch || undefined,
    categoryId: categoryId || undefined,
  };
  const { data: valuationData, isLoading: isLoadingValuation } = useQuery({
    queryKey: queryKeys.admin.inventory.valuation(valuationParams),
    queryFn: () => adminClient.getInventoryValuation(valuationParams),
  });

  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => adminClient.getCategories(),
  });

  // XNT query
  const xntParams = {
    ...xntDateRange,
    search: debouncedXntSearch || undefined,
    categoryId: xntCategoryId || undefined,
    page: xntPage,
  };
  const { data: xntData, isLoading: isLoadingXnt } = useQuery({
    queryKey: queryKeys.admin.inventory.xnt(xntParams),
    queryFn: () => adminClient.getXntReport(xntParams),
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

  const stockLoading = isLoading || isLoadingStock;
  const flatCategories = (categoriesData?.flatCategories ?? []).map(
    (c: { id: string; name: string }) => ({ id: c.id, name: c.name }),
  );

  function handleXntDateRange(r: DateRange) {
    setXntDateRange(r);
    setXntPage(1);
  }
  function handleXntSearch(v: string) {
    setXntSearch(v);
    setXntPage(1);
  }
  function handleXntCategory(v: string) {
    setXntCategoryId(v);
    setXntPage(1);
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

  return (
    <div className="flex min-w-0 flex-col gap-8 pb-10">
      <AnalyticsSubpageHeader title="Tồn kho" />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : (
        data?.inventory && <InventoryStats data={data.inventory} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-none py-0 shadow-sm ring-1 ring-slate-200">
          <CardContent className="pt-6">
            {stockLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200" />
                ))}
              </div>
            ) : (
              <LowStockList items={stockAlerts?.lowStock ?? []} />
            )}
          </CardContent>
        </Card>
        <Card className="border-none py-0 shadow-sm ring-1 ring-slate-200">
          <CardContent className="pt-6">
            {stockLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200" />
                ))}
              </div>
            ) : (
              <OutOfStockList items={stockAlerts?.outOfStock ?? []} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-black tracking-tight text-slate-900">
          Giá trị tồn kho theo SKU
        </h2>
        <InventoryValuationTable
          items={(valuationData?.items ?? []) as InventoryValuationItem[]}
          totals={(valuationData?.totals ?? null) as InventoryValuationTotals | null}
          isLoading={isLoadingValuation}
          search={search}
          onSearchChange={setSearch}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          categories={flatCategories}
        />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-black tracking-tight text-slate-900">Tồn kho theo danh mục</h2>
        <InventoryCategoryChart
          items={(valuationData?.items ?? []) as InventoryValuationItem[]}
          isLoading={isLoadingValuation}
        />
      </div>

      <InventoryXntTable
        items={xntData?.items ?? []}
        totals={xntData?.totals ?? null}
        metadata={xntData?.metadata ?? null}
        isLoading={isLoadingXnt}
        dateRange={xntDateRange}
        onDateRangeChange={handleXntDateRange}
        search={xntSearch}
        onSearchChange={handleXntSearch}
        categoryId={xntCategoryId}
        onCategoryChange={handleXntCategory}
        categories={flatCategories}
        page={xntPage}
        onPageChange={setXntPage}
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
    </div>
  );
}
