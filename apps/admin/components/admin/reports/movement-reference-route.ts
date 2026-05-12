/**
 * Client-side helper: derive reference route from movement type + referenceId.
 * Schema has no reference_type column — we infer from movement type.
 */
export function movementReferenceRoute(type: string, referenceId: string | null): string | null {
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
