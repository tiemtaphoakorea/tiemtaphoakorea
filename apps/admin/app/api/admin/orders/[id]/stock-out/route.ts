import { getInternalUser } from "@workspace/database/lib/auth";
import { stockOut } from "@workspace/database/services/order.server";
import type { IdRouteParams } from "@workspace/database/types/api";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { beginOrderIdempotency } from "@/lib/order-idempotency";

export async function POST(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { note, clientToken } = body ?? {};

    const { id } = await params;

    const idem = await beginOrderIdempotency({
      clientToken,
      orderId: id,
      action: "stock_out",
      payload: { note },
    });
    if ("replay" in idem) return idem.replay;

    const updated = await stockOut({
      orderId: id,
      userId: user.profile.id,
      note,
    });

    const response = { success: true, order: updated };
    await idem.finalize(response);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Failed to stock out order:", error);
    const message = error?.message || "Internal Server Error";
    const isDomainError =
      message.startsWith("Invalid transition") ||
      message.startsWith("Insufficient stock") ||
      message === "Order has no items";
    return NextResponse.json(
      { error: message },
      {
        status: isDomainError ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
    );
  }
}
