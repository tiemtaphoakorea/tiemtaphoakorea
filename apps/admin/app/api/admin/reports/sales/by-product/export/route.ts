import { getSalesByProductReport } from "@workspace/database/services/report-sales.server";
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
  const search = searchParams.get("search") ?? undefined;

  try {
    const report = await getSalesByProductReport({
      startDate: range.startDate,
      endDate: range.endDate,
      search,
      page: 1,
      limit: 2000,
    });

    const rows = report.data.map((r) => ({
      SKU: r.sku,
      "Sản phẩm": r.productName,
      "Biến thể": r.variantName,
      "SL bán": r.qty,
      "Doanh thu": fmtVnd(r.revenue),
      "Giá vốn": fmtVnd(r.cogs),
      "Lợi nhuận": fmtVnd(r.profit),
      "% LN": `${r.profitPct.toFixed(1)}%`,
    }));

    const filename = `doanh-thu-theo-san-pham-${searchParams.get("startDate")}-${searchParams.get("endDate")}`;

    if (format === "csv") return csvResponse(rows, `${filename}.csv`);
    if (format === "xlsx") {
      return xlsxResponse(
        [{ name: "Doanh thu theo sản phẩm", rows, columnWidths: [14, 30, 20, 8, 18, 18, 18, 8] }],
        `${filename}.xlsx`,
      );
    }
    return NextResponse.json(
      { error: `Unsupported format: ${format}` },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  } catch (error) {
    console.error("Failed to export sales by-product report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
