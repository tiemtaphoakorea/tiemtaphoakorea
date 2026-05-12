/**
 * Shared constants and helpers for inventory report services.
 * Used by report-inventory-current, report-inventory-ledger, report-inventory-movement.
 */

/** Movement types that count as stock IN (increasing on-hand). */
export const MOVEMENT_TYPE_IN = ["supplier_receipt"] as const;

/** Movement types that count as stock OUT (decreasing on-hand). */
export const MOVEMENT_TYPE_OUT = ["stock_out"] as const;

/** Movement types treated as adjustments (can be positive or negative). */
export const MOVEMENT_TYPE_ADJUST = [
  "manual_adjustment",
  "cancellation",
  "stock_count_balance",
  "cost_adjustment",
] as const;

/** All movement type values. */
export const ALL_MOVEMENT_TYPES = [
  "stock_out",
  "supplier_receipt",
  "manual_adjustment",
  "cancellation",
  "stock_count_balance",
  "cost_adjustment",
] as const;

export type MovementTypeBucket = "in" | "out" | "adjust";

/** Map movement type → route for reference link (no reference_type column in schema). */
export function movementReferenceRoute(
  type: string,
  referenceId: string | null,
): string | null {
  if (!referenceId) return null;
  switch (type) {
    case "supplier_receipt":
      return `/receipts/${referenceId}`;
    case "stock_out":
    case "cancellation":
      return `/orders/${referenceId}`;
    default:
      return null;
  }
}

/** Classify a movement type into a bucket. */
export function classifyMovementType(type: string): MovementTypeBucket {
  if (MOVEMENT_TYPE_IN.includes(type as (typeof MOVEMENT_TYPE_IN)[number])) return "in";
  if (MOVEMENT_TYPE_OUT.includes(type as (typeof MOVEMENT_TYPE_OUT)[number])) return "out";
  return "adjust";
}
