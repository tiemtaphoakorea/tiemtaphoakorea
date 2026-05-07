"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { RECEIPT_STATUS } from "@workspace/shared/constants";
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
import { FileText, Plus, Search } from "lucide-react";
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
import {
  formatDate,
  formatMoney,
  PAYMENT_STATUS_FILTER_OPTIONS,
  PaymentStatusPill,
  type ReceiptRow,
  StatusPill,
} from "./_shared";

type TabId = "all" | "draft" | "completed";

const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "draft", label: "Đang giao dịch" },
  { id: "completed", label: "Hoàn thành" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

function tabToStatus(tab: TabId): string | undefined {
  if (tab === "draft") return RECEIPT_STATUS.DRAFT;
  if (tab === "completed") return RECEIPT_STATUS.COMPLETED;
  return undefined;
}

export default function ReceiptsContent() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [supplierId, setSupplierId] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const suppliersQuery = useQuery({
    queryKey: queryKeys.suppliers.list("", 1, 200),
    queryFn: () => adminClient.getSuppliers({ limit: 200 }),
    staleTime: 5 * 60_000,
  });
  const suppliers = suppliersQuery.data?.data ?? [];

  const receiptsQuery = useQuery({
    queryKey: queryKeys.admin.receipts.list({
      search: debouncedQuery,
      status: tabToStatus(tab),
      supplierId,
      paymentStatus,
      page,
      limit: pageSize,
    }),
    queryFn: async () =>
      await adminClient.getReceipts({
        search: debouncedQuery || undefined,
        status: tabToStatus(tab) ?? "All",
        supplierId: supplierId || undefined,
        paymentStatus: paymentStatus || undefined,
        page,
        limit: pageSize,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const list: ReceiptRow[] = (receiptsQuery.data?.data as ReceiptRow[] | undefined) ?? [];
  const total = receiptsQuery.data?.metadata.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as TabId);
            setPage(1);
          }}
        >
          <TabsList className="h-9">
            {TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="px-3 text-xs">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 sm:ml-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={2} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm mã phiếu, nhà cung cấp..."
            className="h-auto w-full border-0 bg-transparent px-0 py-0 shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 sm:w-52"
          />
        </div>
        <Select
          value={supplierId}
          onValueChange={(v) => {
            setSupplierId(v);
            setPage(1);
          }}
          className="h-9 w-full sm:w-40"
        >
          <SelectOption value="">Tất cả NCC</SelectOption>
          {suppliers.map((s) => (
            <SelectOption key={s.id} value={s.id}>
              {s.name}
            </SelectOption>
          ))}
        </Select>
        <Select
          value={paymentStatus}
          onValueChange={(v) => {
            setPaymentStatus(v);
            setPage(1);
          }}
          className="h-9 w-full sm:w-44"
        >
          {PAYMENT_STATUS_FILTER_OPTIONS.map((opt) => (
            <SelectOption key={opt.value} value={opt.value}>
              {opt.label}
            </SelectOption>
          ))}
        </Select>

        <Button asChild className="h-9 gap-1.5 sm:ml-auto">
          <Link href="/receipts/new">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Tạo phiếu nhập
          </Link>
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "Mã phiếu",
                  "Nhà cung cấp",
                  "Cần trả",
                  "Đã trả",
                  "Còn nợ",
                  "Thanh toán",
                  "Trạng thái",
                  "Ngày nhận",
                ].map((h, i) => (
                  <TableHead key={i}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {receiptsQuery.isLoading && <TableLoadingRows cols={8} rows={5} />}
              {receiptsQuery.error && (
                <TableErrorRow cols={8} message={String(receiptsQuery.error)} />
              )}
              {!receiptsQuery.isLoading && list.length === 0 && (
                <TableEmptyRow cols={8} message="Chưa có phiếu nhập hàng" />
              )}
              {list.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/receipts/${r.id}`)}
                >
                  <TableCell className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10">
                        <FileText className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
                      </div>
                      <span className="font-mono text-xs font-semibold">{r.code}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-sm">{r.supplierName ?? "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-xs">
                    {formatMoney(r.payableAmount)}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-xs text-emerald-700">
                    {formatMoney(r.paidAmount)}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-xs text-red-600">
                    {formatMoney(r.debtAmount)}
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    {r.paymentStatus ? <PaymentStatusPill status={r.paymentStatus} /> : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <StatusPill status={r.status} />
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                    {formatDate(r.receivedAt)}
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
              {receiptsQuery.isLoading && total === 0 ? "Đang tải..." : `Tổng ${total} phiếu`}
            </span>
          </div>
          <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>
    </div>
  );
}
