import { getPurchasesByStaffReport } from "@workspace/database/services/report-purchases.server";
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
    const report = await getPurchasesByStaffReport({
      startDate: range.startDate,
      endDate: range.endDate,
      search: searchParams.get("search") ?? undefined,
      limit: 200,
    });

    const rows = report.data.map((r) => ({
      "Nhân viên": r.staffName,
      "Số phiếu": r.receiptCount,
      "Số lượng": r.totalQty,
      "Giá trị nhập": fmtVnd(r.payableAmount),
      "Đã trả": fmtVnd(r.paidAmount),
      "Còn nợ": fmtVnd(r.debtAmount),
      "TB/phiếu": fmtVnd(r.avgPerReceipt),
    }));

    const filename = `nhap-hang-theo-nhan-vien-${searchParams.get("startDate")}-${searchParams.get("endDate")}`;

    if (format === "xlsx") {
      return xlsxResponse(
        [{ name: "Nhập hàng theo NV", rows, columnWidths: [24, 10, 10, 18, 18, 18, 16] }],
        `${filename}.xlsx`,
      );
    }

    return csvResponse(rows, `${filename}.csv`);
  } catch (error) {
    console.error("Failed to export purchases by-staff report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
