import {
  getCategoryStockBreakdown,
  getCurrentStockReport,
} from "@workspace/database/services/report-inventory.server";
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
    const [report, categories] = await Promise.all([
      getCurrentStockReport({
        search: searchParams.get("search") ?? undefined,
        categoryId: searchParams.get("categoryId") ?? undefined,
        stockStatus:
          (searchParams.get("stockStatus") as "all" | "in-stock" | "out-of-stock" | "low") ?? "all",
        sortBy: (searchParams.get("sortBy") as "value" | "qty") ?? "value",
        sortDir: (searchParams.get("sortDir") as "asc" | "desc") ?? "desc",
        page: 1,
        limit: 5000,
      }),
      getCategoryStockBreakdown(),
    ]);

    const mainRows = report.data.map((r) => ({
      SKU: r.sku,
      "Sản phẩm": r.productName,
      "Biến thể": r.variantName,
      "Danh mục": r.categoryName ?? "",
      "Tồn kho": r.onHand,
      "Giữ chỗ": r.reserved,
      "Có thể bán": r.available,
      "WAC (₫)": fmtVnd(r.costPrice),
      "Giá trị kho (₫)": fmtVnd(r.stockValue),
      "Ngưỡng cảnh báo": r.lowStockThreshold,
      "Trạng thái": getStockStatusLabel(r.stockStatus),
    }));

    const filename = "ton-kho-hien-tai";

    if (format === "csv") {
      return csvResponse(mainRows, `${filename}.csv`);
    }

    if (format === "xlsx") {
      const catRows = categories.map((c) => ({
        "Danh mục": c.categoryName,
        "Số SKU": c.skuCount,
        "Tổng SL": c.totalUnits,
        "Giá trị (₫)": fmtVnd(c.totalValue),
        "% Tổng": `${c.pctOfTotal.toFixed(1)}%`,
      }));
      return xlsxResponse(
        [
          {
            name: "Tồn kho",
            rows: mainRows,
            columnWidths: [14, 24, 20, 16, 10, 10, 12, 16, 18, 14, 12],
          },
          { name: "Theo danh mục", rows: catRows, columnWidths: [24, 10, 10, 16, 10] },
        ],
        `${filename}.xlsx`,
      );
    }

    return NextResponse.json(
      { error: `Unsupported format: ${format}` },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  } catch (error) {
    console.error("Failed to export current stock report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
