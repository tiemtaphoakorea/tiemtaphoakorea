import { getPurchasesByProductReport } from "@workspace/database/services/report-purchases.server";
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
    const report = await getPurchasesByProductReport({
      startDate: range.startDate,
      endDate: range.endDate,
      search: searchParams.get("search") ?? undefined,
      limit: 200,
    });

    const rows = report.data.map((r) => ({
      SKU: r.sku,
      "Sản phẩm": r.productName,
      "Biến thể": r.variantName,
      "SL nhập": r.totalQty,
      "Giá trị nhập": fmtVnd(r.lineTotal),
      "Giá TB nhập": fmtVnd(r.avgUnitCost),
      "Giá vốn hiện tại": fmtVnd(r.currentCostPrice),
    }));

    const filename = `nhap-hang-theo-san-pham-${searchParams.get("startDate")}-${searchParams.get("endDate")}`;

    if (format === "xlsx") {
      return xlsxResponse(
        [{ name: "Nhập hàng theo SP", rows, columnWidths: [14, 28, 20, 10, 18, 16, 18] }],
        `${filename}.xlsx`,
      );
    }

    return csvResponse(rows, `${filename}.csv`);
  } catch (error) {
    console.error("Failed to export purchases by-product report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
