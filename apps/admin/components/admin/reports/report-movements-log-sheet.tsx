"use client";

import { useQuery } from "@tanstack/react-query";
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
import Link from "next/link";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { fmtDateTime } from "@/lib/report-formatters";
import { getMovementTypeLabel } from "@/lib/report-inventory-labels";
import { inventoryReportsClient } from "@/services/reports-inventory.client";
import { movementReferenceRoute } from "./movement-reference-route";

export type MovementsLogTarget = {
  variantId: string;
  sku: string;
  variantName: string;
  productName: string;
};

interface ReportMovementsLogSheetProps {
  target: MovementsLogTarget | null;
  startDate: string;
  endDate: string;
  onClose: () => void;
}

/**
 * Drill-down sheet showing movement log for a single variant within a period.
 * Used from the in-out-movement report (5.3) table row click.
 */
export function ReportMovementsLogSheet({
  target,
  startDate,
  endDate,
  onClose,
}: ReportMovementsLogSheetProps) {
  const open = target !== null;

  const { data, isLoading } = useQuery({
    queryKey: ["inventory-movement-drill", target?.variantId, startDate, endDate],
    queryFn: () =>
      inventoryReportsClient.getMovementDrill({
        variantId: target!.variantId,
        startDate,
        endDate,
      }),
    enabled: open,
  });

  const rows = data?.data ?? [];

  const totalIn = rows
    .filter((r) => r.type === "supplier_receipt")
    .reduce((s, r) => s + r.quantity, 0);
  // stock_out is stored as negative quantity; negate to get positive total
  const totalOut = rows.filter((r) => r.type === "stock_out").reduce((s, r) => s + -r.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-4 sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{target?.sku}</span>
            <span>{target?.productName}</span>
            {target?.variantName && target.variantName !== target.productName && (
              <span className="text-muted-foreground">— {target.variantName}</span>
            )}
          </SheetTitle>
          <SheetDescription>
            Biến động kho • {startDate} → {endDate}
          </SheetDescription>
        </SheetHeader>

        {!isLoading && rows.length > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="default" className="gap-1 font-black tabular-nums">
              Nhập: {totalIn}
            </Badge>
            <Badge variant="destructive" className="gap-1 font-black tabular-nums">
              Xuất: {totalOut}
            </Badge>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-black tracking-widest uppercase">
                  Ngày giờ
                </TableHead>
                <TableHead className="text-xs font-black tracking-widest uppercase">Loại</TableHead>
                <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                  SL
                </TableHead>
                <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                  Tồn sau
                </TableHead>
                <TableHead className="text-xs font-black tracking-widest uppercase">
                  Chứng từ
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableLoadingRows rows={5} cols={5} />
              ) : rows.length === 0 ? (
                <TableEmptyRow cols={5} message="Không có biến động trong kỳ này." />
              ) : (
                rows.map((r) => {
                  const isIn = r.type === "supplier_receipt";
                  const isOut = r.type === "stock_out";
                  const refRoute = movementReferenceRoute(r.type, r.referenceId);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">
                        {fmtDateTime(r.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold">
                          {getMovementTypeLabel(r.type)}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-bold tabular-nums ${
                          isIn
                            ? "text-emerald-600"
                            : isOut
                              ? "text-red-500"
                              : "text-muted-foreground"
                        }`}
                      >
                        {isIn
                          ? `+${r.quantity}`
                          : isOut
                            ? `-${Math.abs(r.quantity)}`
                            : `±${r.quantity}`}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {r.onHandAfter}
                      </TableCell>
                      <TableCell>
                        {refRoute ? (
                          <Link
                            href={refRoute}
                            className="font-mono text-xs text-primary underline-offset-2 hover:underline"
                            target="_blank"
                          >
                            {r.referenceId?.slice(0, 8)}…
                          </Link>
                        ) : r.note ? (
                          <span className="truncate text-xs text-muted-foreground">{r.note}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
