"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { ArrowLeft, RefreshCw, TrendingUp, UserCheck, UserPlus, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import {
  type CustomerDrilldownTarget,
  ReportDrilldownCustomersSheet,
} from "@/components/admin/reports/report-drilldown-customers-sheet";
import { ReportExportMenu } from "@/components/admin/reports/report-export-menu";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
import { CUSTOMER_SEGMENT_LABELS } from "@/lib/report-customers-labels";
import {
  buildCustomerExportUrl,
  customersReportClient,
  type SegmentBucket,
  type SegmentBucketRow,
} from "@/services/reports-customers.client";

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}
function getThisMonthRange(): DateRange {
  const now = new Date();
  return {
    startDate: toISO(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate: toISO(now),
  };
}

export default function NewVsReturningContent() {
  const [range, setRange] = useState<DateRange>(getThisMonthRange());
  const [drilldown, setDrilldown] = useState<CustomerDrilldownTarget | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "customers", "new-vs-returning", range],
    queryFn: () =>
      customersReportClient.getNewVsReturning({
        startDate: range.startDate,
        endDate: range.endDate,
      }),
  });

  const bucketRows = data?.data ?? [];
  const summary = data?.summary;

  const statItems: MetricStatItem[] | null = summary
    ? [
        {
          label: "Khách mới",
          value: (
            <span className="text-blue-600">{summary.newCustomers.toLocaleString("vi-VN")}</span>
          ),
          icon: <UserPlus className="h-3.5 w-3.5" />,
          iconClassName: "bg-blue-500/10 text-blue-500",
        },
        {
          label: "Khách quay lại",
          value: summary.returningCustomers.toLocaleString("vi-VN"),
          icon: <RefreshCw className="h-3.5 w-3.5" />,
          iconClassName: "bg-emerald-500/10 text-emerald-500",
        },
        {
          label: "Tỷ lệ KH mới",
          value: `${summary.newRate.toFixed(1)}%`,
          icon: <TrendingUp className="h-3.5 w-3.5" />,
          iconClassName: "bg-orange-500/10 text-orange-500",
        },
        {
          label: "DT KH quay lại",
          value: formatCurrency(summary.returningRevenue),
          icon: <Wallet className="h-3.5 w-3.5" />,
          iconClassName: "bg-purple-500/10 text-purple-500",
        },
      ]
    : null;

  function openDrilldown(row: SegmentBucketRow) {
    setDrilldown({ kind: "bucket", bucket: row.bucket as SegmentBucket });
  }

  function getExportUrl(format: "csv" | "csv-detail" | "xlsx") {
    return buildCustomerExportUrl("new-vs-returning", {
      ...range,
      format: format === "csv-detail" ? "csv" : format,
    });
  }

  const totalCustomers = summary?.totalCustomers ?? 0;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link
              href={ADMIN_ROUTES.REPORTS}
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Báo cáo
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">Khách mới vs quay lại</span>
          </nav>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Khách mới vs quay lại</h1>
        </div>
        <ReportExportMenu
          getExportUrl={getExportUrl}
          onPrint={() => window.print()}
          disabled={isLoading}
        />
      </div>

      <FinanceRangePicker value={range} onChange={setRange} />

      {statItems && <MetricStatBar items={statItems} />}

      {/* Pie chart: new vs returning */}
      {summary && summary.totalCustomers > 0 && (
        <Card className="border-none shadow-sm p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
            Tỷ lệ khách mới / quay lại
          </p>
          <div className="flex items-center gap-6">
            {(() => {
              const newPct = Math.round((summary.newCustomers / summary.totalCustomers) * 100);
              const retPct = 100 - newPct;
              const donutBg =
                newPct > 0 && retPct > 0
                  ? `conic-gradient(#3B82F6 0% ${newPct}%, #10B981 ${newPct}% 100%)`
                  : newPct === 100
                    ? "conic-gradient(#3B82F6 0% 100%)"
                    : "conic-gradient(#10B981 0% 100%)";
              return (
                <>
                  <div
                    className="relative shrink-0 rounded-full"
                    style={{ width: 96, height: 96, background: donutBg }}
                  >
                    <div className="absolute inset-5 rounded-full bg-card" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-3 w-3 rounded-sm bg-blue-500 inline-block" />
                      <span className="text-muted-foreground">Khách mới</span>
                      <span className="font-bold tabular-nums ml-1">{newPct}%</span>
                      <span className="text-muted-foreground tabular-nums">
                        ({summary.newCustomers.toLocaleString("vi-VN")})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-3 w-3 rounded-sm bg-emerald-500 inline-block" />
                      <span className="text-muted-foreground">Khách quay lại</span>
                      <span className="font-bold tabular-nums ml-1">{retPct}%</span>
                      <span className="text-muted-foreground tabular-nums">
                        ({summary.returningCustomers.toLocaleString("vi-VN")})
                      </span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </Card>
      )}

      {/* Segment summary table */}
      <Card className="overflow-hidden border-none shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                Phân khúc
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Số KH
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Số đơn
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Doanh thu
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                AOV
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                % KH
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows rows={2} cols={6} />
            ) : bucketRows.length === 0 ? (
              <TableEmptyRow cols={6} message="Không có dữ liệu trong kỳ này." />
            ) : (
              bucketRows.map((r) => (
                <TableRow
                  key={r.bucket}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openDrilldown(r)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {r.bucket === "new" ? (
                        <UserPlus className="h-4 w-4 text-blue-500" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-emerald-500" />
                      )}
                      <span className="font-semibold">
                        {CUSTOMER_SEGMENT_LABELS[r.bucket] ?? r.bucket}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-bold">
                    {r.customers.toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-semibold">
                    {r.orders.toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-semibold">
                    {formatCurrency(r.revenue)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {formatCurrency(r.aov)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {totalCustomers > 0
                      ? `${((r.customers / totalCustomers) * 100).toFixed(1)}%`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Time-series breakdown */}
      {data && data.timeSeries.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black tracking-widest uppercase text-muted-foreground">
              Xu hướng theo ngày
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-black tracking-widest uppercase">
                    Ngày
                  </TableHead>
                  <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                    KH mới
                  </TableHead>
                  <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                    KH quay lại
                  </TableHead>
                  <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                    Tổng
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.timeSeries.map((ts) => (
                  <TableRow key={ts.period}>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      {ts.period}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums font-semibold text-blue-600">
                      {ts.newCustomers}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums font-semibold text-emerald-600">
                      {ts.returningCustomers}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums font-bold">
                      {ts.newCustomers + ts.returningCustomers}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ReportDrilldownCustomersSheet
        target={drilldown}
        startDate={range.startDate}
        endDate={range.endDate}
        onClose={() => setDrilldown(null)}
      />
    </div>
  );
}
