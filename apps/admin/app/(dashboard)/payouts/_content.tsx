"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PAYMENT_METHOD, PAYMENT_METHOD_LABEL } from "@workspace/shared/constants";
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
import { format } from "date-fns";
import { Search } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/admin/shared/data-state";
import { type BadgeTone, TonePill } from "@/components/admin/shared/status-badge";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type PayoutRow = {
  id: string;
  code: string;
  supplierId: string | null;
  supplierName: string | null;
  receiptId: string | null;
  receiptCode: string | null;
  amount: string;
  method: string;
  referenceCode: string | null;
  paidAt: string | Date | null;
  note: string | null;
  createdAt: string | Date | null;
  createdByName: string | null;
};

const METHOD_OPTIONS = [
  { value: "All", label: "Tất cả PTTT" },
  { value: PAYMENT_METHOD.CASH, label: PAYMENT_METHOD_LABEL.cash },
  { value: PAYMENT_METHOD.BANK_TRANSFER, label: PAYMENT_METHOD_LABEL.bank_transfer },
  { value: PAYMENT_METHOD.CARD, label: PAYMENT_METHOD_LABEL.card },
];

const METHOD_TONE: Record<string, BadgeTone> = {
  [PAYMENT_METHOD.CASH]: "green",
  [PAYMENT_METHOD.BANK_TRANSFER]: "blue",
  [PAYMENT_METHOD.CARD]: "indigo",
};

type SupplierRow = { id: string; name: string };

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;
const formatDate = (d: string | Date | null) =>
  d ? format(new Date(d), "dd/MM/yyyy, HH:mm") : "—";

function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `${n.toLocaleString("vi-VN")}đ`;
}

export default function PayoutsContent() {
  const [supplierFilter, setSupplierFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const suppliersQuery = useQuery({
    queryKey: queryKeys.admin.suppliersActive,
    queryFn: async () => {
      const res = await adminClient.getSuppliers({ limit: 200 });
      return (res as unknown as { data: SupplierRow[] }).data ?? [];
    },
    staleTime: 60_000,
  });

  const payoutsQuery = useQuery({
    queryKey: queryKeys.admin.payouts.list({
      supplierId: supplierFilter !== "All" ? supplierFilter : undefined,
      method: methodFilter !== "All" ? methodFilter : undefined,
      page,
      limit: pageSize,
    }),
    queryFn: async () =>
      await adminClient.getPayouts({
        supplierId: supplierFilter !== "All" ? supplierFilter : undefined,
        method:
          methodFilter !== "All" ? (methodFilter as "cash" | "bank_transfer" | "card") : undefined,
        page,
        limit: pageSize,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const suppliers: SupplierRow[] = suppliersQuery.data ?? [];
  const allPayouts: PayoutRow[] = (payoutsQuery.data?.data as PayoutRow[] | undefined) ?? [];
  const total = payoutsQuery.data?.metadata.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Search remains client-side (small page) — backend pagination already
  // narrows the dataset; users typically search the visible page.
  const list = debouncedQuery
    ? allPayouts.filter(
        (p) =>
          p.code.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          (p.supplierName ?? "").toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          (p.receiptCode ?? "").toLowerCase().includes(debouncedQuery.toLowerCase()),
      )
    : allPayouts;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={2} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm mã PCH, NCC, phiếu nhập..."
            className="h-auto w-full border-0 bg-transparent px-0 py-0 shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 sm:w-60"
          />
        </div>

        <Select
          value={supplierFilter}
          onValueChange={(v) => {
            setSupplierFilter(v);
            setPage(1);
          }}
          className="h-9 w-full sm:w-48"
        >
          <SelectOption value="All">Tất cả NCC</SelectOption>
          {suppliers.map((s) => (
            <SelectOption key={s.id} value={s.id}>
              {s.name}
            </SelectOption>
          ))}
        </Select>

        <Select
          value={methodFilter}
          onValueChange={(v) => {
            setMethodFilter(v);
            setPage(1);
          }}
          className="h-9 w-full sm:w-40"
        >
          {METHOD_OPTIONS.map((opt) => (
            <SelectOption key={opt.value} value={opt.value}>
              {opt.label}
            </SelectOption>
          ))}
        </Select>

        <Button
          variant="outline"
          className="h-9 sm:ml-auto"
          onClick={() => {
            setSupplierFilter("All");
            setMethodFilter("All");
            setQuery("");
          }}
        >
          Xoá bộ lọc
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "Mã phiếu chi",
                  "Nhà cung cấp",
                  "Phiếu nhập",
                  "Số tiền",
                  "Phương thức",
                  "Ngày thanh toán",
                  "Người tạo",
                ].map((h, i) => (
                  <TableHead key={i}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payoutsQuery.isLoading && <TableLoadingRows cols={7} rows={5} />}
              {payoutsQuery.error && (
                <TableErrorRow cols={7} message={String(payoutsQuery.error)} />
              )}
              {!payoutsQuery.isLoading && list.length === 0 && (
                <TableEmptyRow cols={7} message="Chưa có phiếu chi nào" />
              )}
              {list.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="px-4 py-2.5 font-mono text-xs font-semibold">
                    {p.code}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-sm">{p.supplierName ?? "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {p.receiptCode ?? "—"}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-sm font-medium">
                    {formatMoney(p.amount)}
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <TonePill tone={METHOD_TONE[p.method] ?? "gray"}>
                      {PAYMENT_METHOD_LABEL[p.method as keyof typeof PAYMENT_METHOD_LABEL] ??
                        p.method}
                    </TonePill>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                    {formatDate(p.paidAt)}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                    {p.createdByName ?? "—"}
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
              {payoutsQuery.isLoading && total === 0 ? "Đang tải..." : `Tổng ${total} phiếu chi`}
            </span>
          </div>
          <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>
    </div>
  );
}
