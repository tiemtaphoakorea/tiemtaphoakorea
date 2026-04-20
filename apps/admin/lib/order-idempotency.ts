import {
  checkIdempotencyKey,
  comparePayloads,
  storeIdempotencyKey,
  updateIdempotencyKey,
} from "@workspace/database/lib/idempotency";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

/**
 * Thin idempotency wrapper shared by the three admin order-action routes
 * (stock-out, complete, cancel). Mirrors the pattern already used inline by
 * the payments route, but adds a per-action discriminator to the stored
 * request payload so the same client token can't silently replay across
 * different actions — a mismatched action surfaces as a payload conflict
 * instead of returning a cached response for the wrong action.
 *
 * Usage:
 *   const idem = await beginOrderIdempotency({ clientToken, orderId, action, payload });
 *   if ("replay" in idem) return idem.replay;
 *   const result = await service(...);
 *   await idem.finalize(responseBody);
 *   return NextResponse.json(responseBody);
 *
 * When `clientToken` is absent, `finalize` is a no-op — callers don't need
 * to branch.
 */
export type OrderIdempotencyAction = "stock_out" | "complete" | "cancel";

export type OrderIdempotencyState =
  | { replay: NextResponse }
  | { finalize: (response: unknown) => Promise<void> };

export async function beginOrderIdempotency(opts: {
  clientToken: string | undefined;
  orderId: string;
  action: OrderIdempotencyAction;
  payload: Record<string, unknown>;
}): Promise<OrderIdempotencyState> {
  const { clientToken, orderId, action, payload } = opts;

  if (!clientToken) {
    return { finalize: async () => {} };
  }

  const storedPayload = { orderId, action, ...payload };

  const existing = await checkIdempotencyKey(clientToken, "order");
  if (existing?.exists) {
    if (!comparePayloads(existing.requestPayload, storedPayload)) {
      return {
        replay: NextResponse.json(
          { error: "Idempotency key conflict: different payload" },
          { status: HTTP_STATUS.CONFLICT },
        ),
      };
    }
    if (existing.response) {
      return { replay: NextResponse.json(existing.response) };
    }
    // Key stored but no response yet — another request is still processing,
    // or it crashed before writing its response. Either way, don't replay.
    return {
      replay: NextResponse.json(
        { error: "Request already in progress" },
        { status: HTTP_STATUS.CONFLICT },
      ),
    };
  }

  try {
    await storeIdempotencyKey({
      key: clientToken,
      resourceType: "order",
      requestPayload: storedPayload,
    });
  } catch (error: any) {
    // Race: another concurrent request inserted the same key first.
    if (error?.code === "23505" || error?.constraint === "idempotency_keys_key_unique") {
      const raced = await checkIdempotencyKey(clientToken, "order");
      if (raced?.response) {
        return { replay: NextResponse.json(raced.response) };
      }
      return {
        replay: NextResponse.json(
          { error: "Request already in progress" },
          { status: HTTP_STATUS.CONFLICT },
        ),
      };
    }
    throw error;
  }

  return {
    finalize: async (response: unknown) => {
      await updateIdempotencyKey(clientToken, orderId, response);
    },
  };
}
