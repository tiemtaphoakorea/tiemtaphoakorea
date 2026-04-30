import { getInternalUser } from "@workspace/database/lib/auth";
import { recordPayment } from "@workspace/database/services/order.server";
import type { IdRouteParams } from "@workspace/database/types/api";
import { PAYMENT_METHOD } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { beginIdempotency } from "@/lib/idempotency";

export async function POST(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const body = await request.json();
    const { amount, method, referenceCode, note, clientToken } = body;

    const { id: orderId } = await params;

    const idem = await beginIdempotency({
      clientToken,
      resourceType: "payment",
      resourceId: orderId,
      payload: { orderId, amount, method, referenceCode, note },
    });
    if ("replay" in idem) return idem.replay;

    const parsedAmount = Number(amount);
    if (!method || Number.isNaN(parsedAmount)) {
      return NextResponse.json(
        { error: "Missing or invalid amount/method" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    if (parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than zero" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const allowedMethods = Object.values(PAYMENT_METHOD);
    if (!allowedMethods.includes(method)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const result = await recordPayment({
      orderId,
      amount: parsedAmount,
      method,
      referenceCode,
      note,
      userId: user.profile.id,
    });

    await idem.finalize(result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to record payment:", error);
    const message = error?.message || "Internal Server Error";
    const isValidationError =
      message === "INVALID_PAYMENT_AMOUNT" || message === "OVERPAYMENT_NOT_ALLOWED";
    return NextResponse.json(
      { error: message },
      {
        status: isValidationError ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
    );
  }
}
