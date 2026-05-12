# Inventory WAC & Stock-Out Logic Analysis

## Summary
The system implements **Sapo-style Weighted Average Cost (WAC)** with two distinct cost capture points:
1. **At goods receipt completion**: WAC recomputed on `productVariants.costPrice`
2. **At order creation/stock-out**: Unit cost **snapshot** captured in `orderItems.costPriceAtOrderTime`

Stock-out **does not recompute costs**—it is a pure inventory deduction.

---

## Cost Flows

### Flow 1: Goods Receipt → WAC Update (Stock-In)
**Trigger**: `completeGoodsReceipt()` / `/packages/database/src/services/goods-receipt.server.ts:328–409`

**Steps**:
1. User completes a draft receipt → status moves from `DRAFT` to `COMPLETED`
2. Stock-in: increment `productVariants.onHand` per item (lines 352–375)
3. **Apply Sapo-style WAC**: calls `applyWeightedAverageCost()` (line 378–383)
4. Write `costPriceHistory` row logging the change (lines 117–124)
5. Sync linked PO status if receipt references a PO

**WAC Formula** (lines 102–108 in `applyWeightedAverageCost`):
```
IF onHand ≤ 0:
  newCost = incomingQty > 0 ? (incomingCost / incomingQty) : oldCost
  [Use incoming average cost, fallback to old cost if incoming qty is 0]
ELSE:
  newCost = (oldCost × oldQty + incomingCost) / (oldQty + incomingQty)
  [Standard WAC formula]
```

**Cost Resolution**: `goodsReceiptItems.unitCost` (user-entered PO/receipt line cost) is the source of truth for WAC computation.

---

### Flow 2: Create Order → Cost Snapshot
**Trigger**: `createOrder()` / `/packages/database/src/services/order.server.ts:163–374`

**Steps**:
1. Lock variants with SELECT FOR UPDATE (lines 200–215)
2. **Snapshot current cost**: read `productVariants.costPrice` at order time (line 274)
3. Write `orderItems` with:
   - `costPriceAtOrderTime`: the **current WAC from productVariants.costPrice** (line 345)
   - `lineCost`: quantity × costPriceAtOrderTime (line 347)
   - `lineProfit`: (unitPrice − costPrice) × quantity (line 348)
4. Reserve stock: increment `productVariants.reserved` (lines 318–323)
5. **On-hand is NOT deducted** at order time

**Cost Resolution**: `productVariants.costPrice` (the live WAC, last updated by `completeGoodsReceipt`)

---

### Flow 3: Stock-Out (xuất kho) — No Cost Recomputation
**Trigger**: `stockOut()` / `/packages/database/src/services/order.server.ts:386–457`

**Steps**:
1. Validate order is `fulfillmentStatus = PENDING`
2. Lock order and variants (lines 396–411)
3. **Deduct both on-hand and reserved**:
   - `onHand -= qty`
   - `reserved -= qty`
   (lines 415–421)
4. Write `inventoryMovements` record of type `stock_out` (lines 424–433)
5. Update order `fulfillmentStatus = STOCK_OUT`, set `stockOutAt = now()` (lines 437–445)

**Cost Resolution**: ✗ **No cost recomputation at stock-out.**
- The cost was already **captured and frozen** at order creation in `costPriceAtOrderTime`
- `inventoryMovements.stock_out` record does **not** include cost—it is inventory-only

**Special Handling**:
- ✓ Allows negative on-hand (oversell permitted)
- ✓ Idempotent guard: rejects if not in PENDING state
- ✗ No handling if WAC is null/0 (uses whatever was in `productVariants.costPrice` at order time)

---

## Data Model: Cost Storage

| Table                      | Column             | Role | Updated By | Notes |
|------|------|------|------|------|
| `productVariants`          | `costPrice`        | **Live WAC** | `completeGoodsReceipt()` → `applyWeightedAverageCost()` | Always current; used at order time |
| `costPriceHistory`         | `costPrice`        | **WAC audit trail** | `applyWeightedAverageCost()` | Logs every change with reason |
| `goodsReceiptItems`        | `unitCost`         | **Inbound cost source** | User input or PO prefill | Basis for WAC computation |
| `orderItems`               | `costPriceAtOrderTime` | **COGS snapshot** | `createOrder()` | Frozen at order time for profit calculation |
| `inventoryMovements`       | *(none)* | Movement record | Various types | Inventory-only; no cost tracking |

---

## Special Cases

### WAC = 0 or Null at Order/Stock-Out
- **At order creation**: uses `productVariants.costPrice` as-is (could be 0)
  - lineCost = 0 × qty = 0
  - lineProfit = unitPrice × qty (100% margin)
- **At stock-out**: no cost logic involved; purely inventory deduction
- **Fallback in WAC formula** (line 105): if old qty ≤ 0, use incoming average cost; else standard WAC

### Multiple Flows (if applicable)
1. ✓ **Order fulfillment**: `createOrder()` → `stockOut()` → `completeOrder()` [standard flow]
2. ✓ **Manual stock-out**: direct `stockOut()` call (can be triggered independently)
3. ✓ **Returns**: *(not in current spec)*
4. ✓ **Manual adjustments**: `adjustInventory()` writes `manual_adjustment` movement (no WAC impact)

---

## Code References
- `applyWeightedAverageCost()`: `/packages/database/src/services/goods-receipt.server.ts:70–126`
- `completeGoodsReceipt()`: `/packages/database/src/services/goods-receipt.server.ts:328–409`
- `createOrder()`: `/packages/database/src/services/order.server.ts:163–374` (lines 274, 345–348)
- `stockOut()`: `/packages/database/src/services/order.server.ts:386–457`
- Schema: `/packages/database/src/schema/{products,receipts,orders}.ts`

