import { getInternalUser } from "@workspace/database/lib/auth";
import { getOrders } from "@workspace/database/services/order.server";
import type { AdminOrderListItem } from "@workspace/database/types/admin";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";
import { csvResponse, fetchAllPages } from "@/lib/csv-export";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const orders = await fetchAllPages<AdminOrderListItem>((params) => getOrders(params));

    const rows = orders.map((o) => ({
      "Mã đơn": o.orderNumber,
      "Khách hàng": o.customer?.fullName ?? "",
      SĐT: o.customer?.phone ?? "",
      "Số SP": o.orderItems?.length ?? 0,
      "Tổng tiền": o.total,
      "Đã TT": o.paidAmount,
      "TT thanh toán": o.paymentStatus,
      "TT vận chuyển": o.fulfillmentStatus,
      "Ngày tạo": o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "",
      "Ngày TT": o.paidAt ? new Date(o.paidAt).toLocaleString("vi-VN") : "",
    }));

    const filename = `don-hang-${new Date().toISOString().slice(0, 10)}.csv`;
    return csvResponse(rows, filename);
  } catch (error) {
    console.error("Order export failed:", error);
    return NextResponse.json(
      { error: "Export thất bại" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
