import { getDailyStats } from "@workspace/database/services/finance.server";
import { getProfitLossReport } from "@workspace/database/services/report.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { csvResponse, csvSectionsResponse } from "@/lib/csv-export";
import { parseDateRange } from "@/lib/date-range";
import { fmtVnd, formatPnlMetricValue, PNL_METRIC_LABELS } from "@/lib/report-formatters";
import { xlsxResponse } from "@/lib/xlsx-export";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const range = parseDateRange(searchParams);
  if (!range.ok) return range.response;

  const format = (searchParams.get("format") ?? "csv").toLowerCase();
  const compare = searchParams.get("compare") !== "0";

  try {
    const report = await getProfitLossReport({
      startDate: range.startDate,
      endDate: range.endDate,
      compare,
    });

    const summaryRows = Object.entries(PNL_METRIC_LABELS).map(([key, label]) => {
      const cur = (report.current as unknown as Record<string, number>)[key] ?? 0;
      const prev = report.previous
        ? ((report.previous as unknown as Record<string, number>)[key] ?? 0)
        : null;
      const delta = report.delta?.[key as keyof typeof report.delta] ?? null;
      return {
        "Chỉ số": label,
        "Kỳ trước": prev !== null ? formatPnlMetricValue(key, prev) : "—",
        "Kỳ hiện tại": formatPnlMetricValue(key, cur),
        "% thay đổi": delta !== null ? `${delta.toFixed(1)}%` : "—",
      };
    });

    const filenameBase = `bao-cao-lai-lo-${searchParams.get("startDate")}-${searchParams.get("endDate")}`;

    if (format === "csv") {
      return csvResponse(summaryRows, `${filenameBase}.csv`);
    }

    if (format === "csv-detail" || format === "xlsx") {
      const daily = await getDailyStats(range.startDate, range.endDate);
      const dailyRows = daily.dailyData.map((d) => ({
        Ngày: d.date,
        "Doanh thu": fmtVnd(d.revenue),
        "Giá vốn": fmtVnd(d.cogs),
        "Lợi nhuận gộp": fmtVnd(d.grossProfit),
        "Số đơn": d.orderCount,
      }));

      if (format === "csv-detail") {
        return csvSectionsResponse(
          [
            { title: "Tổng quan", rows: summaryRows },
            { title: "Chi tiết theo ngày", rows: dailyRows },
          ],
          `${filenameBase}-chi-tiet.csv`,
        );
      }

      // xlsx
      return xlsxResponse(
        [
          {
            name: "Tổng quan",
            rows: summaryRows,
            columnWidths: [28, 18, 18, 14],
          },
          {
            name: "Chi tiết theo ngày",
            rows: dailyRows,
            columnWidths: [14, 18, 18, 18, 10],
          },
        ],
        `${filenameBase}.xlsx`,
      );
    }

    return NextResponse.json(
      { error: `Unsupported format: ${format}` },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  } catch (error) {
    console.error("Failed to export P&L report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
