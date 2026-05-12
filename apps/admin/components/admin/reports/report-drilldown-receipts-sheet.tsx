"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
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
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { fmtDateTime } from "@/lib/report-formatters";
import {
  purchasesReportsClient,
  type ReceiptDrilldownRow,
} from "@/services/reports-purchases.client";

export type ReceiptDrilldownTarget =
  | { kind: "supplier"; id: string; name: string }
  | { kind: "product"; id: string; name: string }
  | { kind: "staff"; id: string; name: string };

interface ReportDrilldownReceiptsSheetProps {
  target: ReceiptDrilldownTarget | null;
  startDate: string;
  endDate: string;
  onClose: () => void;
}

export function ReportDrilldownReceiptsSheet({
  target,
  startDate,
  endDate,
  onClose,
}: ReportDrilldownReceiptsSheetProps) {
  const open = target !== null;

  const { data, isLoading } = useQuery({
    queryKey: ["purchases-drilldown", target?.kind, target?.id, startDate, endDate],
    queryFn: () => {
      if (!target) return Promise.resolve({ data: [] as ReceiptDrilldownRow[] });
      if (target.kind === "supplier") {
        return purchasesReportsClient.getSupplierReceipts({
          supplierId: target.id,
          startDate,
          endDate,
        });
      }
      if (target.kind === "product") {
        return purchasesReportsClient.getProductReceipts({
          variantId: target.id,
          startDate,
          endDate,
        });
      }
      // staff (or unknown bucket id="unknown")
      return purchasesReportsClient.getStaffReceipts({
        staffId: target.id,
        startDate,
        endDate,
      });
    },
    enabled: open,
  });

  const rows = data?.data ?? [];
  const isProductDrilldown = target?.kind === "product";

  const kindLabel =
    target?.kind === "supplier"
      ? "Nhà cung cấp"
      : target?.kind === "product"
        ? "Sản phẩm / biến thể"
        : "Nhân viên";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-4 sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{target?.name}</SheetTitle>
          <SheetDescription>
            {kindLabel} • Kỳ {startDate} → {endDate}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-auto pr-1">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-bold tracking-tight">Phiếu nhập hàng</h3>
            <Badge variant="outline" className="font-black tabular-nums">
              {rows.length} phiếu
            </Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-black tracking-widest uppercase">Ngày</TableHead>
                <TableHead className="text-xs font-black tracking-widest uppercase">
                  Mã phiếu
                </TableHead>
                {isProductDrilldown ? (
                  <>
                    <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                      SL
                    </TableHead>
                    <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                      Thành tiền
                    </TableHead>
                  </>
                ) : (
                  <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                    Giá trị
                  </TableHead>
                )}
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableLoadingRows rows={5} cols={isProductDrilldown ? 5 : 4} />
              ) : rows.length === 0 ? (
                <TableEmptyRow
                  cols={isProductDrilldown ? 5 : 4}
                  message="Không có phiếu nhập trong kỳ này."
                />
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      {fmtDateTime(r.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold">{r.code}</TableCell>
                    {isProductDrilldown ? (
                      <>
                        <TableCell className="text-right text-sm tabular-nums">
                          {r.quantity ?? 0}
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold tabular-nums">
                          {formatCurrency(r.lineTotal ?? 0)}
                        </TableCell>
                      </>
                    ) : (
                      <TableCell className="text-right text-sm font-bold tabular-nums">
                        {formatCurrency(r.payableAmount ?? 0)}
                      </TableCell>
                    )}
                    <TableCell>
                      <Link
                        href={ADMIN_ROUTES.RECEIPT_DETAIL(r.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-muted-foreground hover:text-foreground"
                        title="Mở phiếu nhập"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
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
