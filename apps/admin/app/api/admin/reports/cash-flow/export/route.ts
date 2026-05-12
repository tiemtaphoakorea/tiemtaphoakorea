import {
  getCashFlowReport,
  getCashFlowTransactions,
} from "@workspace/database/services/report.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { type CsvSection, csvResponse, csvSectionsResponse } from "@/lib/csv-export";
import { parseDateRange } from "@/lib/date-range";
import { fmtDateTime, fmtVnd } from "@/lib/report-formatters";
import { type XlsxSheet, xlsxResponse } from "@/lib/xlsx-export";

const KIND_LABEL: Record<string, string> = {
  "customer-payment": "Thu từ khách (vào)",
  "supplier-payment": "Chi NCC (ra)",
  expense: "Chi phí (ra)",
};

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const range = parseDateRange(searchParams);
  if (!range.ok) return range.response;

  const format = (searchParams.get("format") ?? "csv").toLowerCase();
  const groupByRaw = (searchParams.get("groupBy") ?? "day").toLowerCase();
  const groupBy: "day" | "week" | "month" =
    groupByRaw === "week" || groupByRaw === "month" ? groupByRaw : "day";

  try {
    const report = await getCashFlowReport({
      startDate: range.startDate,
      endDate: range.endDate,
      groupBy,
    });

    const summaryRows = report.byPeriod.map((p) => ({
      Kỳ: p.period,
      "Tiền vào": fmtVnd(p.inflow),
      "Tiền ra": fmtVnd(p.outflow),
      "Chênh lệch": fmtVnd(p.net),
    }));

    const totalsRow = {
      Kỳ: "TỔNG",
      "Tiền vào": fmtVnd(report.totalInflow),
      "Tiền ra": fmtVnd(report.totalOutflow),
      "Chênh lệch": fmtVnd(report.netCashFlow),
    };

    const filenameBase = `bao-cao-dong-tien-${searchParams.get("startDate")}-${searchParams.get("endDate")}`;

    if (format === "csv") {
      return csvResponse([...summaryRows, totalsRow], `${filenameBase}.csv`);
    }

    if (format === "csv-detail" || format === "xlsx") {
      const transactions = await getCashFlowTransactions({
        startDate: range.startDate,
        endDate: range.endDate,
      });

      const detailRows = transactions.map((t) => ({
        Ngày: fmtDateTime(t.date),
        "Loại GD": KIND_LABEL[t.kind] ?? t.kind,
        "Mã CT": t.reference,
        "Đối tác": t.party ?? "",
        "Số tiền": fmtVnd(t.amount),
        "Ghi chú": t.note ?? "",
      }));

      if (format === "csv-detail") {
        const sections: CsvSection[] = [
          { title: "Tổng quan dòng tiền", rows: [...summaryRows, totalsRow] },
          { title: "Chi tiết giao dịch", rows: detailRows },
        ];
        return csvSectionsResponse(sections, `${filenameBase}-chi-tiet.csv`);
      }

      const sheets: XlsxSheet[] = [
        {
          name: "Tổng quan",
          rows: [...summaryRows, totalsRow],
          columnWidths: [14, 18, 18, 18],
        },
        {
          name: "Chi tiết",
          rows: detailRows,
          columnWidths: [20, 22, 18, 24, 18, 30],
        },
      ];
      return xlsxResponse(sheets, `${filenameBase}.xlsx`);
    }

    return NextResponse.json(
      { error: `Unsupported format: ${format}` },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  } catch (error) {
    console.error("Failed to export cash flow:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
