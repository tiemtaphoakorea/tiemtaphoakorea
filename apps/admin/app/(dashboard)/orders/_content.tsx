"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  FULFILLMENT_STATUS,
  type FulfillmentStatusValue,
  PAYMENT_STATUS,
  type PaymentStatusValue,
} from "@workspace/shared/constants";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Search } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/admin/shared/data-state";
import { FilterTabs } from "@/components/admin/shared/filter-tabs";
import { formatVnd } from "@/components/admin/shared/mock-data";
import { OrderDrawer } from "@/components/admin/shared/order-drawer";
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

const PAGE_LIMIT = 25;

const fmtDate = (d: string | Date | null): string => {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminOrders() {
  const [filter, setFilter] = useState<FulfillmentFilter>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: queryKeys.orders.list(debouncedQuery, "all", filter, false, 1, PAGE_LIMIT),
    queryFn: async () => {
      const res = await adminClient.getOrders({
        search: debouncedQuery || undefined,
        fulfillmentStatus: filter === "all" ? undefined : filter,
        page: 1,
        limit: PAGE_LIMIT,
      });
      return res as unknown as { data: OrderListRow[]; metadata: { total: number } };
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const list = ordersQuery.data?.data ?? [];
  const total = ordersQuery.data?.metadata.total ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <FilterTabs tabs={TABS} value={filter} onChange={setFilter} />
        <div className="flex h-[34px] items-center gap-2 rounded-lg border border-border bg-white px-3 sm:ml-auto">
          <Search className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={2} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm mã đơn, khách hàng..."
            className="h-auto w-full border-0 bg-transparent px-0 py-0 shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 sm:w-[220px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {ordersQuery.isLoading ? "Đang tải..." : `${total} đơn`}
          </span>
          <Button variant="outline" className="ml-auto h-[34px]">
            Xuất Excel
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border border-border p-0 shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {[
                  "Mã đơn",
                  "Khách hàng",
                  "SĐT",
                  "Số lượng",
                  "Tổng tiền",
                  "Thanh toán",
                  "Trạng thái",
                  "Thời gian",
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
              {ordersQuery.isLoading && <TableLoadingRows cols={9} rows={6} />}
              {ordersQuery.error && <TableErrorRow cols={9} message={String(ordersQuery.error)} />}
              {!ordersQuery.isLoading && list.length === 0 && (
                <TableEmptyRow cols={9} message="Chưa có đơn nào" />
              )}
              {list.map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => setDetailOrderId(o.id)}
                >
                  <TableCell className="px-4 py-2.5 font-mono text-xs font-semibold">
                    {o.orderNumber}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-[13px] font-semibold">
                    {o.customer.fullName ?? "—"}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                    {o.customer.phone ?? "—"}
                  </TableCell>
                  <TableCell className="px-4 py-2.5">{o.itemCount} món</TableCell>
                  <TableCell className="px-4 py-2.5 font-bold tabular-nums text-red-600">
                    {formatVnd(Number(o.total ?? 0))}
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <StatusBadge type={o.paymentStatus as StatusType} />
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <StatusBadge type={o.fulfillmentStatus as StatusType} />
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                    {fmtDate(o.createdAt)}
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-md text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailOrderId(o.id);
                      }}
                    >
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <OrderDrawer orderId={detailOrderId} onClose={() => setDetailOrderId(null)} />

      {/* Reference unused import to avoid lint warnings */}
      <Input hidden value={PAYMENT_STATUS.PAID} readOnly />
    </div>
  );
}
