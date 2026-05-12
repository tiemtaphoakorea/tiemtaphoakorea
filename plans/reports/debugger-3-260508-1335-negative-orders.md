# Debugger-3 Report: Inventory Stock Constraint Hypothesis

**Hypothesis:** Inventory/stock service rejects negative-quantity orders because "you can't sell -5 items from stock".

**Verdict:** **DISPROVEN.** Inventory layer is *permissive*, not restrictive. It accepts both positive (stock_in) and negative (stock_out) signed quantities by design, and the order flow explicitly allows oversell. Inventory is NOT the gate that blocks `đơn hàng âm`.

## Evidence FOR this hypothesis

None of substance. The closest match:
- `inventory.server.ts:92-94` `updateOpeningStock` rejects `newQuantity < 0` — but this is for the **opening-stock dialog**, not the order-create flow. Irrelevant to the customer-order path.

## Evidence AGAINST this hypothesis

1. **`createOrder` does NOT block insufficient stock — it allows backorder.**
   `packages/database/src/services/order.server.ts:311-333`. For each item:
   ```ts
   const availableStock = variant.onHand ?? 0;
   const quantityNeedsSupplier = Math.max(0, item.quantity - availableStock);
   // reserve the full requested qty regardless of availability
   await tx.update(productVariants).set({ reserved: sql`${productVariants.reserved} + ${item.quantity}` })...
   if (quantityNeedsSupplier > 0) { itemsNeedingStock.push(...); }
   ```
   Shortage just spawns a supplier order; it never throws. There is no `throw new Error("Insufficient stock")` anywhere in the create path.

2. **`stockOut` explicitly documents oversell-allowed.**
   `order.server.ts:374-432`, function header line 379-381:
   > `on_hand` may go negative if stock was not available (oversell is allowed once goods physically leave).

   Line 416: `onHand: sql\`${productVariants.onHand} - ${item.quantity}\`` — no guard, no precondition check on `onHand >= quantity`.

3. **Inventory movement quantity is signed by design.**
   `inventory.server.ts:9-15` defines movement types `stock_out | supplier_receipt | manual_adjustment | ...`.
   `inventory.server.ts:427` writes `quantity: -item.quantity` for stock_out.
   `inventory.server.ts:421-422` aggregates report uses `CASE WHEN quantity > 0 ... ELSE 0` and `CASE WHEN quantity < 0 ...` — proving negative quantities are first-class data, not error states.

4. **No DB CHECK constraint blocks negative `quantity`.**
   Searched `packages/database/src/schema/*.ts` — `orderItems.quantity` and `inventoryMovements.quantity` are both `integer().notNull()` with no `check()` clause. Only `defaults`, no `>= 0` or `> 0` enforcement.

5. **`adjustInventory` accepts negative `quantity` unconditionally.**
   `inventory.server.ts:177-219`: applies `on_hand += quantity` with no sign restriction; happily writes negative movements.

## Evidence AGAINST other hypotheses

### Frontend / UI validation hypothesis (debugger-1)
Frontend has `min={1}` on quantity inputs (cosmetic only, browser allows bypass via JS / pasted values):
- `apps/admin/components/admin/orders/order-item-table.tsx:76` — `min={1}`
- `apps/admin/components/admin/orders/create/order-cart-row.tsx:84` — `min={1}`
- `apps/admin/components/admin/orders/create/order-cart-card.tsx:83` — `min={1}`

`Math.max(0, ...)` clamps in display logic (`order-cart-row.tsx:66`, `order-cart-card.tsx:45`). These are **UI hints/clamps, not the authoritative gate** — they prevent honest users from typing 0/-5 but are easy to bypass (devtools, paste, programmatic POST).

### Backend / API validation hypothesis (debugger-2)
**This IS the real gate.** Hard evidence:
- `apps/admin/app/api/admin/orders/route.ts:108-114`:
  ```ts
  const validItems = items.every((item: any) => Number(item?.quantity ?? 0) > 0);
  if (!validItems) {
    return NextResponse.json(
      { error: "Quantity must be greater than 0" },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }
  ```
  Explicit early-return before any DB call. Rejects `quantity <= 0` on every order POST.
- Note: `packages/shared/src/schemas/index.ts:93` has `quantity: z.number().int().positive()` but applies to **`supplierOrderAddSchema`** (Đơn hàng nhập), not customer orders — so the shared Zod is not the gate for customer orders.
- The route-level `validItems` check (route.ts:108) is the actual chokepoint for customer orders.

## Severity

**LOW** — for the inventory hypothesis itself (it's wrong, no action needed).

But the broader question "why can't users create đơn hàng âm" has a clear answer that DOES warrant attention if the user wants to **enable** negative orders (e.g. for return / refund / credit-note flow):

- **Real gate:** `apps/admin/app/api/admin/orders/route.ts:108-114` (route-level guard).
- **Permissive layers:** DB schema, inventory service, `createOrder` core logic — all already support signed/negative semantics conceptually (via `inventory_movements.quantity`).

## Recommendation

1. **Confirm intent.** "Đơn hàng âm" likely means *return order / refund order* — not literally a negative-quantity sale. The codebase already references this pattern: `order.server.ts:531` says `Use return_order instead (not yet available in Spec 1)`. So the missing feature is **return orders**, which will create *negative inventory movements* (stock back into warehouse), not negative `orderItems.quantity`.

2. **If user wants to lift the block:**
   - Remove or relax the `validItems` check at `apps/admin/app/api/admin/orders/route.ts:108-114`.
   - Frontend `min={1}` on inputs (3 locations) becomes the next gate; relax to `min={-N}` or remove.
   - Verify downstream math: `subtotal`, `lineTotal`, `lineProfit`, `reserved`, supplier-order auto-creation logic all currently assume `quantity > 0`. They will silently produce negative values; need an audit before allowing negative items in production.
   - DB schema needs no change (no constraint blocks it).

3. **Cleaner path:** implement a dedicated `return_order` feature (per the existing TODO) rather than overloading regular orders with negative quantities.

## Unresolved Questions

- What does the user precisely mean by "đơn hàng âm"? Return orders, refunds, credit notes, or literally negative item quantity? Recommendation differs significantly.
- Is there a planned `return_order` schema (alluded to in `order.server.ts:531`) that we should align with rather than relaxing existing guards?

---

**Status:** DONE
**Summary:** Inventory hypothesis disproven — inventory layer is permissive (allows oversell, signed quantities). Real gate is the API route guard at `app/api/admin/orders/route.ts:108-114`, confirming debugger-2's hypothesis.
