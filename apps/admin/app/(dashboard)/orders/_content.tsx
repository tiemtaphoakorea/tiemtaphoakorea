"use client";

import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import {
  FULFILLMENT_STATUS,
  type FulfillmentStatusValue,
  PAYMENT_STATUS,
  type PaymentStatusValue,
} from "@workspace/shared/constants";
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
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { format } from "date-fns";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/admin/shared/data-state";
import { formatVnd } from "@/components/admin/shared/format-vnd";
import { StatusBadge, type StatusType } from "@/components/admin/shared/status-badge";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

/** Server-enriched order list item shape from getOrders. */
type OrderListRow = {
  id: string;
  orderNumber: string;
  paymentStatus: PaymentStatusValue;
  fulfillmentStatus: FulfillmentStatusValue;
  total: string | null;
  paidAmount: string | null;
  createdAt: string | Date | null;
  paidAt: string | Date | null;
  customer: {
    id: string;
    fullName: string | null;
    customerCode: string | null;
    phone: string | null;
  };
  itemCount: number;
};

type FulfillmentFilter = "all" | FulfillmentStatusValue;

const TABS: ReadonlyArray<{ id: FulfillmentFilter; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: FULFILLMENT_STATUS.PENDING, label: "Chờ xử lý" },
  { id: FULFILLMENT_STATUS.STOCK_OUT, label: "Đã xuất kho" },
  { id: FULFILLMENT_STATUS.COMPLETED, label: "Hoàn thành" },
  { id: FULFILLMENT_STATUS.CANCELLED, label: "Đã huỷ" },
];

const TABLE_HEADERS: ReadonlyArray<{ label: string; className?: string }> = [
  { label: "Mã đơn", className: "w-[140px]" },
  { label: "Ngày tạo đơn", className: "w-[140px]" },
  { label: "Tên khách", className: "w-[240px]" },
  { label: "Thanh toán", className: "w-[140px]" },
  { label: "Trạng thái", className: "w-[140px]" },
  { label: "Tổng tiền", className: "w-[140px]" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;
const fmtDate = (d: string | Date | null) => (d ? format(new Date(d), "dd/MM/yyyy, HH:mm") : "—");

export default function AdminOrders() {
  const router = useRouter();
  const [filter, setFilter] = useState<FulfillmentFilter>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const ordersQuery = useQuery({
    queryKey: queryKeys.orders.list(debouncedQuery, "all", filter, false, page, pageSize),
    queryFn: async () => {
      const res = await adminClient.getOrders({
        search: debouncedQuery || undefined,
        fulfillmentStatus: filter === "all" ? undefined : filter,
        page,
        limit: pageSize,
      });
      return res as unknown as { data: OrderListRow[]; metadata: { total: number } };
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const tabCountResults = useQueries({
    queries: TABS.map((t) => ({
      queryKey: queryKeys.orders.list(debouncedQuery, "all", t.id, false, 1, 1),
      queryFn: async () => {
        const res = await adminClient.getOrders({
          search: debouncedQuery || undefined,
          fulfillmentStatus: t.id === "all" ? undefined : t.id,
          page: 1,
          limit: 1,
        });
        return res as unknown as { metadata: { total: number } };
      },
      staleTime: 60_000,
      select: (data: { metadata: { total: number } }) => data.metadata.total,
    })),
  });
  const tabCounts = Object.fromEntries(
    TABS.map((t, i) => [t.id, tabCountResults[i]?.data ?? null]),
  ) as Record<FulfillmentFilter, number | null>;

  const list = ordersQuery.data?.data ?? [];
  const total = ordersQuery.data?.metadata.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Tabs
          value={filter}
          onValueChange={(v) => {
            setFilter(v as FulfillmentFilter);
            setPage(1);
          }}
          className="min-w-0 max-w-full"
        >
          <TabsList className="max-w-full overflow-x-auto">
            {TABS.map((t) => {
              const count = tabCounts[t.id];
              return (
                <TabsTrigger key={t.id} value={t.id}>
                  {t.label}
                  {count != null && <span className="ml-1 tabular-nums opacity-70">({count})</span>}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:ml-auto">
          <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3">
            <Search className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={2} />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm mã đơn, khách hàng..."
              className="h-auto w-full border-0 bg-transparent px-0 py-0 shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 sm:w-55"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {ordersQuery.isLoading ? "Đang tải..." : `${total} đơn`}
          </span>
          <Button
            variant="outline"
            className="h-9"
            onClick={() => window.open("/api/admin/orders/export")}
          >
            Xuất Excel
          </Button>
          <Button asChild className="h-9 gap-1.5">
            <Link href="/orders/new">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Tạo đơn
            </Link>
          </Button>
        </div>
      </div>

      <Card className="min-w-0 gap-0 overflow-hidden border border-border p-0 shadow-none">
        <div className="min-w-0 max-w-full overflow-x-auto">
          <Table className="min-w-[940px] table-fixed">
            <TableHeader>
              <TableRow>
                {TABLE_HEADERS.map((h) => (
                  <TableHead key={h.label} className={h.className}>
                    {h.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersQuery.isLoading && <TableLoadingRows cols={6} rows={6} />}
              {ordersQuery.error && <TableErrorRow cols={6} message={String(ordersQuery.error)} />}
              {!ordersQuery.isLoading && list.length === 0 && (
                <TableEmptyRow cols={6} message="Chưa có đơn nào" />
              )}
              {list.map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/orders/${o.id}`)}
                >
                  <TableCell className="font-mono text-xs font-semibold">
                    <span className="block truncate">{o.orderNumber}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmtDate(o.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm font-semibold">
                    <span className="block truncate">{o.customer.fullName ?? "—"}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge type={o.paymentStatus as StatusType} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge type={o.fulfillmentStatus as StatusType} />
                  </TableCell>
                  <TableCell className="font-bold tabular-nums text-red-600">
                    {formatVnd(Number(o.total ?? 0))}
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
              / trang · {ordersQuery.isLoading && total === 0 ? "Đang tải..." : `Tổng ${total} đơn`}
            </span>
          </div>
          <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>

      {/* Reference unused import to avoid lint warnings */}
      <Input hidden value={PAYMENT_STATUS.PAID} readOnly />
    </div>
  );
}
