"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { CustomerStatsItem } from "@workspace/database/types/admin";
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
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { CustomerDrawer } from "@/components/admin/shared/customer-drawer";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/admin/shared/data-state";
import { formatVnd } from "@/components/admin/shared/mock-data";
import { type BadgeTone, TonePill } from "@/components/admin/shared/status-badge";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

/** Tier inference from totalSpent — replicates business rule until tier-config is wired. */
function customerTier(totalSpent: number): { label: string; tone: BadgeTone } {
  if (totalSpent >= 5_000_000) return { label: "VIP", tone: "amber" };
  if (totalSpent >= 1_000_000) return { label: "Regular", tone: "indigo" };
  return { label: "New", tone: "gray" };
}

const fmtDate = (d: Date | string | null): string => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
};

export default function AdminCustomers() {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<CustomerStatsItem | null | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const customersQuery = useQuery({
    queryKey: queryKeys.customers.list(debouncedQuery, statusFilter, page, pageSize, "all"),
    queryFn: async () =>
      await adminClient.getCustomers({
        search: debouncedQuery || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        page,
        limit: pageSize,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const list: CustomerStatsItem[] = customersQuery.data?.data ?? [];
  const total = customersQuery.data?.metadata.total ?? 0;
  const totalPages = customersQuery.data?.metadata.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex h-[34px] items-center gap-2 rounded-lg border border-border bg-white px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={2} />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm tên, SĐT, mã KH..."
            className="h-auto w-full border-0 bg-transparent px-0 py-0 shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 sm:w-[220px]"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          className="h-[34px] w-full rounded-lg text-[13px] sm:w-[160px]"
        >
          <SelectOption value="all">Tất cả trạng thái</SelectOption>
          <SelectOption value="active">Đang hoạt động</SelectOption>
          <SelectOption value="inactive">Ngừng hoạt động</SelectOption>
        </Select>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button variant="outline" className="h-[34px] flex-1 sm:flex-none">
            Xuất danh sách
          </Button>
          <Button className="h-[34px] flex-1 gap-1.5 sm:flex-none" onClick={() => setEditing(null)}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Thêm KH
          </Button>
        </div>
      </div>

      <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {[
                  "Khách hàng",
                  "Mã KH",
                  "SĐT",
                  "Đơn hàng",
                  "Tổng chi tiêu",
                  "Tham gia",
                  "Hạng",
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
              {customersQuery.isLoading && <TableLoadingRows cols={7} rows={6} />}
              {customersQuery.error && (
                <TableErrorRow cols={7} message={String(customersQuery.error)} />
              )}
              {!customersQuery.isLoading && list.length === 0 && (
                <TableEmptyRow cols={7} message="Chưa có khách hàng" />
              )}
              {list.map((c) => {
                const tier = customerTier(c.totalSpent);
                const initial = c.fullName?.charAt(0) ?? "?";
                return (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setEditing(c)}>
                    <TableCell className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {c.avatarUrl ? (
                          // biome-ignore lint/performance/noImgElement: external avatar URL
                          <img
                            src={c.avatarUrl}
                            alt={c.fullName ?? ""}
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-[13px] font-bold text-white">
                            {initial}
                          </div>
                        )}
                        <span className="text-[13px] font-semibold">{c.fullName ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                      {c.customerCode ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-xs">{c.phone ?? "—"}</TableCell>
                    <TableCell className="px-4 py-2.5 font-semibold tabular-nums">
                      {c.orderCount}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 font-bold tabular-nums text-red-600">
                      {formatVnd(c.totalSpent)}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                      {fmtDate(c.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <TonePill tone={tier.tone}>{tier.label}</TonePill>
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
              {customersQuery.isLoading && total === 0 ? "Đang tải..." : `Tổng ${total} khách hàng`}
            </span>
          </div>
          <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>

      <CustomerDrawer
        open={editing !== undefined}
        customer={editing ?? null}
        onClose={() => setEditing(undefined)}
      />
    </div>
  );
}
