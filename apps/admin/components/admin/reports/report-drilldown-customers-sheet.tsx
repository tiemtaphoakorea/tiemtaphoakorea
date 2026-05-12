"use client";

/**
 * Reusable drilldown sheet for customer lists in:
 *  - 6.3 (by-product): lists customers who bought a specific variant
 *  - 6.4 (new-vs-returning): lists customers in a segment bucket
 *
 * Clicking a customer row opens `/customers/{id}` in a new tab.
 */

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
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
import { CUSTOMER_SEGMENT_LABELS } from "@/lib/report-customers-labels";
import { customersReportClient, type SegmentBucket } from "@/services/reports-customers.client";

// ─── Prop types ──────────────────────────────────────────────────────────────

/** Drilldown for 6.3 — customers who bought a specific variant */
type VariantTarget = {
  kind: "variant";
  variantId: string;
  /** Display label shown in sheet header, e.g. "Áo thun - S / Trắng" */
  label: string;
};

/** Drilldown for 6.4 — customers in a segment bucket */
type BucketTarget = {
  kind: "bucket";
  bucket: SegmentBucket;
};

export type CustomerDrilldownTarget = VariantTarget | BucketTarget;

interface ReportDrilldownCustomersSheetProps {
  target: CustomerDrilldownTarget | null;
  startDate: string;
  endDate: string;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ReportDrilldownCustomersSheet({
  target,
  startDate,
  endDate,
  onClose,
}: ReportDrilldownCustomersSheetProps) {
  const open = target !== null;

  const title =
    target?.kind === "variant"
      ? `KH mua: ${target.label}`
      : target?.kind === "bucket"
        ? (CUSTOMER_SEGMENT_LABELS[target.bucket] ?? target.bucket)
        : "";

  const description = `Kỳ ${startDate} → ${endDate}`;

  const variantQuery = useQuery({
    queryKey: ["report-drilldown", "variant-customers", target, startDate, endDate],
    queryFn: () =>
      target?.kind === "variant"
        ? customersReportClient.getVariantCustomers({
            variantId: (target as VariantTarget).variantId,
            startDate,
            endDate,
            limit: 100,
          })
        : Promise.resolve(null),
    enabled: open && target?.kind === "variant",
  });

  const bucketQuery = useQuery({
    queryKey: ["report-drilldown", "bucket-customers", target, startDate, endDate],
    queryFn: () =>
      target?.kind === "bucket"
        ? customersReportClient.getBucketCustomers({
            bucket: (target as BucketTarget).bucket,
            startDate,
            endDate,
            limit: 100,
          })
        : Promise.resolve(null),
    enabled: open && target?.kind === "bucket",
  });

  const isLoading =
    (target?.kind === "variant" && variantQuery.isLoading) ||
    (target?.kind === "bucket" && bucketQuery.isLoading);

  // Normalise both drilldown shapes into a common display row
  type DisplayRow = {
    customerId: string;
    fullName: string;
    phone: string | null;
    customerCode: string | null;
    col3Label: string;
    col3Value: string | number;
    revenue: number;
  };

  let rows: DisplayRow[] = [];

  if (target?.kind === "variant" && variantQuery.data) {
    rows = variantQuery.data.data.map((r) => ({
      customerId: r.customerId,
      fullName: r.fullName,
      phone: r.phone,
      customerCode: r.customerCode,
      col3Label: "SL mua",
      col3Value: r.totalQty,
      revenue: r.totalSpend,
    }));
  } else if (target?.kind === "bucket" && bucketQuery.data) {
    rows = bucketQuery.data.data.map((r) => ({
      customerId: r.customerId,
      fullName: r.fullName,
      phone: r.phone,
      customerCode: r.customerCode,
      col3Label: "Số đơn",
      col3Value: r.orderCount,
      revenue: r.revenue,
    }));
  }

  const col3Header = rows[0]?.col3Label ?? (target?.kind === "variant" ? "SL mua" : "Số đơn");

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-4 sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto pr-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-black tracking-widest uppercase">
                  Khách hàng
                </TableHead>
                <TableHead className="text-xs font-black tracking-widest uppercase">SĐT</TableHead>
                <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                  {col3Header}
                </TableHead>
                <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                  Doanh thu
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableLoadingRows rows={6} cols={4} />
              ) : rows.length === 0 ? (
                <TableEmptyRow cols={4} message="Không có dữ liệu." />
              ) : (
                rows.map((r) => (
                  <TableRow key={r.customerId} className="group">
                    <TableCell>
                      <Link
                        href={ADMIN_ROUTES.CUSTOMER_DETAIL(r.customerId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                      >
                        {r.fullName}
                        <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-70" />
                      </Link>
                      {r.customerCode && (
                        <p className="text-xs text-muted-foreground">{r.customerCode}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      {r.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums font-semibold">
                      {r.col3Value}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums font-bold">
                      {formatCurrency(r.revenue)}
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
