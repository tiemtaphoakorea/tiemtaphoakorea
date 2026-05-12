# Pre-Order COGS Lifecycle Flow Map

## 1. Pre-Order Branching at Order Creation

**File**: `packages/database/src/services/order.server.ts:200–262` + `order-split.server.ts`

When `createOrder()` is called:
- **Lines 226–239**: Items are classified into `inStockItems` (available now) vs `preOrderItems` (shortage)
- **Lines 242–261**: If `deliveryPreference=SHIP_AVAILABLE_FIRST` AND both item types exist → `createSplitOrders()` called
- **Else**: Single order created (either all in-stock or all pre-order)

**Split Order Details** (`order-split.server.ts:16–127`):
- **Parent order** (line 55–78): Created with `paymentStatus=UNPAID`, `fulfillmentStatus=PENDING`, `totalCost` = WAC @ order time across ALL items
- **Sub-orders** (lines 84–106): Separate order per stock type
  - **In-stock sub-order**: Gets suffix `-A`, parent customer, `fulfillmentStatus=PENDING`
  - **Pre-order sub-order**: Gets suffix `-B`, parent customer, `fulfillmentStatus=PENDING`
  - **Both** cost-snapshot at creation (line 148: `totalCost += variant.costPrice * qty`)
- **Supplier order auto-creation** (lines 115–125): For pre-order items only, creates `supplierOrders` rows with status=PENDING

**Critical Issue #1**: Cost snapshot at order creation time (line 148, 211) uses current `variant.costPrice`. For pre-orders placed BEFORE first goods receipt, this will be 0 or stale until goods arrive. ✓ Mitigated by your stockOut re-snapshot, but see Issue #3.

---

## 2. Supplier Order Linkage & Goods Receipt Flow

**File**: `packages/database/src/services/order-split.server.ts:117–124` + `goods-receipt.server.ts:328–409`

**Supplier Order Creation** (auto-triggered on pre-order):
- Table: `supplierOrders` (id, variantId, quantity, status=PENDING, note=order reference, createdAt)
- No explicit link back to customer order; only the `note` field holds order number for matching
- Status progresses: PENDING → COMPLETED when goods receipt is completed

**Goods Receipt Complete Flow** (`completeGoodsReceipt`, line 328–409):
1. **Stock-in** (lines 351–375): Increment `productVariants.onHand` for each receipt item; log movement
2. **WAC Update** (lines 377–383): `applyWeightedAverageCost()` re-calculates `productVariants.costPrice` using formula:
   ```
   newCost = (oldCost × oldQty + incomingCost) / (oldQty + incomingQty)
   ```
3. **Purchase Order sync** (lines 386–393): Updates linked PO status only (if `purchaseOrderId` set)
4. **Mark completed** (lines 396–405): Sets receipt status=COMPLETED, `receivedAt=now`, `completedBy`

**Critical Issue #2**: When `completeGoodsReceipt()` finishes and WAC updates, **existing pending pre-orders are NOT notified or re-costed**. The system relies on your stockOut re-snapshot to pick up the new WAC. If an order sits in PENDING state for weeks after goods arrive, cost is still stale until stockOut.

---

## 3. COGS Re-Snapshot at Stock-Out (Your Fix)

**File**: `packages/database/src/services/order.server.ts:391–497` (`stockOut()`)

**What happens** (lines 424–445):
- Reads live `productVariants.costPrice` (WAC) for each order item
- **Overwrites** `orderItems.costPriceAtOrderTime`, `lineCost`, `lineProfit`
- Overwrites order-level `totalCost`, `profit` (lines 481–482)
- Decrements `onHand` and `reserved` symmetrically
- Logs inventory movement

**Why it matters**: For a pre-order placed 2023-01-01 at costPrice=0 (no goods yet), then goods received 2023-02-01 with costPrice=100:
- At order creation: `lineCost = 0` (stale)
- At goods receipt: `productVariants.costPrice = 100` (WAC updated) but order NOT refreshed
- At stockOut: `lineCost` re-snapshotted to 100 ✓

✓ **Your fix addresses the core COGS matching issue** (Sapo principle: COGS tied to fulfillment, not order creation).

---

## 4. Payment Timing for Pre-Orders

**File**: `packages/database/src/services/order.server.ts:1138–1204` (`recordPayment()`)

**Can a pre-order be paid before goods arrive?** YES.

**Payment Recording Logic** (lines 1152–1192):
- Checks: `fulfillmentStatus` not CANCELLED/COMPLETED (line 1155–1160)
  - ✓ PENDING orders (including pre-orders) CAN accept payment
