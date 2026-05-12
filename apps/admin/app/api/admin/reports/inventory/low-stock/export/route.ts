import { getLowStockReport } from "@workspace/database/services/report-inventory.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { csvResponse } from "@/lib/csv-export";
import { fmtVnd } from "@/lib/report-formatters";
import { getStockStatusLabel } from "@/lib/report-inventory-labels";
import { xlsxResponse } from "@/lib/xlsx-export";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "csv").toLowerCase();

  try {
    const report = await getLowStockReport({
      search: searchParams.get("search") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      status: (searchParams.get("status") as "all" | "low" | "out") ?? "all",
      page: 1,
      limit: 5000,
    });

    const rows = report.data.map((r) => ({
      SKU: r.sku,
      "Sản phẩm": r.productName,
      "Biến thể": r.variantName,
      "Danh mục": r.categoryName ?? "",
      "Tồn kho": r.onHand,
      "Ngưỡng cảnh báo": r.lowStockThreshold,
      "WAC (₫)": fmtVnd(r.costPrice),
      "Trạng thái": getStockStatusLabel(r.status),
    }));

    const filenameBase = "canh-bao-het-hang";

    if (format === "csv") {
      return csvResponse(rows, `${filenameBase}.csv`);
    }

    if (format === "xlsx") {
      return xlsxResponse(
        [{ name: "Cảnh báo hết hàng", rows, columnWidths: [14, 24, 20, 16, 10, 14, 16, 14] }],
        `${filenameBase}.xlsx`,
      );
    }

    return NextResponse.json(
      { error: `Unsupported format: ${format}` },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  } catch (error) {
    console.error("Failed to export low stock report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
