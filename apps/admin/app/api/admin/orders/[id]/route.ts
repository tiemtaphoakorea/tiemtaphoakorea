import { getInternalUser } from "@repo/database/lib/auth";
import { deleteOrder, getOrderDetails, updateOrder } from "@repo/database/services/order.server";
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
    const order = await getOrderDetails(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: HTTP_STATUS.NOT_FOUND });
    }
    return NextResponse.json({ order });
  } catch (error: any) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi xóa đơn hàng." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function PUT(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const body = await request.json();
    const { adminNote, discount } = body;

    const { id } = await params;
    const updated = await updateOrder(
      id,
      {
        adminNote,
        discount: discount !== undefined ? Number(discount) : undefined,
      },
      user.profile.id,
    );

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error("Failed to update order:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi cập nhật đơn hàng." },
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
    const result = await deleteOrder(id, user.profile.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to delete order:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi xóa đơn hàng." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
