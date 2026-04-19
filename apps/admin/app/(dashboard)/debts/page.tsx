"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { DebtListItem } from "@workspace/database/types/admin";
import { PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { DataTable } from "@workspace/ui/components/data-table";
import { Input } from "@workspace/ui/components/input";
import { CircleDollarSign, Eye, Search, Smartphone } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const AGE_PRESETS = [
  { label: "Tất cả", value: null },
  { label: "> 30 ngày", value: 30 },
  { label: "> 60 ngày", value: 60 },
  { label: "> 90 ngày", value: 90 },
] as const;

function formatYmd(date: Date | string | null | undefined): string {
  if (!date) return "---";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "---";
  return d.toISOString().slice(0, 10);
}

function daysSince(date: Date | string | null | undefined): number {
  if (!date) return 0;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

export default function AdminDebts() {
  return (
    <Suspense fallback={<div />}>
      <AdminDebtsContent />
    </Suspense>
  );
}

function AdminDebtsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlSearch = searchParams.get("search") || "";
  const rawMinAge = searchParams.get("minAgeDays");
  const parsedMinAge = rawMinAge ? Number(rawMinAge) : NaN;
  const minAgeDays: number | null =
    Number.isFinite(parsedMinAge) && parsedMinAge > 0 ? parsedMinAge : null;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(
    1,
    parseInt(searchParams.get("limit") || PAGINATION_DEFAULT.LIMIT.toString(), 10),
  );

  // Local search state with debounce so URL updates after user pauses typing.
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch] = useDebounce(searchInput, 300);

  // Keep local input in sync if URL changes from elsewhere (e.g. back button).
  useEffect(() => {
    setSearchInput(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  // Push debounced search to URL.
  useEffect(() => {
    if (debouncedSearch === urlSearch) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, pathname, router.push, searchParams.toString, urlSearch]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.debts.list(debouncedSearch, minAgeDays, page, limit),
    queryFn: () =>
      adminClient.getDebts({
        search: debouncedSearch || undefined,
        minAgeDays: minAgeDays ?? undefined,
        page,
        limit,
      }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

  const rows = (data?.data as DebtListItem[]) || [];
  const metadata = data?.metadata;

  const updateParams = (newParams: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(newParams)) {
      if (value === null || value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value.toString());
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePresetClick = (value: number | null) => {
    if (minAgeDays === value) {
      // Toggle off: clear filter
      updateParams({ minAgeDays: null, page: 1 });
      return;
    }
    updateParams({ minAgeDays: value, page: 1 });
  };

  const columns: ColumnDef<DebtListItem>[] = [
    {
      accessorKey: "customerName",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-white">
            {row.original.customerName || "---"}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
            <Smartphone className="h-3 w-3" /> {row.original.customerPhone || "---"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "unpaidOrders",
      header: () => <div className="text-right">Số đơn nợ</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-slate-900 dark:text-white">
          {row.original.unpaidOrders}
        </div>
      ),
    },
    {
      accessorKey: "debt",
      header: () => <div className="text-right">Tổng nợ</div>,
      cell: ({ row }) => (
        <div className="text-right font-black text-red-600 dark:text-red-400">
          {formatCurrency(Number(row.original.debt))}
        </div>
      ),
    },
    {
      accessorKey: "oldestDebtDate",
      header: () => <div className="text-center">Đơn cũ nhất</div>,
      cell: ({ row }) => (
        <div className="text-center font-mono text-sm font-medium text-slate-500">
          {formatYmd(row.original.oldestDebtDate)}
        </div>
      ),
    },
    {
      id: "daysOverdue",
      header: () => <div className="text-right">Số ngày nợ</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-slate-900 dark:text-white">
          {daysSince(row.original.oldestDebtDate)} ngày
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Thao tác</div>,
      cell: ({ row }) => {
        const detailHref = ADMIN_ROUTES.DEBT_DETAIL(row.original.customerId);
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary hover:bg-primary/5 gap-2 px-3 font-bold"
              asChild
            >
              <Link href={detailHref}>
                <Eye className="h-4 w-4" />
                <span>Xem chi tiết</span>
              </Link>
            </Button>
            {/* Task 18 will host the bulk-payment modal on the detail page.
                For now, both actions navigate to the detail route. */}
            <Button size="sm" className="gap-2 px-3 font-bold" asChild>
              <Link href={detailHref}>
                <CircleDollarSign className="h-4 w-4" />
                <span>Thu tiền</span>
              </Link>
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Công nợ
          </h1>
          <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
            Tổng hợp công nợ theo khách hàng. Thu tiền hàng loạt trên trang chi tiết.
          </p>
        </div>
      </div>

      <Card className="gap-0 py-0 overflow-hidden border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
        <CardHeader className="border-b border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm theo tên hoặc số điện thoại..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {AGE_PRESETS.map((preset) => {
                const active = minAgeDays === preset.value;
                return (
                  <Button
                    key={preset.label}
                    variant={active ? "default" : "outline"}
                    className="h-10 gap-2 font-bold"
                    onClick={() => handlePresetClick(preset.value)}
                  >
                    {preset.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            isFetching={isFetching}
            pageCount={metadata?.totalPages || 1}
            pagination={{
              pageIndex: page - 1,
              pageSize: limit,
            }}
            onPaginationChange={(newPagination) => {
              updateParams({
                page: newPagination.pageIndex + 1,
                limit: newPagination.pageSize,
              });
            }}
            emptyMessage="Không có khách hàng nào đang nợ."
          />
        </CardContent>
      </Card>
    </div>
  );
}
