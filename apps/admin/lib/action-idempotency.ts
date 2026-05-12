import {
  checkIdempotencyKey,
  comparePayloads,
  storeIdempotencyKey,
  updateIdempotencyKey,
} from "@workspace/database/lib/idempotency";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

/**
 * Generic idempotency wrapper for action routes that operate on an existing
 * resource (e.g. POST /receipts/[id]/complete, /purchases/[id]/cancel).
 *
 * Stores an `action` discriminator inside the request payload so a client
 * token reused across different actions on the same resource surfaces as a
 * payload conflict (409) instead of replaying the wrong cached response.
 *
 * Usage:
 *   const idem = await beginActionIdempotency({
 *     clientToken, resourceType: "receipt", resourceId: id, action: "complete", payload: {},
 *   });
 *   if ("replay" in idem) return idem.replay;
 *   const result = await service(...);
 *   await idem.finalize(responseBody);
 *   return NextResponse.json(responseBody);
 *
 * When `clientToken` is absent, `finalize` is a no-op — legacy clients keep
 * working without idempotency protection.
 */
export type ActionIdempotencyResourceType = "order" | "receipt" | "purchase" | "payout";

export type ActionIdempotencyState =
  | { replay: NextResponse }
  | { finalize: (response: unknown) => Promise<void> };

export async function beginActionIdempotency(opts: {
  clientToken: string | undefined;
  resourceType: ActionIdempotencyResourceType;
  resourceId: string;
  action: string;
  payload: Record<string, unknown>;
}): Promise<ActionIdempotencyState> {
  const { clientToken, resourceType, resourceId, action, payload } = opts;

  if (!clientToken) {
    return { finalize: async () => {} };
  }

  const storedPayload = { resourceId, action, ...payload };

  const existing = await checkIdempotencyKey(clientToken, resourceType);
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
      requestPayload: storedPayload,
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
    finalize: async (response: unknown) => {
      await updateIdempotencyKey(clientToken, resourceId, response);
    },
  };
}
