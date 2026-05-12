# Orders And Inventory

## Scope

This domain covers orders, payments, stock-out, cancellation, purchases, receipts, supplier orders, inventory movement, and supplier payments.

## Key Services

| Service | Purpose |
| --- | --- |
| `packages/database/src/services/order.server.ts` | Order lifecycle, payments, stock-out, cancellation |
| `packages/database/src/services/order-split.server.ts` | Split/order helper logic |
| `packages/database/src/services/inventory.server.ts` | Inventory movement and stock state |
| `packages/database/src/services/purchase-order.server.ts` | Purchase order flow |
| `packages/database/src/services/goods-receipt.server.ts` | Receipt and stock receiving flow |
| `packages/database/src/services/supplier-payment.server.ts` | Supplier payment flow |
| `packages/database/src/services/supplier.server.ts` | Supplier data |

## Key Schemas

- `packages/database/src/schema/orders.ts`
- `packages/database/src/schema/inventory.ts`
- `packages/database/src/schema/purchases.ts`
- `packages/database/src/schema/receipts.ts`
- `packages/database/src/schema/suppliers.ts`
- `packages/database/src/schema/idempotency.ts`

## Core Flow Rules

Order creation:

- Validate at least one item and positive quantities at the API boundary.
- Resolve an existing customer, or find/create a customer from phone/name.
- Lock variants before stock checks; available stock is `onHand - reserved`.
- Reserve the full ordered quantity by increasing `reserved`; do not deduct `onHand`.
- Start every normal order as `paymentStatus=unpaid` and `fulfillmentStatus=pending`.
- Compute `subtotal = sum(unitPrice * quantity)`, clamp `shippingFee >= 0`, and set `total = subtotal + shippingFee`.
- Keep shipping out of profit/revenue math; initial profit is only provisional because COGS is re-snapshotted at stock-out.
- Auto-create lightweight supplier-order rows for shortages unless `autoCreatePurchaseOrder === false`; this is not the newer purchase-order/goods-receipt flow.
- If `ship_available_first` has both available and preorder items, split into child orders through `order-split.server.ts`.

Order fulfillment:

- `pending -> stock_out`: deduct `onHand`, release `reserved`, write `stock_out` inventory movements, and re-snapshot each line's COGS from live WAC/current `costPrice`.
- Stock-out does not do a service-level insufficient-stock precheck; the current DB migration allows `onHand` to go negative after stock-out. Confirm before changing this to a blocking insufficient-stock policy.
- `stock_out -> completed`: allowed only when `paymentStatus=paid`.
- `pending -> cancelled`: release `reserved`; do not touch `onHand`.
- Return flow is API-only today: full-order return from `stock_out` or `completed`, increment `onHand`, write `cancellation` movements, mark the order `cancelled`, clear stock/completion timestamps, and set `totalCost=0`.
- Only cancelled orders can be deleted.

Inventory movement:

- Movement signs are semantic: `stock_out` is negative, `supplier_receipt` is positive, `cancellation` can be positive for customer returns or negative for receipt cancellation.
- `onHandAfter` must equal `onHandBefore + quantity`.
- Opening stock is an upserted baseline entry plus a historical `manual_adjustment` movement; editing it re-chains later movements and syncs current `productVariants.onHand`.
- Manual adjustment changes `onHand` directly and writes a `manual_adjustment` movement.

Purchase and receipt flow:

- Purchase orders move through `draft`, `ordered`, `partial`, `received`, or `cancelled`; creating or confirming a purchase order does not change stock.
- Linked completed receipts update purchase-order item `receivedQty`; PO status is recomputed from received vs ordered quantities.
- Goods receipts start as `draft`; payable amount is item total minus discounts plus extra cost.
- Completing a receipt is only valid from `draft`, increments `onHand`, writes `supplier_receipt` movements, updates WAC/current `costPrice`, and syncs linked purchase orders.
- Current UI disables receipt completion while the receipt still has supplier debt, but the route/service do not enforce that debt check. Confirm the intended policy before rewriting tests around payment-before-receipt.
- Cancelling a completed receipt with no supplier payments reverses stock with negative `cancellation` movements and reverses linked PO received quantities.
- Supplier payments recompute receipt paid/debt/payment status; payouts are cash movement, not COGS.
- Idempotency helpers protect repeated actions for orders, payments, stock-out, completion, returns, purchases, receipts, and payouts where routes opt in.

Read `docs/current/06-business-rules.md` for the full state transition and accounting detail before changing behavior or tests.

## Test Guidance

Use unit or integration tests for accounting and inventory math when possible. Use E2E only for user workflow coverage.
