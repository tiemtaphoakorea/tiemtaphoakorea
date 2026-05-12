"use client";

/**
 * ReportDrilldownPaymentsSheet — side sheet showing payment transactions for a
 * clicked dimension (method, staff, time period). Used by payments-by-* pages.
 */

import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@workspace/shared/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { type PaymentsByTimeRow, salesReportsClient } from "@/services/reports-sales.client";

export type PaymentDrilldownFilter = {
  startDate: string;
  endDate: string;
  /** Optional period label to display (e.g. "2026-05-01") */
  periodLabel?: string;
  /** Optional method key to display (e.g. "cash") */
  methodKey?: string;
};

interface ReportDrilldownPaymentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  filter: PaymentDrilldownFilter;
}

/** Fetches payments-by-time summary rows for the given date range (used as proxy data). */
function usePaymentsDrilldown(filter: PaymentDrilldownFilter, enabled: boolean) {
  return useQuery({
    queryKey: ["reports", "payments-drilldown", filter],
    enabled,
    queryFn: () =>
      salesReportsClient.getPaymentsByTime({
        startDate: filter.startDate,
        endDate: filter.endDate,
        groupBy: "day",
      }),
  });
}

export function ReportDrilldownPaymentsSheet({
  open,
  onOpenChange,
  title,
  filter,
}: ReportDrilldownPaymentsSheetProps) {
  const { data, isLoading } = usePaymentsDrilldown(filter, open);

  const rows: PaymentsByTimeRow[] = data?.data ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base font-bold">{title}</SheetTitle>
          <p className="text-xs text-muted-foreground">
            {filter.startDate} → {filter.endDate}
          </p>
        </SheetHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-black tracking-widest uppercase">Kỳ</TableHead>
                <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                  Tiền mặt
                </TableHead>
                <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                  CK
                </TableHead>
                <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                  Thẻ
                </TableHead>
                <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                  Tổng
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Không có giao dịch nào
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-mono">{r.period}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatCurrency(r.cashTotal)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatCurrency(r.bankTotal)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatCurrency(r.cardTotal)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums font-semibold">
                      {formatCurrency(r.total)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
