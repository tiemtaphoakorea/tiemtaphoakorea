import { getInternalUser } from "@workspace/database/lib/auth";
import { confirmPurchaseOrder } from "@workspace/database/services/purchase-order.server";
import type { IdRouteParams } from "@workspace/database/types/api";
import { ROLE } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

const CONFIRM_ROLES: ReadonlyArray<string> = [ROLE.OWNER, ROLE.MANAGER];

export async function POST(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (!CONFIRM_ROLES.includes(user.profile.role ?? "")) {
    return NextResponse.json(
      { error: "Chỉ Manager hoặc Owner mới được duyệt đơn nhập" },
      { status: HTTP_STATUS.FORBIDDEN },
    );
  }

  try {
    const { id } = await params;
    const updated = await confirmPurchaseOrder(id, user.profile.id);
    return NextResponse.json({ success: true, purchaseOrder: updated });
  } catch (error) {
    console.error("Failed to confirm purchase order:", error);
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json({ error: message }, { status: HTTP_STATUS.BAD_REQUEST });
  }
}
