import { type ActionIdempotencyState, beginActionIdempotency } from "@/lib/action-idempotency";

/**
 * Thin wrapper around `beginActionIdempotency` that pins resourceType to
 * "order" and restricts `action` to the three order-action routes. Kept as
 * a named alias so existing call sites and tests don't need to change.
 */
export type OrderIdempotencyAction = "stock_out" | "complete" | "cancel";

export type OrderIdempotencyState = ActionIdempotencyState;

export async function beginOrderIdempotency(opts: {
  clientToken: string | undefined;
  orderId: string;
  action: OrderIdempotencyAction;
  payload: Record<string, unknown>;
}): Promise<OrderIdempotencyState> {
  return beginActionIdempotency({
    clientToken: opts.clientToken,
    resourceType: "order",
    resourceId: opts.orderId,
    action: opts.action,
    payload: opts.payload,
  });
}
