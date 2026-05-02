import { getInternalUser } from "@workspace/database/lib/auth";
import { getCustomers } from "@workspace/database/services/customer.server";
import type { CustomerStatsItem } from "@workspace/database/types/admin";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";
import { csvResponse, fetchAllPages } from "@/lib/csv-export";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const customers = await fetchAllPages<CustomerStatsItem>((params) => getCustomers(params));

    const rows = customers.map((c) => ({
      "Mã KH": c.customerCode ?? "",
      "Họ tên": c.fullName ?? "",
      SĐT: c.phone ?? "",
      "Địa chỉ": c.address ?? "",
      "Loại KH": c.customerType ?? "",
      "Tổng chi tiêu": c.totalSpent,
      "Số đơn hàng": c.orderCount,
      "Trạng thái": c.isActive ? "Hoạt động" : "Ngừng hoạt động",
      "Ngày tạo": c.createdAt ? new Date(c.createdAt).toLocaleString("vi-VN") : "",
    }));

    const filename = `khach-hang-${new Date().toISOString().slice(0, 10)}.csv`;
    return csvResponse(rows, filename);
  } catch (error) {
    console.error("Customer export failed:", error);
    return NextResponse.json(
      { error: "Export thất bại" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
