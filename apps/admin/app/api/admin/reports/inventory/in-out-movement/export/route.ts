import { getInOutMovementReport } from "@workspace/database/services/report-inventory.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { csvResponse } from "@/lib/csv-export";
import { parseDateRange } from "@/lib/date-range";
import { xlsxResponse } from "@/lib/xlsx-export";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const range = parseDateRange(searchParams);
  if (!range.ok) return range.response;

  const format = (searchParams.get("format") ?? "csv").toLowerCase();

  try {
    const report = await getInOutMovementReport({
      startDate: range.startDate,
      endDate: range.endDate,
      search: searchParams.get("search") ?? undefined,
      typeFilter: (searchParams.get("typeFilter") as "in" | "out" | "adjust" | "all") ?? "all",
      page: 1,
      limit: 5000,
    });

    const rows = report.data.map((r) => ({
      SKU: r.sku,
      "Sản phẩm": r.productName,
      "Biến thể": r.variantName,
      "Tồn đầu kỳ": r.opening,
      Nhập: r.qtyIn,
      Xuất: r.qtyOut,
      "Điều chỉnh": r.qtyAdjust,
      "Tồn cuối kỳ": r.closing,
    }));

    const start = searchParams.get("startDate") ?? "";
    const end = searchParams.get("endDate") ?? "";
    const filenameBase = `xuat-nhap-ton-${start}-${end}`;

    if (format === "csv") {
      return csvResponse(rows, `${filenameBase}.csv`);
    }

    if (format === "xlsx") {
      return xlsxResponse(
        [{ name: "Xuất nhập tồn", rows, columnWidths: [14, 24, 20, 12, 10, 10, 12, 12] }],
        `${filenameBase}.xlsx`,
      );
    }

    return NextResponse.json(
      { error: `Unsupported format: ${format}` },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  } catch (error) {
    console.error("Failed to export in-out-movement report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
