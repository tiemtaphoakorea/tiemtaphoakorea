import { getLedgerReport } from "@workspace/database/services/report-inventory.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { csvResponse } from "@/lib/csv-export";
import { parseDateRange } from "@/lib/date-range";
import { fmtDateTime, fmtVnd } from "@/lib/report-formatters";
import { getMovementTypeLabel } from "@/lib/report-inventory-labels";
import { xlsxResponse } from "@/lib/xlsx-export";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const variantId = searchParams.get("variantId");

  if (!variantId) {
    return NextResponse.json(
      { error: "variantId is required" },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const range = parseDateRange(searchParams);
  if (!range.ok) return range.response;

  const format = (searchParams.get("format") ?? "csv").toLowerCase();

  try {
    const report = await getLedgerReport({
      variantId,
      startDate: range.startDate,
      endDate: range.endDate,
      typeFilter: (searchParams.get("typeFilter") as "in" | "out" | "adjust" | "all") ?? "all",
      page: 1,
      limit: 5000,
    });

    const rows = report.data.map((r) => ({
      "Ngày giờ": fmtDateTime(r.createdAt),
      "Loại GD": getMovementTypeLabel(r.type),
      "Số chứng từ": r.referenceId ?? "",
      "Ghi chú": r.note ?? "",
      Nhập: r.qtyIn || "",
      Xuất: r.qtyOut || "",
      "Tồn sau": r.onHandAfter,
      "WAC ước tính (₫)": fmtVnd(r.estimatedUnitCost),
      "Giá trị (₫)": fmtVnd(r.estimatedValue),
    }));

    const sku = report.sku.replace(/[^a-zA-Z0-9-]/g, "-");
    const start = searchParams.get("startDate") ?? "";
    const end = searchParams.get("endDate") ?? "";
    const filenameBase = `so-kho-${sku}-${start}-${end}`;

    if (format === "csv") {
      return csvResponse(rows, `${filenameBase}.csv`);
    }

    if (format === "xlsx") {
      return xlsxResponse(
        [{ name: "Sổ kho", rows, columnWidths: [18, 20, 32, 28, 8, 8, 10, 18, 16] }],
        `${filenameBase}.xlsx`,
      );
    }

    return NextResponse.json(
      { error: `Unsupported format: ${format}` },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  } catch (error) {
    console.error("Failed to export ledger report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
