import { getSalesByOrderReport } from "@workspace/database/services/report-sales.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { csvResponse } from "@/lib/csv-export";
import { parseDateRange } from "@/lib/date-range";
import { fmtDateTime, fmtVnd } from "@/lib/report-formatters";
import { xlsxResponse } from "@/lib/xlsx-export";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Chưa thanh toán",
  partial: "Thanh toán một phần",
  paid: "Đã thanh toán",
};

const FULFILLMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xử lý",
  stock_out: "Đã xuất kho",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const range = parseDateRange(searchParams);
  if (!range.ok) return range.response;

  const format = (searchParams.get("format") ?? "csv").toLowerCase();
  const search = searchParams.get("search") ?? undefined;
  const paymentStatus = searchParams.get("paymentStatus") ?? undefined;
  const fulfillmentStatus = searchParams.get("fulfillmentStatus") ?? undefined;

  try {
    const report = await getSalesByOrderReport({
      startDate: range.startDate,
      endDate: range.endDate,
      search,
      paymentStatus,
      fulfillmentStatus,
      page: 1,
      limit: 2000,
    });

    const rows = report.data.map((r) => ({
      "Mã đơn": r.orderNumber,
      "Ngày tạo": fmtDateTime(r.createdAt),
      "Khách hàng": r.customerName,
      "Nhân viên": r.staffName ?? "",
      "TT thanh toán": PAYMENT_STATUS_LABELS[r.paymentStatus] ?? r.paymentStatus,
      "TT giao hàng": FULFILLMENT_STATUS_LABELS[r.fulfillmentStatus] ?? r.fulfillmentStatus,
      "Doanh thu": fmtVnd(r.revenue),
      "Đã thu": fmtVnd(r.paidAmount),
      "Còn nợ": fmtVnd(r.debtAmount),
      "Lợi nhuận": fmtVnd(r.profit),
    }));

    const filename = `chi-tiet-don-hang-${searchParams.get("startDate")}-${searchParams.get("endDate")}`;

    if (format === "csv") return csvResponse(rows, `${filename}.csv`);
    if (format === "xlsx") {
      return xlsxResponse(
        [
          {
            name: "Chi tiết đơn hàng",
            rows,
            columnWidths: [14, 18, 24, 20, 20, 16, 18, 18, 18, 18],
          },
        ],
        `${filename}.xlsx`,
      );
    }
    return NextResponse.json(
      { error: `Unsupported format: ${format}` },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  } catch (error) {
    console.error("Failed to export sales by-order report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
