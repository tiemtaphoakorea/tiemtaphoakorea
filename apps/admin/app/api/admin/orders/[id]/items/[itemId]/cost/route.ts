import { getInternalUser } from "@workspace/database/lib/auth";
import { updateStockOutOrderItemCost } from "@workspace/database/services/order.server";
import { ROLE } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { beginActionIdempotency } from "@/lib/action-idempotency";

const COST_UPDATE_ROLES: ReadonlyArray<string> = [ROLE.OWNER, ROLE.MANAGER];

type RouteParams = {
  params: Promise<{ id: string; itemId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (!COST_UPDATE_ROLES.includes(user.profile.role ?? "")) {
    return NextResponse.json(
      { error: "Chỉ Manager hoặc Owner mới được cập nhật giá vốn đơn đã xuất" },
      { status: HTTP_STATUS.FORBIDDEN },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const unitCost = Number(body?.unitCost);
    if (!Number.isFinite(unitCost) || unitCost <= 0) {
      return NextResponse.json(
        { error: "Giá vốn phải lớn hơn 0" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const { id, itemId } = await params;
    const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim() : undefined;
    const clientToken = typeof body?.clientToken === "string" ? body.clientToken : undefined;

    const idem = await beginActionIdempotency({
      clientToken,
      resourceType: "order",
      resourceId: id,
      action: `update-item-cost:${itemId}`,
      payload: { itemId, unitCost, note },
    });
    if ("replay" in idem) return idem.replay;

    const updated = await updateStockOutOrderItemCost({
      orderId: id,
      orderItemId: itemId,
      unitCost,
      userId: user.profile.id,
      note,
    });

    const response = { success: true, order: updated };
    await idem.finalize(response);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Failed to update stock-out order item cost:", error);
    const message = error?.message || "Internal Server Error";
    const isDomainError =
      message === "Order item not found" ||
      message === "Order item does not belong to order" ||
      message === "Unit cost must be greater than 0" ||
      message.startsWith("Invalid transition");
    return NextResponse.json(
      { error: message },
      { status: isDomainError ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
