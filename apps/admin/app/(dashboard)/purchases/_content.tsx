"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PURCHASE_ORDER_STATUS } from "@workspace/shared/constants";
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
import { Plus, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/admin/shared/data-state";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { type PurchaseOrderRow, StatusPill } from "./_shared";

const fmtDate = (d: string | Date | null) => (d ? format(new Date(d), "dd/MM/yyyy, HH:mm") : "—");

const TABS = [
  { value: "All", label: "Tất cả" },
  { value: PURCHASE_ORDER_STATUS.ORDERED, label: "Chưa nhập" },
  { value: PURCHASE_ORDER_STATUS.PARTIAL, label: "Một phần" },
  { value: PURCHASE_ORDER_STATUS.RECEIVED, label: "Hoàn thành" },
] as const;

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

export default function PurchasesContent() {
  const router = useRouter();
  const [tab, setTab] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [supplierId, setSupplierId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const suppliersQuery = useQuery({
    queryKey: queryKeys.suppliers.list("", 1, 200),
    queryFn: () => adminClient.getSuppliers({ limit: 200 }),
    staleTime: 5 * 60_000,
  });
  const suppliers = suppliersQuery.data?.data ?? [];

  const listQuery = useQuery({
    queryKey: queryKeys.admin.purchases.list({
      search: debouncedQuery,
      status: tab,
      supplierId,
      page,
      limit: pageSize,
    }),
    queryFn: async () =>
      await adminClient.getPurchases({
        search: debouncedQuery || undefined,
        status: tab,
        supplierId: supplierId || undefined,
        page,
        limit: pageSize,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const list: PurchaseOrderRow[] = (listQuery.data?.data as PurchaseOrderRow[] | undefined) ?? [];
  const total = listQuery.data?.metadata.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v);
            setPage(1);
          }}
        >
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={2} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo mã đơn, nhà cung cấp, ghi chú..."
            className="h-auto w-full border-0 bg-transparent px-0 py-0 shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 sm:w-64"
          />
        </div>
        <Select
          value={supplierId}
          onValueChange={(v) => {
            setSupplierId(v);
            setPage(1);
          }}
          className="h-9 w-full sm:w-44"
        >
          <SelectOption value="">Tất cả NCC</SelectOption>
          {suppliers.map((s) => (
            <SelectOption key={s.id} value={s.id}>
              {s.name}
            </SelectOption>
          ))}
        </Select>
        <Button asChild className="h-9 gap-1.5 sm:ml-auto">
          <Link href="/purchases/new">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Tạo đơn nhập
          </Link>
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "Mã đơn",
                  "Ngày tạo",
                  "Trạng thái",
                  "Nhà cung cấp",
                  "Người tạo",
                  "Số lượng đặt",
                ].map((h, i) => (
                  <TableHead key={i}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isLoading && <TableLoadingRows cols={6} rows={5} />}
              {listQuery.error && <TableErrorRow cols={6} message={String(listQuery.error)} />}
              {!listQuery.isLoading && !listQuery.error && list.length === 0 && (
                <TableEmptyRow cols={6} message="Chưa có đơn nhập" />
              )}
              {list.map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/purchases/${o.id}`)}
                >
                  <TableCell className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10">
                        <ShoppingCart className="h-4 w-4 text-primary" strokeWidth={1.8} />
                      </div>
                      <span className="font-mono text-sm font-semibold">{o.code}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                    {fmtDate(o.createdAt)}
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <StatusPill status={o.status} />
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-sm">
                    {o.supplierName ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-sm text-muted-foreground">
                    {o.createdByName ?? "—"}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums">{o.totalQty}</TableCell>
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
              / trang · {listQuery.isLoading && total === 0 ? "Đang tải..." : `Tổng ${total} đơn`}
            </span>
          </div>
          <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>
    </div>
  );
}
