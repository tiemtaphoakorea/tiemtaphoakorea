"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Expense } from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
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
import { Plus, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/admin/shared/data-state";
import { ExpenseDrawer } from "@/components/admin/shared/expense-drawer";
import { formatVnd } from "@/components/admin/shared/format-vnd";
import { StatCard } from "@/components/admin/shared/stat-card";
import { TonePill } from "@/components/admin/shared/status-badge";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type ExpenseTypeFilter = "all" | "fixed" | "variable";

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
      <div className="grid grid-cols-2 gap-3 max-sm:gap-0 max-sm:overflow-hidden max-sm:rounded-[10px] max-sm:border max-sm:border-border [&>*:nth-child(2)]:max-sm:border-r-0 [&>*:last-child]:max-sm:col-span-2 [&>*:last-child]:max-sm:border-r-0 [&>*:last-child]:max-sm:border-b-0 sm:grid-cols-3">
        <StatCard
          label={`Tổng chi T${month}/${year}`}
          value={formatVnd(totals.total)}
          delta={`${list.length} khoản`}
          direction="down"
          icon={Wallet}
          tone="danger"
        />
        <StatCard
          label="Cố định"
          value={formatVnd(totals.fixed)}
          delta="Định kỳ hàng tháng"
          direction="down"
          icon={Wallet}
          tone="amber"
        />
        <StatCard
          label="Biến đổi"
          value={formatVnd(totals.variable)}
          delta="Phát sinh"
          direction="down"
          icon={Wallet}
          tone="primary"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select
            value={String(month)}
            onValueChange={(v) => {
              setMonth(Number(v));
              setPage(1);
            }}
            className="h-[34px] w-full rounded-lg text-[13px] sm:w-[120px]"
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
            className="h-[34px] w-full rounded-lg text-[13px] sm:w-[100px]"
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
            className="col-span-2 h-[34px] w-full rounded-lg text-[13px] sm:col-span-1 sm:w-[160px]"
          >
            <SelectOption value="all">Tất cả loại</SelectOption>
            <SelectOption value="fixed">Cố định</SelectOption>
            <SelectOption value="variable">Biến đổi</SelectOption>
          </Select>
        </div>
        <Button className="h-[34px] gap-1.5 sm:ml-auto" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Ghi chi phí
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {["Khoản chi", "Loại", "Số tiền", "Ngày", "Người ghi", ""].map((h, i) => (
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
              {expensesQuery.isLoading && <TableLoadingRows cols={6} rows={6} />}
              {expensesQuery.error && (
                <TableErrorRow cols={6} message={String(expensesQuery.error)} />
              )}
              {!expensesQuery.isLoading && list.length === 0 && (
                <TableEmptyRow cols={6} message="Chưa có chi phí" />
              )}
              {list.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="px-4 py-2.5 text-[13px] font-semibold">
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
              {expensesQuery.isLoading && total === 0 ? "Đang tải..." : `Tổng ${total} khoản`}
            </span>
          </div>
          <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>

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
