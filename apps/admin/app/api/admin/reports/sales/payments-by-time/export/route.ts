import { getPaymentsByTimeReport } from "@workspace/database/services/report-sales.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { csvResponse } from "@/lib/csv-export";
import { parseDateRange } from "@/lib/date-range";
import { fmtVnd } from "@/lib/report-formatters";
import { xlsxResponse } from "@/lib/xlsx-export";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const range = parseDateRange(searchParams);
  if (!range.ok) return range.response;

  const format = (searchParams.get("format") ?? "csv").toLowerCase();
  const groupBy = (searchParams.get("groupBy") ?? "day") as "day" | "week" | "month";
  const compare = searchParams.get("compare") === "1";

  try {
    const report = await getPaymentsByTimeReport({
      startDate: range.startDate,
      endDate: range.endDate,
      groupBy,
      compare,
    });

    const rows = report.data.map((r) => ({
      Kỳ: r.period,
      "Số GD": r.txCount,
      "Tiền mặt": fmtVnd(r.cashTotal),
      "Chuyển khoản": fmtVnd(r.bankTotal),
      Thẻ: fmtVnd(r.cardTotal),
      "Tổng thu": fmtVnd(r.total),
    }));

    const filename = `thu-tien-theo-thoi-gian-${searchParams.get("startDate")}-${searchParams.get("endDate")}`;

    if (format === "csv") return csvResponse(rows, `${filename}.csv`);
    if (format === "xlsx") {
      return xlsxResponse(
        [{ name: "Thu tiền theo thời gian", rows, columnWidths: [14, 8, 18, 18, 18, 18] }],
        `${filename}.xlsx`,
      );
    }
    return NextResponse.json(
      { error: `Unsupported format: ${format}` },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  } catch (error) {
    console.error("Failed to export payments-by-time report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
