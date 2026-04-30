import {
  checkIdempotencyKey,
  comparePayloads,
  storeIdempotencyKey,
  updateIdempotencyKey,
} from "@workspace/database/lib/idempotency";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

/**
 * Generic idempotency wrapper for HTTP handlers. Used by routes that don't
 * follow the order-action shape — currently POST /orders (create) and
 * POST /orders/[id]/payments. For action routes (cancel/complete/stock-out)
 * use beginOrderIdempotency, which adds an action discriminator.
 *
 * Usage:
 *   const idem = await beginIdempotency({ clientToken, resourceType, resourceId, payload });
 *   if ("replay" in idem) return idem.replay;
 *   const result = await service(...);
 *   await idem.finalize(response, result.id);  // resourceId optional if known up-front
 *   return NextResponse.json(response);
 */
export type IdempotencyState =
  | { replay: NextResponse }
  | { finalize: (response: unknown, resourceId?: string) => Promise<void> };

export async function beginIdempotency(opts: {
  clientToken: string | undefined;
  resourceType: "order" | "payment";
  resourceId?: string;
  payload: Record<string, unknown>;
}): Promise<IdempotencyState> {
  const { clientToken, resourceType, resourceId, payload } = opts;

  if (!clientToken) {
    return { finalize: async () => {} };
  }

  const existing = await checkIdempotencyKey(clientToken, resourceType);
  if (existing?.exists) {
    if (!comparePayloads(existing.requestPayload, payload)) {
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
      resourceType,
      resourceId,
      requestPayload: payload,
    });
  } catch (error: any) {
    if (error?.code === "23505" || error?.constraint === "idempotency_keys_key_unique") {
      const raced = await checkIdempotencyKey(clientToken, resourceType);
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
    finalize: async (response: unknown, finalResourceId?: string) => {
      const id = finalResourceId ?? resourceId;
      if (!id) return;
      await updateIdempotencyKey(clientToken, id, response);
    },
  };
}
