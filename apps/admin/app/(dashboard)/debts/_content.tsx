"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { DebtListItem } from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import { PaginationControls } from "@workspace/ui/components/pagination-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { CircleDollarSign, Search } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/admin/shared/data-state";
import { DebtPaymentDrawer } from "@/components/admin/shared/debt-payment-drawer";
import { FilterTabs } from "@/components/admin/shared/filter-tabs";
import { formatVnd } from "@/components/admin/shared/mock-data";
import { StatCard } from "@/components/admin/shared/stat-card";
import { StatusBadge, type StatusType } from "@/components/admin/shared/status-badge";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type DebtAgeFilter = "all" | "fresh" | "old" | "very_old";
const TABS: ReadonlyArray<{ id: DebtAgeFilter; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "fresh", label: "< 7 ngày" },
  { id: "old", label: "7-30 ngày" },
  { id: "very_old", label: "> 30 ngày" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;
const DAY_MS = 24 * 60 * 60 * 1000;

const fmtDate = (d: Date | string): string => new Date(d).toLocaleDateString("vi-VN");

/** Days since oldestDebtDate. */
function daysSince(d: Date | string): number {
  return Math.floor((Date.now() - new Date(d).getTime()) / DAY_MS);
}

/** Map age bucket → minAgeDays query param. */
function filterToMinAge(filter: DebtAgeFilter): number | null {
  if (filter === "fresh") return 0;
  if (filter === "old") return 7;
  if (filter === "very_old") return 30;
  return null;
}

/** Status pill from age — drives StatusBadge type. */
function debtStatusType(days: number): StatusType {
  if (days >= 30) return "overdue";
  if (days >= 7) return "pending";
  return "unpaid";
}

export default function AdminDebts() {
  const [filter, setFilter] = useState<DebtAgeFilter>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [paymentCustomerId, setPaymentCustomerId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const summaryQuery = useQuery({
    queryKey: queryKeys.admin.debtSummary,
    queryFn: () => adminClient.getDebtSummary(),
    staleTime: 60_000,
  });

  const debtsQuery = useQuery({
    queryKey: queryKeys.debts.list(debouncedQuery, filterToMinAge(filter), page, pageSize),
    queryFn: async () =>
      await adminClient.getDebts({
        search: debouncedQuery || undefined,
        minAgeDays: filterToMinAge(filter) ?? undefined,
        page,
        limit: pageSize,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const list: DebtListItem[] = debtsQuery.data?.data ?? [];
  const total = debtsQuery.data?.metadata.total ?? 0;
  const totalPages = debtsQuery.data?.metadata.totalPages ?? 1;
  const summary = summaryQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 max-sm:gap-0 max-sm:overflow-hidden max-sm:rounded-[10px] max-sm:border max-sm:border-border [&>*:nth-child(2)]:max-sm:border-r-0 [&>*:last-child]:max-sm:col-span-2 [&>*:last-child]:max-sm:border-r-0 [&>*:last-child]:max-sm:border-b-0 sm:grid-cols-3">
        <StatCard
          label="Tổng công nợ"
          value={summary ? formatVnd(summary.totalDebt) : "—"}
          delta="Cần thu hồi"
          direction="down"
          icon={CircleDollarSign}
          tone="danger"
        />
        <StatCard
          label="Khách có nợ"
          value={summary?.customerCount ?? "—"}
          delta="Đang nợ"
          direction="down"
          icon={CircleDollarSign}
          tone="amber"
        />
        <StatCard
          label="Số đơn nợ hiển thị"
          value={total}
          delta={`Trang ${page}`}
          direction="up"
          icon={CircleDollarSign}
          tone="primary"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <FilterTabs
          tabs={TABS}
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setPage(1);
          }}
        />
        <div className="flex h-[34px] items-center gap-2 rounded-lg border border-border bg-white px-3 sm:ml-auto">
          <Search className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={2} />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm tên KH, SĐT..."
            className="h-auto w-full border-0 bg-transparent px-0 py-0 shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 sm:w-[220px]"
          />
        </div>
      </div>

      <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {[
                  "Khách hàng",
                  "SĐT",
                  "Số đơn nợ",
                  "Số tiền nợ",
                  "Nợ lâu nhất",
                  "Trạng thái",
                  "",
                ].map((h, i) => (
                  <TableHead
                    key={i}
                    className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {debtsQuery.isLoading && <TableLoadingRows cols={7} rows={5} />}
              {debtsQuery.error && <TableErrorRow cols={7} message={String(debtsQuery.error)} />}
              {!debtsQuery.isLoading && list.length === 0 && (
                <TableEmptyRow cols={7} message="Chưa có công nợ" />
              )}
              {list.map((d) => {
                const days = daysSince(d.oldestDebtDate);
                return (
                  <TableRow key={d.customerId}>
                    <TableCell className="px-4 py-2.5 text-[13px] font-semibold">
                      {d.customerName ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                      {d.customerPhone ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 tabular-nums">{d.unpaidOrders}</TableCell>
                    <TableCell className="px-4 py-2.5 font-bold tabular-nums text-red-600">
                      {formatVnd(Number(d.debt))}
                    </TableCell>
                    <TableCell
                      className={`px-4 py-2.5 text-xs ${days >= 30 ? "font-bold text-red-600" : "text-muted-foreground"}`}
                    >
                      {fmtDate(d.oldestDebtDate)} ({days} ngày)
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <StatusBadge type={debtStatusType(days)} />
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-md text-xs"
                        onClick={() => setPaymentCustomerId(d.customerId)}
                      >
                        Thu tiền
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Hiển thị</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
              className="h-8 w-[72px] text-[13px]"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <SelectOption key={s} value={String(s)}>
                  {s}
                </SelectOption>
              ))}
            </Select>
            <span>
              / trang ·{" "}
              {debtsQuery.isLoading && total === 0 ? "Đang tải..." : `Tổng ${total} khách`}
            </span>
          </div>
          <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>

      <DebtPaymentDrawer
        customerId={paymentCustomerId}
        onClose={() => setPaymentCustomerId(null)}
      />
    </div>
  );
}
