import { getCustomerAggregate } from "@workspace/database/services/report-customers.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { csvResponse } from "@/lib/csv-export";
import { parseDateRange } from "@/lib/date-range";
import { fmtDate, fmtVnd } from "@/lib/report-formatters";
import { xlsxResponse } from "@/lib/xlsx-export";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const range = parseDateRange(searchParams);
  if (!range.ok) return range.response;

  const format = (searchParams.get("format") ?? "csv").toLowerCase();
  const search = searchParams.get("search") ?? undefined;

  try {
    const report = await getCustomerAggregate({
      startDate: range.startDate,
      endDate: range.endDate,
      sortBy: "order_count",
      search,
      page: 1,
      limit: 1000,
    });

    const rows = report.data.map((r) => ({
      "Khách hàng": r.fullName,
      "Mã KH": r.customerCode ?? "",
      SĐT: r.phone ?? "",
      "Số đơn": r.orderCount,
      "Doanh thu": fmtVnd(r.revenue),
      AOV: fmtVnd(r.aov),
      "Lần mua gần nhất": fmtDate(r.lastOrderAt),
    }));

    const filenameBase = `top-kh-so-don-${searchParams.get("startDate")}-${searchParams.get("endDate")}`;

    if (format === "csv") {
      return csvResponse(rows, `${filenameBase}.csv`);
    }

    if (format === "xlsx") {
      return xlsxResponse(
        [{ name: "Top KH số đơn", rows, columnWidths: [25, 14, 14, 10, 16, 16, 16] }],
        `${filenameBase}.xlsx`,
      );
    }

    return NextResponse.json(
      { error: `Unsupported format: ${format}` },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  } catch (error) {
    console.error("Failed to export top-by-orders report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
