import { getInternalUser } from "@workspace/database/lib/auth";
import { getOrders } from "@workspace/database/services/order.server";
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
    const { data } = await getOrders({ page: 1, limit: EXPORT_LIMIT });

    const rows = data.map((o) => ({
      "Mã đơn": o.orderNumber,
      "Khách hàng": o.customer?.fullName ?? "",
      "SĐT": o.customer?.phone ?? "",
      "Số SP": o.itemCount,
      "Tổng tiền": o.total,
      "Đã TT": o.paidAmount,
      "TT thanh toán": o.paymentStatus,
      "TT vận chuyển": o.fulfillmentStatus,
      "Ngày tạo": o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "",
      "Ngày TT": o.paidAt ? new Date(o.paidAt).toLocaleString("vi-VN") : "",
    }));

    const csv = "﻿" + toCsv(rows); // BOM for Excel UTF-8
    const filename = `don-hang-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Order export failed:", error);
    return NextResponse.json(
      { error: "Export thất bại" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
