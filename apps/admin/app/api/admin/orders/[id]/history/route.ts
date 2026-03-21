import { getInternalUser } from "@workspace/database/lib/auth";
import { getOrderHistory } from "@workspace/database/services/order.server";
import type { IdRouteParams } from "@workspace/database/types/api";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { id } = await params;
    const history = await getOrderHistory(id);
    return NextResponse.json({ history });
  } catch (error: any) {
    console.error("Failed to fetch order history:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tải lịch sử đơn hàng." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
