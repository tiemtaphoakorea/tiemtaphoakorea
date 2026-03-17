---
id: TC-ORD-027
type: test-case
status: draft
feature: Order Management
created: 2026-02-03
updated: 2026-02-03
linked-to: [[Spec-Order-Management]]
---

# TC-ORD-027: Format JSON Variant Names in Order Detail Display

## Pre-conditions

- Logged in as Staff or Admin.
- Product variant with `name` stored as JSON string (e.g., `{"color":"Black","size":"S"}`) - simulating old data format or edge case.

## Test Steps

1. Create a product with variant name as JSON string: `{"color":"Black","size":"S"}`.
2. Create an order with this variant.
3. Navigate to order detail page (`/orders/{orderId}`).

## Expected Result

- **Variant name is displayed in human-readable format**: "Black - S" (not raw JSON string).
- **Raw JSON string is NOT displayed** in the UI.
- **Both productName and variantName** are formatted correctly if they contain JSON.
- Formatting works for:
  - Single property: `{"color":"Black"}` → "Black"
  - Multiple properties: `{"color":"Black","size":"S"}` → "Black - S"
  - Empty/null values are filtered out: `{"color":"Black","size":""}` → "Black"
  - Non-JSON strings remain unchanged: "Variant 1" → "Variant 1"

## Implementation Notes

- Uses `formatVariantDisplayName()` utility function in `lib/utils.ts`.
- Applied to order detail pages:
  - Admin order detail: `app/admin/(dashboard)/orders/[id]/page.tsx`
  - Order items table component: `components/admin/order-detail/OrderItemsTable.tsx`
  - Customer order items table: `components/account/order-detail/CustomerOrderItemsTable.tsx`

## Related Docs

- [[Spec-Order-Management]]
- `lib/utils.ts` - `formatVariantDisplayName()` function
