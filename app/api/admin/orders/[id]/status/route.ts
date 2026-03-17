import { type NextRequest, NextResponse } from "next/server";
import { getInternalUser } from "@/lib/auth.server";
import { HTTP_STATUS } from "@/lib/http-status";
import { updateOrderStatus } from "@/services/order.server";
import type { IdRouteParams } from "@/types/api";

export async function PATCH(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const body = await request.json();
    const { status, note } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const { id } = await params;
    const updated = await updateOrderStatus(id, status, user.profile.id, note);

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error("Failed to update order status:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi cập nhật trạng thái đơn hàng." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
