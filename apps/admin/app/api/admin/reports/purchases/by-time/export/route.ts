import { getPurchasesByTimeReport } from "@workspace/database/services/report-purchases.server";
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

  try {
    const report = await getPurchasesByTimeReport({
      startDate: range.startDate,
      endDate: range.endDate,
      groupBy,
    });

    const rows = report.rows.map((r) => ({
      Kỳ: r.period,
      "Số phiếu": r.receiptCount,
      "Số lượng": r.totalQty,
      "Giá trị nhập": fmtVnd(r.payableAmount),
      "Đã trả": fmtVnd(r.paidAmount),
      "Còn nợ": fmtVnd(r.debtAmount),
    }));

    const filename = `nhap-hang-theo-thoi-gian-${searchParams.get("startDate")}-${searchParams.get("endDate")}`;

    if (format === "xlsx") {
      return xlsxResponse(
        [{ name: "Nhập hàng theo thời gian", rows, columnWidths: [14, 10, 10, 18, 18, 18] }],
        `${filename}.xlsx`,
      );
    }

    return csvResponse(rows, `${filename}.csv`);
  } catch (error) {
    console.error("Failed to export purchases by-time report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
