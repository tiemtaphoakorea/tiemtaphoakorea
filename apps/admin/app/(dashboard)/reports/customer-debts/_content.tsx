"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Card } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { PaginationControls } from "@workspace/ui/components/pagination-controls";
import { Switch } from "@workspace/ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import { DebtTransactionsSheet } from "@/components/admin/reports/debt-transactions-sheet";
import { ReportExportMenu } from "@/components/admin/reports/report-export-menu";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { buildExportUrl, type CustomerDebtRow, reportsClient } from "@/services/reports.client";

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

export default function CustomerDebtsContent() {
  const [range, setRange] = useState<DateRange>(getThisMonthRange());
  const [search, setSearch] = useState("");
  const [includeZero, setIncludeZero] = useState(false);
  const [page, setPage] = useState(1);
  const [drilldown, setDrilldown] = useState<{
    customerId: string;
    customerName: string;
    focus: "increase" | "decrease";
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "customer-debts", range, search, includeZero, page],
    queryFn: () =>
      reportsClient.getCustomerDebts({
        startDate: range.startDate,
        endDate: range.endDate,
        search,
        includeZero,
        page,
        limit: 20,
      }),
  });

  const rows = data?.data ?? [];
  const summary = data?.summary;

  function getExportUrl(format: "csv" | "csv-detail" | "xlsx") {
    return buildExportUrl("customer-debts", {
      ...range,
      format,
      search,
      includeZero,
    });
  }

  function openDrilldown(row: CustomerDebtRow, focus: "increase" | "decrease") {
    setDrilldown({
      customerId: row.customerId,
      customerName: row.customerName ?? row.customerCode ?? "Khách hàng",
      focus,
    });
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link
            href={ADMIN_ROUTES.REPORTS}
            className="text-xs text-muted-foreground hover:underline"
          >
            ← Báo cáo tài chính
          </Link>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Công nợ khách hàng</h1>
        </div>
        <ReportExportMenu
          getExportUrl={getExportUrl}
          onPrint={() => window.print()}
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <FinanceRangePicker
          value={range}
          onChange={(r) => {
            setRange(r);
            setPage(1);
          }}
        />
        <div className="relative">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="h-8 w-56 pl-8 text-xs"
            placeholder="Mã / tên / SĐT khách"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Switch checked={includeZero} onCheckedChange={setIncludeZero} />
          <span className="font-semibold">Hiện KH có nợ = 0</span>
        </label>
      </div>

      <Card className="overflow-hidden border-none shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                Khách hàng
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Nợ đầu kỳ
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Nợ tăng
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Nợ giảm
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Nợ cuối kỳ
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows cols={5} rows={6} />
            ) : rows.length === 0 ? (
              <TableEmptyRow cols={5} message="Không có công nợ trong khoảng này." />
            ) : (
              rows.map((r) => (
                <TableRow key={r.customerId}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{r.customerName ?? "—"}</span>
                      <span className="text-xs text-muted-foreground">
                        {[r.customerCode, r.customerPhone].filter(Boolean).join(" • ")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatCurrency(r.openingDebt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() => openDrilldown(r, "increase")}
                      disabled={r.debtIncrease === 0}
                      className="text-sm font-bold tabular-nums text-red-500 hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
                    >
                      {formatCurrency(r.debtIncrease)}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() => openDrilldown(r, "decrease")}
                      disabled={r.debtDecrease === 0}
                      className="text-sm font-bold tabular-nums text-emerald-600 hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
                    >
                      {formatCurrency(r.debtDecrease)}
                    </button>
                  </TableCell>
                  <TableCell
                    className={`text-right text-sm font-black tabular-nums ${r.closingDebt > 0 ? "text-red-500" : r.closingDebt < 0 ? "text-emerald-600" : ""}`}
                  >
                    {formatCurrency(r.closingDebt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {summary && rows.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="text-sm font-black uppercase">Tổng</TableCell>
                <TableCell className="text-right text-sm font-black tabular-nums">
                  {formatCurrency(summary.openingDebt)}
                </TableCell>
                <TableCell className="text-right text-sm font-black tabular-nums text-red-500">
                  {formatCurrency(summary.debtIncrease)}
                </TableCell>
                <TableCell className="text-right text-sm font-black tabular-nums text-emerald-600">
                  {formatCurrency(summary.debtDecrease)}
                </TableCell>
                <TableCell
                  className={`text-right text-sm font-black tabular-nums ${summary.closingDebt > 0 ? "text-red-500" : summary.closingDebt < 0 ? "text-emerald-600" : ""}`}
                >
                  {formatCurrency(summary.closingDebt)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </Card>

      {data && data.metadata.totalPages > 1 && (
        <PaginationControls
          currentPage={page}
          totalPages={data.metadata.totalPages}
          onPageChange={setPage}
        />
      )}

      <DebtTransactionsSheet
        target={
          drilldown
            ? { kind: "customer", id: drilldown.customerId, name: drilldown.customerName }
            : null
        }
        startDate={range.startDate}
        endDate={range.endDate}
        focus={drilldown?.focus}
        onClose={() => setDrilldown(null)}
      />
    </div>
  );
}
