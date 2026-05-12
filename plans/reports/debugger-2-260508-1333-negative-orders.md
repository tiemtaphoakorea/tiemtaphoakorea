# Debugger-2 Report: Backend/API Validation Hypothesis

**Hypothesis:** Server-side validation (API Zod, business logic, DB CHECK constraints) rejects negative quantities/amounts on order creation, blocking "đơn hàng âm".

**Verdict:** PARTIALLY CONFIRMED. Backend rejects `quantity <= 0` only at order *create* (POST /api/admin/orders); other entry points are open. DB has no CHECK constraints on order quantities/totals. **There is no Zod layer.**

---

## Evidence FOR this hypothesis

### 1. Hard-coded check on order creation (the smoking gun)
`apps/admin/app/api/admin/orders/route.ts:108-114`:
```ts
const validItems = items.every((item: any) => Number(item?.quantity ?? 0) > 0);
if (!validItems) {
  return NextResponse.json(
    { error: "Quantity must be greater than 0" },
    { status: HTTP_STATUS.BAD_REQUEST },
  );
}
```
- Strict `> 0` → rejects 0 and any negative.
- Coerces `null/undefined → 0`, so missing field is also rejected.
- Returns 400 with literal Vietnamese-translatable string the user is hitting.
- This validation lives ONLY at POST /api/admin/orders. Confirms the user-reported "không tạo được đơn âm".

### 2. Inputs are coerced via `Number()` everywhere
`route.ts:138`, `route.ts:147`, `[id]/route.ts:50`: every numeric is `Number(item.quantity)` / `Number(shippingFee)`. Strings parse, but a negative number stays negative — only the `> 0` check above blocks them.

### 3. Payment amounts are also rejected if `<= 0`
`apps/admin/app/api/admin/orders/[id]/payments/route.ts:37-42` rejects `parsedAmount <= 0` with "Amount must be greater than zero". Reinforces the pattern: numeric-must-be-positive checks exist, but per-route, not centralized.

### 4. `shippingFee` is silently clamped, not rejected
`packages/database/src/services/order.server.ts:275`:
```ts
const shippingFee = Math.max(0, Number(data.shippingFee ?? 0));
```
Negative shippingFee is silently zeroed in `createOrder`. Defensive, but no error surfaced — user sees "success" with 0 fee.

### 5. Error-message classification recognizes "Quantity"
`route.ts:204-208`: `errorMessage.includes("Quantity")` is in the domain-error allowlist that surfaces 400 instead of 500. Confirms team treats quantity violations as user-correctable input errors.

---

## Evidence AGAINST this hypothesis

### 1. No Zod / shared schema for order routes
- `grep -rln "from \"zod\"" apps/admin/` returns ONLY `banner-form-panel.tsx`, `collection-form-panel.tsx`, `supplier-drawer.tsx`, `category-drawer.tsx`, `user-drawer.tsx`, `customer-drawer.tsx`.
- ZERO Zod usage in `apps/admin/app/api/admin/orders/**` or in `packages/database/src/services/order.server.ts`.
- Validation is ad-hoc `if (Number(x) <= 0)` per route — not a centralized layer.

### 2. PUT (edit) route is OPEN to negative quantity
`apps/admin/app/api/admin/orders/[id]/route.ts:45-55` calls `updateOrderItems` after only `Number(item.quantity)` — NO `> 0` guard. If a client posts negative quantity here, it reaches the service.

`updateOrderItems` (`order.server.ts:862-978`) also performs no quantity sign check. It blindly does:
- `subtotal += unitPrice * item.quantity;`  (negative quantity → negative subtotal)
- `reserved + ${item.quantity}`  (negative → may violate `reserved_non_negative` CHECK)
- inserts into `order_items.quantity` (column is plain `integer`, no CHECK).

If the negative-quantity update doesn't decrement reserved below zero, the row inserts cleanly — schema permits it. The DB will only reject when the integer arithmetic on `reserved` underflows the `reserved_non_negative` constraint, which is incidental to quantity, not a direct guard.

### 3. `createOrder` service itself does not validate quantity
`order.server.ts:163-348`: receives `items: Array<{ ... quantity: number }>` and uses arithmetic directly (`unitPrice * item.quantity`, `available >= item.quantity`). No defensive `< 0` check. The route-level guard is the ONLY gate on POST.

### 4. No DB CHECK constraint on order quantities or totals
`packages/database/drizzle/0000_blushing_marten_broadcloak.sql:357-361`:
```sql
"on_hand_non_negative"        CHECK ("on_hand" >= 0)        -- DROPPED in 0001
"reserved_non_negative"       CHECK ("reserved" >= 0)        -- still active
"completed_requires_paid"     CHECK (...)
"stock_out_at_consistency"    CHECK (...)
"completed_at_consistency"    CHECK (...)
```
- `0001_allow_negative_on_hand.sql` drops `on_hand_non_negative` (intentional — to allow stock-out before physical restock).
- NO CHECK on `order_items.quantity`, `orders.subtotal`, `orders.total`, `orders.discount`, `orders.shipping_fee`, `orders.paid_amount`.
- Schema (`packages/database/src/schema/orders.ts`): all are plain `integer` / `decimal` without CHECK.

