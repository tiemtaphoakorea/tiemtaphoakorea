"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Expense } from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import { PaginationControls } from "@workspace/ui/components/pagination-controls";
import { Progress } from "@workspace/ui/components/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { BarChart3, Plus, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/admin/shared/data-state";
import { ExpenseDrawer } from "@/components/admin/shared/expense-drawer";
import { formatVnd } from "@/components/admin/shared/format-vnd";
import { MetricStatBar } from "@/components/admin/shared/metric-stat-bar";
import { TonePill } from "@/components/admin/shared/status-badge";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type ExpenseTypeFilter = "all" | "fixed" | "variable";

type Totals = { total: number; fixed: number; variable: number };

function CostStructureCard({ totals }: { totals: Totals }) {
  const fixedPct = totals.total > 0 ? Math.round((totals.fixed / totals.total) * 100) : 0;
  const variablePct = totals.total > 0 ? 100 - fixedPct : 0;

  const rows = [
    { label: "Cố định", pct: fixedPct, color: "var(--color-primary)", amount: totals.fixed },
    { label: "Biến đổi", pct: variablePct, color: "#D97706", amount: totals.variable },
  ];

  // conic-gradient donut
  const donutBg =
    totals.total > 0
      ? `conic-gradient(var(--color-primary) 0% ${fixedPct}%, #D97706 ${fixedPct}% 100%)`
      : "conic-gradient(#E5E7EB 0% 100%)";

  return (
    <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Cơ cấu chi phí</h3>
      </div>
      <div className="flex items-center gap-5 p-5">
        {/* Donut */}
        <div
          className="relative shrink-0"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: donutBg,
          }}
        >
          <div className="absolute inset-6 rounded-full bg-white" style={{ background: "white" }} />
        </div>

        {/* Progress bars */}
        <div className="flex flex-1 flex-col gap-3">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <span
                    className="inline-block h-2 w-2 rounded-xs"
                    style={{ background: r.color }}
                  />
                  {r.label}
                </span>
                <span className="text-xs font-semibold tabular-nums">{r.pct}%</span>
              </div>
              <Progress
                value={r.pct}
                indicatorClassName="duration-500"
                indicatorStyle={{ background: r.color }}
              />
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatVnd(r.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

const fmtDate = (d: Date | string): string => new Date(d).toLocaleDateString("vi-VN");

export default function AdminExpenses() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [typeFilter, setTypeFilter] = useState<ExpenseTypeFilter>("all");
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const queryClient = useQueryClient();

  const expensesQuery = useQuery({
    queryKey: queryKeys.admin.expenses.list(typeFilter, page, pageSize),
    queryFn: async () =>
      await adminClient.getExpenses({
        month,
        year,
        type: typeFilter === "all" ? undefined : typeFilter,
        page,
        limit: pageSize,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminClient.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.expenses.all });
    },
  });

  const list: Expense[] = expensesQuery.data?.data ?? [];
  const total = expensesQuery.data?.metadata.total ?? 0;
  const totalPages = expensesQuery.data?.metadata.totalPages ?? 1;

  const totals = useMemo(() => {
    let total = 0,
      fixed = 0,
      variable = 0;
    for (const e of list) {
      const a = Number(e.amount ?? 0);
      total += a;
      if (e.type === "fixed") fixed += a;
      else variable += a;
    }
    return { total, fixed, variable };
  }, [list]);

  return (
    <div className="flex flex-col gap-4">
      <MetricStatBar
        items={[
          {
            label: `Tổng chi T${month}/${year}`,
            value: formatVnd(totals.total),
            icon: <Wallet className="h-3.5 w-3.5" />,
            iconClassName: "bg-red-500/10 text-red-500",
            trend: { text: `${list.length} khoản`, className: "text-muted-foreground" },
          },
          {
            label: "Cố định",
            value: formatVnd(totals.fixed),
            icon: <Wallet className="h-3.5 w-3.5" />,
            iconClassName: "bg-amber-500/10 text-amber-600",
            trend: { text: "Định kỳ hàng tháng", className: "text-muted-foreground" },
          },
          {
            label: "Biến đổi",
            value: formatVnd(totals.variable),
            icon: <Wallet className="h-3.5 w-3.5" />,
            iconClassName: "bg-primary/10 text-primary",
            trend: { text: "Phát sinh", className: "text-muted-foreground" },
          },
        ]}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select
            value={String(month)}
            onValueChange={(v) => {
              setMonth(Number(v));
              setPage(1);
            }}
            className="h-9 w-full rounded-lg text-sm sm:w-30"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <SelectOption key={i} value={String(i + 1)}>
                Tháng {i + 1}
              </SelectOption>
            ))}
          </Select>
          <Select
            value={String(year)}
            onValueChange={(v) => {
              setYear(Number(v));
              setPage(1);
            }}
            className="h-9 w-full rounded-lg text-sm sm:w-25"
          >
            {[now.getFullYear() - 1, now.getFullYear()].map((y) => (
              <SelectOption key={y} value={String(y)}>
                {y}
              </SelectOption>
            ))}
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v as ExpenseTypeFilter);
              setPage(1);
            }}
            className="col-span-2 h-9 w-full rounded-lg text-sm sm:col-span-1 sm:w-40"
          >
            <SelectOption value="all">Tất cả loại</SelectOption>
            <SelectOption value="fixed">Cố định</SelectOption>
            <SelectOption value="variable">Biến đổi</SelectOption>
          </Select>
        </div>
        <Button className="h-9 gap-1.5 sm:ml-auto" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Ghi chi phí
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_320px]">
        {/* Expense table */}
        <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Danh sách chi phí</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Khoản chi", "Loại", "Số tiền", "Ngày", "Người ghi", ""].map((h, i) => (
                    <TableHead key={i}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {expensesQuery.isLoading && <TableLoadingRows cols={6} rows={6} />}
                {expensesQuery.error && (
                  <TableErrorRow cols={6} message={String(expensesQuery.error)} />
                )}
                {!expensesQuery.isLoading && list.length === 0 && (
                  <TableEmptyRow cols={6} message="Chưa có chi phí" />
                )}
                {list.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="px-4 py-2.5 text-sm font-semibold">
                      {e.description}
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <TonePill tone={e.type === "fixed" ? "indigo" : "amber"}>
                        {e.type === "fixed" ? "Cố định" : "Biến đổi"}
                      </TonePill>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 font-bold tabular-nums text-red-600">
                      {formatVnd(Number(e.amount))}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                      {fmtDate(e.date)}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                      {e.creator?.fullName ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        className="h-7 rounded-md border-red-200 bg-red-100 text-xs text-red-600 hover:bg-red-200"
                        onClick={() => setDeleteTarget(e)}
                      >
                        Xoá
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
                className="h-8 w-18 text-sm"
              >
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <SelectOption key={s} value={String(s)}>
                    {s}
                  </SelectOption>
                ))}
              </Select>
              <span>
                / trang ·{" "}
                {expensesQuery.isLoading && total === 0 ? "Đang tải..." : `Tổng ${total} khoản`}
              </span>
            </div>
            <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </Card>

        {/* Cost structure */}
        <CostStructureCard totals={totals} />
      </div>

      <ExpenseDrawer open={adding} onClose={() => setAdding(false)} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Xoá chi phí "${deleteTarget?.description}"?`}
        confirmLabel="Xoá"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
