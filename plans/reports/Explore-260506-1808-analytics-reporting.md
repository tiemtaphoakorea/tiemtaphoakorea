# Analytics & Reporting State Exploration
**Date:** 2026-05-06 | **Scope:** Order/Inventory/Supplier-Order reports & DB schema

---

## 1. ORDER REPORTS (báo cáo theo đơn) — **GAPS IDENTIFIED**

### What EXISTS Today:
- **Order List** (`apps/admin/app/(dashboard)/orders/_content.tsx`):
  - Filterable by fulfillment status + search by order/customer
  - Shows: order#, customer, phone, item count, total (revenue), payment/fulfillment status, created date
  - Exports: Excel export endpoint (`/api/admin/orders/export`)
  - **Does NOT show per-order COGS or profit**

- **Order Detail** (`orders/[id]/_content.tsx`):
  - Full line items with unit price, quantity, line total
  - Discount & admin notes editable
  - Payment recording modal (amount, method, ref, note)
  - Customer edit & shipping section
  - **No P&L breakdown (per order COGS, gross profit per order)**

- **FinanceStats Component** (`finance/finance-stats.tsx`):
  - Aggregated KPIs: Revenue, COGS (total), Gross Profit (total), Expenses, Net Profit
  - Shows monthly view (detail drill-down at `/analytics/finance/detail`)
  - **Does NOT support per-order or date-range P&L filtering**

### DB Schema (orders.ts):
✅ `orderItems`: `costPriceAtOrderTime`, `lineCost`, `lineProfit` ← Exists  
✅ `orders`: `totalCost`, `profit` ← Exists  
⚠️ **BUT:** No clear query showing per-order P&L with filters (date, customer, status)

### **GAPS:**
1. **No order-level P&L report** — Can't drill "show me all orders from Jan 1–Feb 28, filter by customer X, show profit per order + totals"
2. **No order profitability filter** — "Show me unprofitable orders" (negative profit) or by margin %
3. **Export only shows revenue-side** — No COGS/profit in Excel export
4. **No order-level report template** — Manual aggregation required in BI

---

## 2. INVENTORY REPORTS (báo cáo kho) — **PARTIAL COVERAGE**

### What EXISTS Today:
- **Analytics Inventory Tab** (`analytics/inventory/_content.tsx`):
  - ✅ Shows on-hand qty per variant + low-stock/out-of-stock alerts
  - ✅ **Inventory valuation (cost & retail):**
    - `totalCostValue` = Σ(onHand × costPrice) — **import/cost price ✅**
    - `totalRetailValue` = Σ(onHand × sellingPrice) — **sale price ✅**
    - Potential profit = retail − cost value
  - Shows: units in stock, count of low/out-of-stock SKUs
  - References: `apps/admin/components/admin/analytics/inventory-stats.tsx` (line 16: `totalCostValue` from import price)

- **Operational Inventory Page** (`inventory/_content.tsx`):
  - Tabs: All stock | Low stock | Out of stock
  - Shows: product, category, available qty, physical qty, reserved qty
  - Quick-link to "Nhập hàng" (supplier orders)
  - **Does NOT show inventory valuation or per-category inventory P&L**

- **API:** `/api/admin/analytics/stock-alerts` — Returns low/out-of-stock lists (10 each)

### DB Schema (inventory.ts):
✅ `inventoryMovements`: Tracks type, quantity changes, on-hand snapshots  
⚠️ **No inventory snapshot table** — Can't compute "inventory value as of Jan 31" for month-end reporting

### **GAPS:**
1. **No inventory valuation trend** — Can't show "month-end inventory value: Jan=$50k, Feb=$48k, Mar=$52k"
2. **No per-category breakdown** — "Category X has $10k tied up in inventory, Category Y has $5k" (for cash flow analysis)
3. **No slow-moving stock report** — Can't identify "items on hand >180 days, no sales"
4. **No inventory aging** — Can't report "how much inventory is >90 days old" (by purchase batch)
5. **Valuation only current** — No historical snapshots (needed for balance sheet / financial reporting)

