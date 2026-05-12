import {
  getSupplierDebtsReport,
  getSupplierDebtTransactions,
} from "@workspace/database/services/report.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { type CsvSection, csvResponse, csvSectionsResponse } from "@/lib/csv-export";
import { parseDateRange } from "@/lib/date-range";
import { fmtDateTime, fmtVnd } from "@/lib/report-formatters";
import { type XlsxSheet, xlsxResponse } from "@/lib/xlsx-export";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const range = parseDateRange(searchParams);
  if (!range.ok) return range.response;

  const format = (searchParams.get("format") ?? "csv").toLowerCase();
  const search = searchParams.get("search") ?? "";
  const includeZero = searchParams.get("includeZero") === "1";

  try {
    const report = await getSupplierDebtsReport({
      startDate: range.startDate,
      endDate: range.endDate,
      search,
      includeZero,
      page: 1,
      limit: 10000,
    });

    const summaryRows = report.data.map((r) => ({
      "Mã NCC": r.supplierCode ?? "",
      "Tên NCC": r.supplierName ?? "",
      SĐT: r.supplierPhone ?? "",
      "Nợ đầu kỳ": fmtVnd(r.openingDebt),
      "Nợ tăng": fmtVnd(r.debtIncrease),
      "Nợ giảm": fmtVnd(r.debtDecrease),
      "Nợ cuối kỳ": fmtVnd(r.closingDebt),
    }));

    const filenameBase = `bao-cao-cong-no-ncc-${searchParams.get("startDate")}-${searchParams.get("endDate")}`;

    if (format === "csv") {
      return csvResponse(summaryRows, `${filenameBase}.csv`);
    }

    if (format === "csv-detail" || format === "xlsx") {
      const top = report.data.slice(0, 200);
      const allTxs = await Promise.all(
        top.map(async (r) => {
          const tx = await getSupplierDebtTransactions({
            supplierId: r.supplierId,
            startDate: range.startDate,
            endDate: range.endDate,
          });
          return { row: r, tx };
        }),
      );

      const detailRows = allTxs.flatMap(({ row, tx }) => [
        ...tx.increases.map((t) => ({
          "Mã NCC": row.supplierCode ?? "",
          "Tên NCC": row.supplierName ?? "",
          Ngày: fmtDateTime(t.date),
          "Loại GD": "Phiếu nhập (tăng nợ)",
          "Mã CT": t.reference,
          "Số tiền": fmtVnd(t.amount),
          "Ghi chú": t.note ?? "",
        })),
        ...tx.decreases.map((t) => ({
          "Mã NCC": row.supplierCode ?? "",
          "Tên NCC": row.supplierName ?? "",
          Ngày: fmtDateTime(t.date),
          "Loại GD": "Phiếu chi (giảm nợ)",
          "Mã CT": t.reference,
          "Số tiền": fmtVnd(t.amount),
          "Ghi chú": t.note ?? "",
        })),
      ]);

      if (format === "csv-detail") {
        const sections: CsvSection[] = [
          { title: "Tổng quan công nợ NCC", rows: summaryRows },
          { title: "Chi tiết giao dịch", rows: detailRows },
        ];
        return csvSectionsResponse(sections, `${filenameBase}-chi-tiet.csv`);
      }

      const sheets: XlsxSheet[] = [
        { name: "Tổng quan", rows: summaryRows, columnWidths: [12, 24, 14, 16, 16, 16, 16] },
        {
          name: "Chi tiết",
          rows: detailRows,
          columnWidths: [12, 24, 18, 22, 14, 16, 30],
        },
      ];
      return xlsxResponse(sheets, `${filenameBase}.xlsx`);
    }

    return NextResponse.json(
      { error: `Unsupported format: ${format}` },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  } catch (error) {
    console.error("Failed to export supplier debts:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
