import { type NextRequest, NextResponse } from "next/server";
import { getInternalUser } from "@/lib/auth.server";
import { PAYMENT_METHOD } from "@/lib/constants";
import { HTTP_STATUS } from "@/lib/http-status";
import { checkIdempotencyKey, comparePayloads, storeIdempotencyKey } from "@/lib/idempotency";
import { recordPayment } from "@/services/order.server";
import type { IdRouteParams } from "@/types/api";

export async function POST(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const body = await request.json();
    const { amount, method, referenceCode, note, clientToken } = body;

    const { id: orderId } = await params;

    // Check for idempotency key if provided
    if (clientToken) {
      const existing = await checkIdempotencyKey(clientToken, "payment");
      if (existing?.exists) {
        // Compare request payloads
        const currentPayload = {
          orderId,
          amount,
          method,
          referenceCode,
          note,
        };

        if (!comparePayloads(existing.requestPayload, currentPayload)) {
          // Same key, different payload - return conflict
          return NextResponse.json(
            { error: "Idempotency key conflict: different payload" },
            { status: HTTP_STATUS.CONFLICT },
          );
        }

        // Same key, same payload - return cached response if available
        if (existing.response) {
          return NextResponse.json(existing.response);
        }
        // If no response yet, it means another request is processing - return conflict
        return NextResponse.json(
          { error: "Request already in progress" },
          { status: HTTP_STATUS.CONFLICT },
        );
      }

      // Store the idempotency key immediately to prevent race conditions
      try {
        await storeIdempotencyKey({
          key: clientToken,
          resourceType: "payment",
          requestPayload: {
            orderId,
            amount,
            method,
            referenceCode,
            note,
          },
        });
      } catch (error: any) {
        // If key already exists (race condition), check and return
        if (error?.code === "23505" || error?.constraint === "idempotency_keys_key_unique") {
          const existing = await checkIdempotencyKey(clientToken, "payment");
          if (existing?.response) {
            return NextResponse.json(existing.response);
          }
          return NextResponse.json(
            { error: "Request already in progress" },
            { status: HTTP_STATUS.CONFLICT },
          );
        }
        throw error;
      }
    }

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

    // Update idempotency key with response if clientToken was provided
    if (clientToken) {
      const { updateIdempotencyKey } = await import("@/lib/idempotency");
      await updateIdempotencyKey(clientToken, orderId, result);
    }

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