- Checks: `paidAmount + payment ≤ total` (no overpayment)
- Updates: `paymentStatus` (UNPAID → PARTIAL → PAID), sets `paidAt=now` only when fully paid
- **No fulfillmentStatus change** — order can stay PENDING+PAID indefinitely

**Critical Issue #3**: Pre-order can be PAID but stay PENDING for weeks/months until goods arrive + stockOut. During this time:
- `orders.profit`, `orders.totalCost` are stale (pre-stock-out costs)
- P&L reports (line 5 below) reading these fields will show wrong profit until stockOut

---

## 5. Reports & P&L Filtering

**File**: `packages/database/src/services/analytics.server.ts:9–152` + test files

**Current KPI/Revenue Query** (lines 14–21, 40–50):
```sql
WHERE isNotNull(orders.paidAt)
AND gte(orders.paidAt, startOfYear)  -- grouped by paidAt month
```
- **Filters by `paidAt`** (payment date), not `createdAt` or `stockOutAt`
- **Does NOT filter by `fulfillmentStatus`** (includes PENDING paid orders)
- **Revenue** = sum of `orders.total` (not profit)

**Cost fields NOT directly exposed in current analytics**:
- `orders.totalCost` (read but not exported in KPI query)
- `orders.profit` (read but not exported in KPI query)
- `orderItems.lineCost` / `lineProfit` (not aggregated)

**Gap**: If a pre-order is paid 2023-01-01 but not stocked out until 2023-03-01, it will be counted in 2023-01 revenue with stale cost. **No separate "pending paid" report exists to flag this state.**

**Inventory Analytics** (lines 91–113):
- Computes cost basis of on-hand stock (OK: uses live costPrice)
- No pre-order or pending fulfillment visibility

---

## 6. Order Modification Before Stock-Out

**File**: `packages/database/src/services/order.server.ts:815–945` (`updateOrder()`)

**Allowed changes while PENDING** (line 833):
- `customerId`, `adminNote`, `discount`, `shippingName/Phone/Address`
- **NOT items or quantity** (would require cancellation + new order)

**Discount impact on cost** (lines 884–891):
- Updates `total = subtotal - discount`
- Updates `profit = (subtotal - discount) - totalCost` (re-computes using CURRENT totalCost)
- **Does NOT re-snapshot costs** from variants (unlike stockOut)

**For pre-orders**: If discount is added before goods arrive, profit is re-computed but cost is still stale. Example:
- Pre-order placed at costPrice=0: `profit = 1000 - 0 = 1000`
- Discount added: `profit = 900 - 0 = 900` (cost still 0 until stockOut)
- At stockOut, cost re-snapped to 100: `profit = 900 - 100 = 800` (correct)

This is OK because stockOut re-snaps, but the intermediate state is wrong.

---

## Summary of Gaps & Issues

| # | Gap | Impact | Mitigation |
|---|-----|--------|-----------|
| **1** | Pre-order cost=0 at creation until goods arrive | COGS wrong before stockOut | ✓ Your stockOut re-snapshot fixes this |
| **2** | Goods receipt doesn't notify/update pending orders | Pending pre-orders sit with stale cost even after WAC updates | None — relies on eventual stockOut |
| **3** | Payment can arrive weeks before fulfillment | Paid+Pending pre-orders blur revenue timing; P&L includes paid but not cost-matched orders in early months | Add "pending paid" filter to analytics or enforce stockOut before payment acceptance |
| **4** | Analytics filter by paidAt, not stockOutAt | Revenue may be recognized before COGS is finalized (pre-stockOut) | Consider filtering by stockOutAt for "true" accrual P&L, or require completed/stockOut state |
| **5** | No explicit pre-order↔supplier-order link in schema | Hard to trace: which customer order triggered which PO? Note field is fragile | Add `orderItemId` FK to `supplierOrders` or separate join table |
| **6** | Discount re-computes profit but not cost before stockOut | Intermediate profit wrong, corrected at stockOut | OK given stockOut fix, but confusing for interim reporting |

---

## Recommendations

1. **Enforce stockOut before finalizing P&L**: Add check in `recordPayment()` or reporting to require `fulfillmentStatus >= STOCK_OUT` if `paymentStatus = PAID`
2. **Supplier order → customer order traceability**: Add `customerOrderId` or `orderItemId` FK to `supplierOrders` for audit/matching
3. **Add "Pending Paid" report**: Filter `fulfillmentStatus=PENDING AND paymentStatus=PAID` to flag pre-orders sitting with unmatched costs
4. **P&L accrual basis**: Use `stockOutAt` or `completedAt` (not `paidAt`) for revenue recognition; ensure COGS is finalized before reporting

