import { getCustomersByProduct } from "@workspace/database/services/report-customers.server";
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
  const sortBy = (searchParams.get("sortBy") ?? "customer_count") as
    | "customer_count"
    | "revenue"
    | "qty";

  try {
    const report = await getCustomersByProduct({
      startDate: range.startDate,
      endDate: range.endDate,
      search,
      sortBy,
      page: 1,
      limit: 1000,
    });

    const rows = report.data.map((r) => ({
      SKU: r.sku,
      "Sản phẩm": r.productName,
      "Biến thể": r.variantName,
      "Số KH": r.customerCount,
      "Số đơn": r.orderCount,
      "SL bán": r.qty,
      "Doanh thu": fmtVnd(r.revenue),
    }));

    const filenameBase = `kh-theo-san-pham-${searchParams.get("startDate")}-${searchParams.get("endDate")}`;

    if (format === "csv") {
      return csvResponse(rows, `${filenameBase}.csv`);
    }

    if (format === "xlsx") {
      return xlsxResponse(
        [{ name: "KH theo SP", rows, columnWidths: [16, 28, 20, 10, 10, 10, 16] }],
        `${filenameBase}.xlsx`,
      );
    }

    return NextResponse.json(
      { error: `Unsupported format: ${format}` },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  } catch (error) {
    console.error("Failed to export customers-by-product report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
