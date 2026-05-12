"use client";

import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@workspace/shared/utils";
import { Badge } from "@workspace/ui/components/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { fmtDateTime } from "@/lib/report-formatters";
import { reportsClient } from "@/services/reports.client";

type Target =
  | { kind: "customer"; id: string; name: string }
  | { kind: "supplier"; id: string; name: string };

interface DebtTransactionsSheetProps {
  target: Target | null;
  startDate: string;
  endDate: string;
  /** Which side to highlight when opened: 'increase' or 'decrease'. */
  focus?: "increase" | "decrease";
  onClose: () => void;
}

export function DebtTransactionsSheet({
  target,
  startDate,
  endDate,
  focus,
  onClose,
}: DebtTransactionsSheetProps) {
  const open = target !== null;

  const { data, isLoading } = useQuery({
    queryKey: ["reports", target?.kind, "debt-transactions", target?.id, startDate, endDate],
    queryFn: () =>
      target?.kind === "customer"
        ? reportsClient.getCustomerDebtTransactions(target.id, { startDate, endDate })
        : target?.kind === "supplier"
          ? reportsClient.getSupplierDebtTransactions(target.id, { startDate, endDate })
          : Promise.resolve({ increases: [], decreases: [] }),
    enabled: open,
  });

  const partyLabel = target?.kind === "customer" ? "Khách hàng" : "Nhà cung cấp";
  const increaseLabel = target?.kind === "customer" ? "Đơn hàng (tăng nợ)" : "Phiếu nhập (tăng nợ)";
  const decreaseLabel =
    target?.kind === "customer" ? "Thanh toán (giảm nợ)" : "Phiếu chi (giảm nợ)";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-4 sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{target?.name}</SheetTitle>
          <SheetDescription>
            {partyLabel} • Kỳ {startDate} → {endDate}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-auto pr-1">
          <Section
            title={increaseLabel}
            tone="increase"
            highlighted={focus === "increase"}
            rows={data?.increases ?? []}
            loading={isLoading}
          />
          <Section
            title={decreaseLabel}
            tone="decrease"
            highlighted={focus === "decrease"}
            rows={data?.decreases ?? []}
            loading={isLoading}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({
  title,
  tone,
  highlighted,
  rows,
  loading,
}: {
  title: string;
  tone: "increase" | "decrease";
  highlighted: boolean;
  rows: {
    id: string;
    date: string | Date;
    reference: string;
    amount: number;
    note: string | null;
  }[];
  loading: boolean;
}) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return (
    <div
      className={
        highlighted
          ? "rounded-xl border border-primary/40 p-3"
          : "rounded-xl border border-border p-3"
      }
    >
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-bold tracking-tight">{title}</h3>
        <Badge
          variant={tone === "increase" ? "destructive" : "default"}
          className="font-black tabular-nums"
        >
          {formatCurrency(total)}
        </Badge>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs font-black tracking-widest uppercase">Ngày</TableHead>
            <TableHead className="text-xs font-black tracking-widest uppercase">Chứng từ</TableHead>
            <TableHead className="text-right text-xs font-black tracking-widest uppercase">
              Số tiền
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingRows rows={3} cols={3} />
          ) : rows.length === 0 ? (
            <TableEmptyRow cols={3} message="Không có giao dịch." />
          ) : (
            rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm tabular-nums">{fmtDateTime(r.date)}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{r.reference}</span>
                    {r.note && (
                      <span className="truncate text-xs text-muted-foreground">{r.note}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right text-sm font-bold tabular-nums">
                  {formatCurrency(r.amount)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
