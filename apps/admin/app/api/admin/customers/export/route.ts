import { getInternalUser } from "@workspace/database/lib/auth";
import { getCustomers } from "@workspace/database/services/customer.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

const EXPORT_LIMIT = 5000;

function toCsv(rows: object[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape((r as Record<string, unknown>)[h])).join(",")),
  ].join("\r\n");
}

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { data } = await getCustomers({ page: 1, limit: EXPORT_LIMIT });

    const rows = data.map((c) => ({
      "Mã KH": c.customerCode ?? "",
      "Họ tên": c.fullName ?? "",
      "SĐT": c.phone ?? "",
      "Địa chỉ": c.address ?? "",
      "Loại KH": c.customerType ?? "",
      "Tổng chi tiêu": c.totalSpent,
      "Số đơn hàng": c.orderCount,
      "Trạng thái": c.isActive ? "Hoạt động" : "Ngừng hoạt động",
      "Ngày tạo": c.createdAt ? new Date(c.createdAt).toLocaleString("vi-VN") : "",
    }));

    const csv = "﻿" + toCsv(rows); // BOM for Excel UTF-8
    const filename = `khach-hang-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Customer export failed:", error);
    return NextResponse.json(
      { error: "Export thất bại" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
