import { getPaymentsByMethodReport } from "@workspace/database/services/report-sales.server";
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

  try {
    const report = await getPaymentsByMethodReport({
      startDate: range.startDate,
      endDate: range.endDate,
    });

    const rows = report.data.map((r) => ({
      "Phương thức": r.method,
      "Số GD": r.txCount,
      "Tổng tiền": fmtVnd(r.total),
      "% Tổng": `${r.pct.toFixed(1)}%`,
      "TB/GD": fmtVnd(r.avgPerTx),
    }));

    const filename = `thu-tien-theo-phuong-thuc-${searchParams.get("startDate")}-${searchParams.get("endDate")}`;

    if (format === "csv") return csvResponse(rows, `${filename}.csv`);
    if (format === "xlsx") {
      return xlsxResponse(
        [{ name: "Thu tiền theo phương thức", rows, columnWidths: [20, 8, 18, 10, 18] }],
        `${filename}.xlsx`,
      );
    }
    return NextResponse.json(
      { error: `Unsupported format: ${format}` },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  } catch (error) {
    console.error("Failed to export payments-by-method report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
