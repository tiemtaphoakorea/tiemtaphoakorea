import { getInternalUser } from "@repo/database/lib/auth";
import { updateOrderStatus } from "@repo/database/services/order.server";
import type { IdRouteParams } from "@repo/database/types/api";
import { HTTP_STATUS } from "@repo/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

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