---

## 3. SUPPLIER ORDERS / PURCHASE ORDERS — **CLEAR STATE MACHINE, MINIMAL REPORTING**

### What EXISTS Today:
- **Supplier Orders List** (`supplier-orders/_content.tsx`):
  - Single unified list of all supplier orders (POs)
  - States: PENDING → ORDERED → RECEIVED → CANCELLED
  - Searchable by: SKU, product name, note
  - Shows: product, SKU, quantity, status (color-coded), expected date, created date
  - **Does NOT distinguish "danh sách đặt hàng nhập" (placed/ordered) vs "danh sách đơn nhập hàng" (goods received)**
  
- **State Transitions** (`_detail-dialog.tsx` & `_shared.tsx`):
  - PENDING (initial) → ORDERED (mark as ordered, set expectedDate) → RECEIVED (mark as received, record actualCostPrice)
  - CANCELLED can be applied at any state
  - On RECEIVED: updates product variant `costPrice`, triggers inventory movement

- **DB Schema** (`supplierOrders` table):
  - ✅ `status` (enum: pending, ordered, received, cancelled)
  - ✅ `orderedAt`, `expectedDate`, `receivedAt` timestamps
  - ✅ `actualCostPrice` (recorded on receipt)
  - ✅ `quantity`
  - ⚠️ No tracking: supplier linked but not shown in UI, no purchase price history per receipt

### **GAPS:**
1. **No purchase order report** — "Show me all POs received in Feb, supplier ABC, total qty, avg cost" (for COGS reconciliation)
2. **No supplier performance** — "Supplier X: 5 POs, 3 late, avg lead-time 10 days, cost trend 2% up"
3. **No cost tracking** — Can't report "unit cost by SKU over time" (e.g., ABC variant was $5 in Jan, $4.80 in Feb)
4. **No GRN (goods receipt) report** — "May 1–May 31: received $50k of inventory across 8 POs" (for reconciliation)
5. **Single view, not split** — UI doesn't present "pending orders" vs "ordered awaiting receipt" separately (though states exist)

---

## 4. DB SCHEMA FOR COST & INVENTORY VALUATION — **MOSTLY IN PLACE, SOME GAPS**

### Files to Check:
```
packages/database/src/schema/
  ├── products.ts       — productVariants table
  ├── inventory.ts      — inventoryMovements table
  ├── orders.ts         — orders, orderItems, supplierOrders tables
  └── reports.ts        — dailyReports table (snapshot-based)
```

### What Exists:
✅ **productVariants.costPrice** — stores current cost  
✅ **costPriceHistory** table — tracks cost changes (effectiveDate, who changed it)  
✅ **orderItems.costPriceAtOrderTime** — captures cost at sale time  
✅ **orders.totalCost, profit** — aggregated per order  
✅ **supplierOrders.actualCostPrice** — recorded on receipt  
✅ **inventoryMovements** — tracks quantity changes (audit trail)  
✅ **dailyReports** — snapshot table for daily P&L (exists but not used in UI)

### What's MISSING:
❌ **No inventory value snapshot table** — Can't query "inventory value @ 2026-01-31" for balance sheet  
❌ **No cost allocation by batch/lot** — If same SKU has 50 units @ $5 and 30 units @ $4.80, can't track separately  
❌ **No movement cost capture** — `inventoryMovements` doesn't store the cost of each movement (needed for COGS audit trail)

---

## 5. KEY FILES TO MODIFY/EXTEND

