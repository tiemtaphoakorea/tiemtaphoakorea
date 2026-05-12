"use client";

/**
 * ReportDrilldownOrdersSheet — side sheet showing orders for a clicked dimension
 * (staff, product, customer, time period). Used across sales report pages.
 */

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
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
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { PAYMENT_STATUS_LABELS } from "@/lib/report-sales-labels";
import { type SalesByOrderRow, salesReportsClient } from "@/services/reports-sales.client";

export type OrderDrilldownFilter = {
  startDate: string;
  endDate: string;
  staffId?: string;
  customerId?: string;
  variantId?: string;
};

interface ReportDrilldownOrdersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  filter: OrderDrilldownFilter;
}

function useOrderDrilldown(filter: OrderDrilldownFilter, enabled: boolean) {
  return useQuery({
    queryKey: ["reports", "orders-drilldown", filter],
    enabled,
    queryFn: () =>
      salesReportsClient.getByOrder({
        startDate: filter.startDate,
        endDate: filter.endDate,
        page: 1,
        limit: 50,
      }),
  });
}

export function ReportDrilldownOrdersSheet({
  open,
  onOpenChange,
  title,
  filter,
}: ReportDrilldownOrdersSheetProps) {
  const { data, isLoading } = useOrderDrilldown(filter, open);

  const rows: SalesByOrderRow[] = data?.data ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base font-bold">{title}</SheetTitle>
          <p className="text-xs text-muted-foreground">
            {filter.startDate} → {filter.endDate}
            {rows.length > 0 && ` · ${rows.length} đơn (tối đa 50)`}
          </p>
        </SheetHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-black tracking-widest uppercase">
                  Mã đơn
                </TableHead>
                <TableHead className="text-xs font-black tracking-widest uppercase">
                  Khách hàng
                </TableHead>
                <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                  Doanh thu
                </TableHead>
                <TableHead className="text-xs font-black tracking-widest uppercase">
                  TT Thanh toán
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    Không có đơn hàng nào
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={`${ADMIN_ROUTES.ORDERS}/${r.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {r.orderNumber}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{r.customerName}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums font-semibold">
                      {formatCurrency(r.revenue)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {PAYMENT_STATUS_LABELS[r.paymentStatus] ?? r.paymentStatus}
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
