import { getInternalUser } from "@workspace/database/lib/auth";
import { returnOrder } from "@workspace/database/services/order.server";
import type { IdRouteParams } from "@workspace/database/types/api";
import { ROLE } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { beginActionIdempotency } from "@/lib/action-idempotency";

const RETURN_ROLES: ReadonlyArray<string> = [ROLE.OWNER, ROLE.MANAGER];

export async function POST(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (!RETURN_ROLES.includes(user.profile.role ?? "")) {
    return NextResponse.json(
      { error: "Chỉ Manager hoặc Owner mới được trả đơn" },
      { status: HTTP_STATUS.FORBIDDEN },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { reason, clientToken } = body ?? {};

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập lý do trả đơn" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const { id } = await params;

    const idem = await beginActionIdempotency({
      clientToken,
      resourceType: "order",
      resourceId: id,
      action: "return",
      payload: { reason: reason.trim() },
    });
    if ("replay" in idem) return idem.replay;

    const updated = await returnOrder({
      orderId: id,
      userId: user.profile.id,
      reason: reason.trim(),
    });

    const response = { success: true, order: updated };
    await idem.finalize(response);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Failed to return order:", error);
    const message = error?.message || "Internal Server Error";
    const isDomainError =
      message.startsWith("Invalid transition") || message === "Order has no items";
    return NextResponse.json(
      { error: message },
      {
        status: isDomainError ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
    );
  }
}