### For Order P&L Report:
```
apps/admin/app/(dashboard)/analytics/
  └── (NEW) orders-plnl/
      ├── page.tsx
      ├── _content.tsx          ← List with filters: date range, customer, status, margin %
      └── _shared.tsx           ← Order P&L row type

packages/database/src/services/
  └── (NEW) order-plnl.server.ts  ← Query: order P&L with grouping/filtering

apps/admin/components/admin/analytics/
  └── (NEW) order-plnl-table.tsx  ← Table: order #, customer, revenue, COGS, profit, margin%
```

### For Inventory Valuation Report:
```
apps/admin/app/(dashboard)/analytics/inventory/
  ├── detail/ (NEW)
  │   ├── page.tsx
  │   └── _content.tsx          ← Inventory value by category, trend, aging

packages/database/src/schema/
  └── inventory.ts (UPDATE)
      ├── ADD: inventoryValueSnapshots table (date, variantId, onHand, costPrice, value)

packages/database/src/services/
  └── (NEW) inventory-valuation.server.ts
      ├── getInventoryValueAsOf(date)
      ├── getInventoryValueByCategory()
      └── getSlowMovingInventory(daysOld)
```

### For Supplier Order / GRN Report:
```
apps/admin/app/(dashboard)/supplier-orders/
  └── reports/ (NEW)
      ├── page.tsx
      ├── _content.tsx          ← Report: received GRNs, filters: date, supplier, status
      └── _shared.tsx

packages/database/src/services/
  └── supplier.server.ts (UPDATE)
      ├── ADD: getSupplierOrdersReport(dateFrom, dateTo, supplierId)
      ├── ADD: getSupplierPerformance(supplierId)
      └── ADD: getCostTrendByVariant(variantId, dateFrom, dateTo)
```

---

## 6. SUMMARY TABLE: WHAT'S MISSING

| Report | Status | Notes |
|--------|--------|-------|
| **Order P&L** | ❌ Missing | Need: per-order breakdown, date range filter, customer filter, margin analysis |
| **Inventory Valuation Trend** | ⚠️ Partial | Have: current valuation ✅; Need: historical snapshots, by-category breakdown |
| **Purchase Order / GRN Report** | ⚠️ Partial | Have: list view ✅; Need: aggregation by supplier, date, cost reconciliation |
| **Supplier Performance** | ❌ Missing | Need: on-time %, lead-time avg, cost trend by supplier |
| **Cost Tracking (by SKU over time)** | ⚠️ Partial | Have: costPriceHistory ✅; Need: UI + report to show cost changes |
| **Inventory Aging** | ❌ Missing | Need: report showing units by age bracket (0-30d, 31-60d, 61-90d, 90d+) |
| **Slow-Moving Inventory** | ❌ Missing | Need: query inventory not sold in N days + value at risk |

---

## 7. DB SCHEMA CHANGES NEEDED

### Option A: Minimal (no breaking changes)
```sql
-- Add inventory value snapshots (for month-end reporting)
CREATE TABLE inventory_value_snapshots (
  id UUID PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  variant_id UUID REFERENCES product_variants(id),
  on_hand INT NOT NULL,
  cost_price DECIMAL(15,2) NOT NULL,
  value DECIMAL(15,2) NOT NULL,  -- on_hand * cost_price
  category_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (snapshot_date, variant_id)
);
```

### Option B: Enhanced (capture cost per movement)
```sql
-- Update inventoryMovements to track cost
ALTER TABLE inventory_movements
  ADD COLUMN cost_price DECIMAL(15,2),
  ADD COLUMN movement_value DECIMAL(15,2);  -- quantity * cost_price at time of movement
```

---

## Conclusions
- ✅ **Order COGS tracking**: DB ready; UI/reporting **missing**
- ✅ **Inventory cost valuation**: Current snapshot ready; **historical tracking missing**
- ⚠️ **Supplier orders**: States well-defined; **aggregation & performance reporting missing**
- ⚠️ **Daily reports**: Table exists (`dailyReports`) but **unused in UI** → good foundation

**Effort to fill gaps:** ~3–4 sprints (order P&L report, inventory snapshots, supplier GRN report)
