import { getPayoutsByMethodReport } from "@workspace/database/services/report-purchases.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { csvResponse } from "@/lib/csv-export";
import { parseDateRange } from "@/lib/date-range";
import { fmtPercent, fmtVnd } from "@/lib/report-formatters";
import { xlsxResponse } from "@/lib/xlsx-export";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const range = parseDateRange(searchParams);
  if (!range.ok) return range.response;

  const format = (searchParams.get("format") ?? "csv").toLowerCase();

  try {
    const report = await getPayoutsByMethodReport({
      startDate: range.startDate,
      endDate: range.endDate,
    });

    const rows = report.rows.map((r) => ({
      "Phương thức": r.method,
      "Số giao dịch": r.txCount,
      "Tổng chi": fmtVnd(r.totalAmount),
      "Tỷ lệ": fmtPercent(r.pct),
      "TB/GD": fmtVnd(r.avgAmount),
    }));

    const filename = `chi-tra-ncc-theo-phuong-thuc-${searchParams.get("startDate")}-${searchParams.get("endDate")}`;

    if (format === "xlsx") {
      return xlsxResponse(
        [{ name: "Chi trả NCC theo PT", rows, columnWidths: [18, 12, 18, 10, 16] }],
        `${filename}.xlsx`,
      );
    }

    return csvResponse(rows, `${filename}.csv`);
  } catch (error) {
    console.error("Failed to export payouts by-method report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
