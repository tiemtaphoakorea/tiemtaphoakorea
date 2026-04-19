import { getInternalUser } from "@workspace/database/lib/auth";
import { stockOut } from "@workspace/database/services/order.server";
import type { IdRouteParams } from "@workspace/database/types/api";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { note } = body ?? {};

    const { id } = await params;
    const updated = await stockOut({
      orderId: id,
      userId: user.profile.id,
      note,
    });

    return NextResponse.json({ success: true, order: updated });
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