### 5. `discount`, `customPrice` not validated
PUT `/api/admin/orders/[id]` `route.ts:62`: `discount: discount !== undefined ? Number(discount) : undefined` — no sign check.
POST `route.ts:139`: `customPrice` accepts any number including negative. Service uses it as `unitPrice`.

### 6. Storefront / public order routes
`grep -l "createOrder" apps/**/api/**/route.ts` returns only `apps/admin/app/api/admin/orders/route.ts`. So only one public entry point exists for order creation — the same one that has the `> 0` guard.

---

## Evidence AGAINST other hypotheses

### Frontend UI validation hypothesis
- Frontend MAY add `min={1}` on inputs, but that's bypassable via direct API call. The fact that there's an API-level `> 0` guard means even if FE were absent, BE blocks negative-create.
- However, since no Zod schema exists, FE is the FIRST line of defense for `customPrice`, `shippingFee`, `discount` — backend does NOT reject those.
- Conclusion: FE validation likely exists but is NOT load-bearing for `quantity`; BE has the authoritative check at POST. For other fields, FE is the only validator.

### Inventory stock check hypothesis (debugger-3's hypothesis)
- Stock check (`order.server.ts:228-237`) uses `available >= item.quantity` to classify items as `inStockItems` / `preOrderItems`. With `quantity = -5`, `available >= -5` is always true → item goes to `inStockItems` and proceeds normally. NO insufficient-stock error fires for negative quantity.
- `Math.max(0, item.quantity - availableStock)` at line 314 → with negative quantity, `quantityNeedsSupplier = 0` → no supplier order. Negative quantity does NOT trigger any stock-related rejection.
- Stock-check would only fail/block if `quantity > availableStock` AND backorder pathway threw — neither applies to negative inputs.
- Conclusion: Inventory check is irrelevant to negative-quantity rejection. It's purely the `> 0` guard at route.ts:108 that blocks the user.

---

## Severity

**HIGH** — for the LITERAL user-reported problem ("can't create đơn âm"), the root cause is unambiguous: `apps/admin/app/api/admin/orders/route.ts:108` rejects `quantity <= 0`. Removing/relaxing this single line (plus FE input min) makes negative orders possible.

**HIGH (defense-in-depth gap)** — there is otherwise NO defense:
- No Zod schema.
- No DB CHECK on `order_items.quantity`, `orders.total`, `discount`, `customPrice`.
- PUT edit-order endpoint has no quantity guard at all (negative qty would partially write, possibly fail later on the `reserved_non_negative` CHECK).
- `customPrice`, `discount`, `shippingFee` accept any value (`shippingFee` clamped, others passed through).

---

## Recommendation

If the user WANTS to enable negative orders (e.g. returns, refunds, corrections):

1. **Define a clear semantic.** "Đơn âm" could mean:
   - return/refund order (negative line items as credit memo)
   - quantity adjustment / reverse stock movement
   - manual write-off
   Treat as a distinct order *type*, not a sign flip on `quantity`.

2. **Targeted relaxation, not blanket removal.** Replace the binary `> 0` check at `route.ts:108` with a guard tied to an explicit `orderType` / `intent` field:
   ```ts
   const isReturn = body.orderType === "return";
   const validItems = items.every((item: any) => {
     const q = Number(item?.quantity ?? 0);
     return isReturn ? q < 0 : q > 0;  // returns: strictly negative; sales: strictly positive
   });
   ```
   Mirror in `updateOrderItems`.

3. **Add DB CHECK constraints to enforce invariants** (regardless of the path forward):
   - `CHECK (quantity != 0)` on `order_items` — zero quantity is never useful.
   - `CHECK (unit_price >= 0)` — return orders should still have non-negative unit_price; sign lives on quantity.
   - Consider matching constraint on `orders.total` per orderType.

4. **Add Zod validation layer.** Order routes have grown enough that ad-hoc `Number()` checks are leaking (PUT route is unguarded, `discount`/`customPrice` unbounded). A shared Zod schema in `packages/shared` for order inputs would close gaps consistently.

5. **Stock side-effects for negative quantity must be designed.** Currently:
   - `reserved + (-N)` may violate `reserved_non_negative` (DB will throw a constraint error mid-transaction).
   - `on_hand + N` for return restock has no implementation; `stockOut` only DECREMENTS.
   Negative orders need a corresponding inventory movement helper before they're safe to enable.

---

## Unresolved questions

1. Does the user actually WANT to create negative orders (returns/refunds/credit memos)? Or are they trying to express a different concept (quantity adjustment, reverse delivery)? — Domain decision.
2. If negative orders are sanctioned, should existing CHECK `reserved_non_negative` be relaxed too, or should the return path use a separate inventory-restock service that bypasses `reserved`?
3. Is `discount > subtotal` allowed (effectively negative `total`)? Currently no guard — `total = subtotal - discount` can go negative silently.
4. What's the FE form behavior when user enters negative qty — does it show an error before hitting the API, or does it submit and the user only sees the 400? (debugger-1 should confirm.)

**Status:** DONE
**Summary:** Confirmed: `apps/admin/app/api/admin/orders/route.ts:108` is the single source of rejection (`> 0` guard). No Zod, no DB CHECK on order quantity/total. PUT edit-order route is unguarded. Stock-check hypothesis is ruled out — negative qty bypasses it.
