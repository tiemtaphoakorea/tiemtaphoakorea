import { getNewVsReturningReport } from "@workspace/database/services/report-customers.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { csvResponse } from "@/lib/csv-export";
import { parseDateRange } from "@/lib/date-range";
import { fmtVnd } from "@/lib/report-formatters";
import { xlsxResponse } from "@/lib/xlsx-export";

const BUCKET_LABEL: Record<string, string> = {
  new: "Khách mới",
  returning: "Khách quay lại",
};

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const range = parseDateRange(searchParams);
  if (!range.ok) return range.response;

  const format = (searchParams.get("format") ?? "csv").toLowerCase();

  try {
    const report = await getNewVsReturningReport({
      startDate: range.startDate,
      endDate: range.endDate,
    });

    const totalCustomers = report.summary.totalCustomers;

    const rows = report.data.map((r) => ({
      "Phân khúc": BUCKET_LABEL[r.bucket] ?? r.bucket,
      "Số KH": r.customers,
      "Số đơn": r.orders,
      "Doanh thu": fmtVnd(r.revenue),
      AOV: fmtVnd(r.aov),
      "% tổng KH":
        totalCustomers > 0 ? `${((r.customers / totalCustomers) * 100).toFixed(1)}%` : "0.0%",
    }));

    const filenameBase = `kh-moi-quay-lai-${searchParams.get("startDate")}-${searchParams.get("endDate")}`;

    if (format === "csv") {
      return csvResponse(rows, `${filenameBase}.csv`);
    }

    if (format === "xlsx") {
      return xlsxResponse(
        [{ name: "KH mới vs quay lại", rows, columnWidths: [18, 10, 10, 16, 16, 12] }],
        `${filenameBase}.xlsx`,
      );
    }

    return NextResponse.json(
      { error: `Unsupported format: ${format}` },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  } catch (error) {
    console.error("Failed to export new-vs-returning report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
