import { getInternalUser } from "@repo/database/lib/auth";
import {
  deleteSupplierOrder,
  getSupplierOrderDetails,
  updateSupplierOrderStatus,
} from "@repo/database/services/supplier.server";
import type { IdRouteParams } from "@repo/database/types/api";
import { HTTP_STATUS } from "@repo/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { id } = await params;
    const order = await getSupplierOrderDetails(id);
    if (!order) {
      return NextResponse.json(
        { error: "Supplier order not found" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }
    return NextResponse.json({ supplierOrder: order });
  } catch (error: any) {
    console.error("Failed to fetch supplier order:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const body = await request.json();
    const { status, note, actualCostPrice, expectedDate } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const { id } = await params;
    const updated = await updateSupplierOrderStatus(id, status, {
      note,
      actualCostPrice,
      expectedDate: expectedDate ? new Date(expectedDate) : undefined,
    });

    return NextResponse.json({ success: true, supplierOrder: updated });
  } catch (error: any) {
    console.error("Failed to update supplier order:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi cập nhật đơn nhập hàng." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { id } = await params;
    const result = await deleteSupplierOrder(id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to delete supplier order:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
