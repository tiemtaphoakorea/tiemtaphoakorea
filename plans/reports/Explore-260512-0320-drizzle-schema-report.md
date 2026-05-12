# Drizzle ORM Schema Analysis: Sapo-Style Report System Coverage

**Date:** 2025-05-12 | **Scope:** Complete schema audit for 11 core report categories | **Status:** Schema gaps identified

---

## Executive Summary

The monorepo has a well-structured Drizzle ORM schema covering orders, products, suppliers, payments, and expenses. **COGS is captured at order-item level** (`order_items.cost_price_at_order_time` or fallback to current WAC). Core reporting infrastructure is partially implemented (P&L, customer/supplier debts, cash flow). **Key gaps**: no order-return/refund tables, no fulfillment/shipping tracking, no POS/channel source field, no branch entity table.

---

## 1. SALES BY TIME (Orders, Revenue, Tax, Shipping, Returns, Profit)

### Available Columns

| Metric | Table | Column | Type | Notes |
|--------|-------|--------|------|-------|
| **Order ID** | `orders` | `id` | UUID | Primary key |
| **Order Number** | `orders` | `order_number` | VARCHAR(50) | Unique, customer-facing |
| **Created Date** | `orders` | `created_at` | TIMESTAMP | Index: `idx_orders_created` |
| **Completed Date** | `orders` | `completed_at` | TIMESTAMP | Stock-out completion |
| **Paid Date** | `orders` | `paidAt` | TIMESTAMP | Payment received |
| **Delivered Date** | `orders` | `deliveredAt` | TIMESTAMP | Fulfillment complete |
| **Cancelled Date** | `orders` | `cancelledAt` | TIMESTAMP | Exclusion flag |
| **Subtotal** | `orders` | `subtotal` | DECIMAL(15,2) | Before discount |
| **Discount** | `orders` | `discount` | DECIMAL(15,2) | Line-level discounts applied |
| **Shipping Fee** | `orders` | `shippingFee` | DECIMAL(15,2) | Pass-through (not revenue) |
| **Total Revenue** | `orders` | `total` | DECIMAL(15,2) | Subtotal - Discount + ShippingFee |
| **Total Cost** | `orders` | `totalCost` | DECIMAL(15,2) | COGS aggregate |
| **Profit** | `orders` | `profit` | DECIMAL(15,2) | Revenue - COGS |
| **Line Totals** | `order_items` | `lineTotal` | DECIMAL(15,2) | Per-item revenue |
| **Line Cost** | `order_items` | `lineCost` | DECIMAL(15,2) | Per-item COGS snapshot |
| **Line Profit** | `order_items` | `lineProfit` | DECIMAL(15,2) | Per-item gross profit |

### COGS Calculation (Finance Model)

**Method:** Snapshot + fallback to live WAC
- **Primary source:** `order_items.cost_price_at_order_time` × `quantity` → `order_items.lineCost`
- **Fallback:** If `lineCost` = 0, use `productVariants.costPrice` × `quantity`
- **Historical cost tracking:** `costPriceHistory` table records cost changes with `effectiveDate`
- **Financial stats:** `finance.server.ts` uses `lineCostExpr` SQL to reconstruct COGS per-item
- **Missing cost warning:** Finance API flags items where both `lineCost` AND current `costPrice` are 0/NULL → `missingCostItems` and `missingCostRate` in P&L report

### Tax Handling

**Status:** ⚠️ **NOT CAPTURED** — No tax column on `orders` or `order_items`. No VAT/GST fields.

### Shipping Fee Handling

**Status:** ✓ Captured in `orders.shippingFee`. Not included in revenue (pass-through). Consider splitting reports: "Revenue ex-shipping" vs. "Total cash received."

### Returns Report

**Status:** ❌ **MISSING** — No `order_returns` or `return_items` tables. No refund tracking. Schema would need:
- `order_returns(id, orderId, returnDate, reason, status, refundAmount)`
- `return_items(id, returnId, variantId, quantityReturned, costReversed)`

---

## 2. SALES BY STAFF

### Available Columns

| Metric | Table | Column | FK | Notes |
|--------|-------|--------|----|----|
| **Order Creator** | `orders` | `createdBy` | → `profiles.id` | Staff member who recorded order |
| **Staff Profile** | `profiles` | `id`, `fullName`, `phone`, `role` | N/A | `role` ∈ {owner, admin, manager, staff, customer} |
| **Staff Active Status** | `profiles` | `isActive` | N/A | Filter for active staff |

### Missing

- **Staff assignment at fulfillment time:** No fulfillment table; can't track "who packed" or "who shipped."
- **Staff commission/performance tracking:** No commission fields or incentive tables.

---

## 3. SALES BY PRODUCT / CATEGORY

### Available Columns

| Metric | Table | Column | Notes |
|--------|-------|--------|-------|
| **Product ID** | `products` | `id` | Root product |
| **Product Name** | `products` | `name` | Display name |
| **Product Category** | `products` | `categoryId` | → `categories.id` |
| **Category Name** | `categories` | `name` | Hierarchical (parent_id) |
| **Variant ID** | `product_variants` | `id` | SKU-specific variant |
| **Variant Name** | `product_variants` | `name` | Size, color, etc. |
| **SKU** | `product_variants` | `sku` | Unique, indexed |
| **Unit Price** | `order_items` | `unitPrice` | Sale price at transaction |
| **Base Price** | `product_variants` | `price` | Current catalog price |
| **Cost Price** | `product_variants` | `costPrice` | Current WAC; historical in `costPriceHistory` |
| **Quantity Sold** | `order_items` | `quantity` | Line-item qty |

### Missing

- **Product type/classification** — no "clothing," "electronics" field; only categorical hierarchy.
- **Product status flags** — `isActive`, `isFeatured` exist but no "discontinued," "seasonal," or "promotion_type" fields.

---

## 4. SALES BY CHANNEL / SOURCE

**Status:** ❌ **MISSING** — No channel/source column on `orders`. 

### Current Behavior

Schema has no POS vs. Web vs. Marketplace distinction. All orders treated uniformly.

### Recommendation

Add `orders.source` (ENUM or VARCHAR):
```
ALTER TABLE orders ADD COLUMN source VARCHAR(50) DEFAULT 'web';
-- Values: 'web', 'pos', 'marketplace', 'direct' (optional)
```

---

## 5. SHIPPING / FULFILLMENT REPORT

**Status:** ❌ **MISSING** — No dedicated fulfillment/shipment tables.

### Current Fields on Orders

| Field | Type | Notes |
|-------|------|-------|
| `fulfillmentStatus` | ENUM | {pending, stock_out, completed, cancelled} |
| `stockOutAt` | TIMESTAMP | When stock reserved |
| `shippedAt` | TIMESTAMP | When carrier picked up |
| `deliveredAt` | TIMESTAMP | When customer received |
| `shippingName` | VARCHAR(255) | Recipient name |
| `shippingPhone` | VARCHAR(20) | Recipient phone |
| `shippingAddress` | TEXT | Delivery address |
| `deliveryPreference` | ENUM | {ship_together, ship_available_first} |

### Missing

- **Shipment ID / Tracking number** — no carrier tracking fields.
- **Shipping provider** — no carrier table or method selection.
- **Shipping cost split** — no breakdown (base + surcharge, COD fee).
- **Multi-shipment support** — assumes one shipment per order.
- **Shipment line items** — no `fulfillments` or `shipment_items` table.

### Recommendation

Create `fulfillments` and `shipment_items` tables:
```
CREATE TABLE fulfillments (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,
  tracking_number VARCHAR(100),
  carrier VARCHAR(50),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  status ENUM('pending', 'shipped', 'delivered', 'failed')
);

CREATE TABLE fulfillment_items (
  id UUID PRIMARY KEY,
  fulfillment_id UUID NOT NULL,
  variant_id UUID NOT NULL,
  quantity INTEGER
);
```

---

## 6. RETURNS / REFUNDS REPORT

**Status:** ❌ **COMPLETELY MISSING**

### Current State

- No `order_returns` table
- No `return_items` table
- No `refunds` table
- No return_reason enum
- No refund_method tracking

### Recommendation

Create:
```
CREATE TABLE order_returns (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,
  return_number VARCHAR(50) UNIQUE,
  reason VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected', 'completed'),
  refund_amount DECIMAL(15,2),
  refund_method ENUM('cash', 'bank_transfer', 'card', 'store_credit'),
  refund_date TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE return_items (
  id UUID PRIMARY KEY,
  return_id UUID NOT NULL,
  variant_id UUID NOT NULL,
  quantity_returned INTEGER,
  unit_price DECIMAL(15,2),
  cost_reversed DECIMAL(15,2) -- For COGS adjustment
);
```

---

## 7. ORDER DETAIL REPORT

### Supported Fields (Orders + Line Items)

**From `orders`:**
- Order ID, number, created_at, paid_at, delivered_at, cancelled_at
- Customer ID → profiles.fullName, phone, customerCode
- Order totals: subtotal, discount, shippingFee, total, profit
- Payment/fulfillment status
- Shipping address
- Customer & admin notes

**From `order_items`:**
- Variant ID → SKU, product name, variant name, category
- Unit price, quantity, line_total, line_cost, line_profit
- Cost snapshot: `cost_price_at_order_time`

**From `payments`:**
- Payment ID, amount, method {cash, bank_transfer, card}, createdAt
- Reference code (for bank transfers)

**From `order_status_history`:**
- Status transitions (payment_status, fulfillment_status) with timestamps and creator

### Complete

✓ Sufficient for standard order detail export (CSV, PDF).

---

## 8. PAYMENTS REPORT

### Available Tables & Columns

#### `payments` Table (Customer Payments)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `orderId` | UUID | FK → orders.id |
| `amount` | DECIMAL(15,2) | Payment received |
| `method` | ENUM | {cash, bank_transfer, card} |
| `referenceCode` | VARCHAR(100) | Bank transfer ref |
| `note` | TEXT | Payment notes |
| `createdAt` | TIMESTAMP | Payment date |
| `createdBy` | UUID | Who recorded payment |

#### `supplierPayments` Table (Supplier Payments)

| Column | Type | Notes |
|--------|------|-------|
| `code` | VARCHAR(32) | Unique reference |
| `supplierId` | UUID | FK → suppliers.id |
| `amount` | DECIMAL(15,2) | Amount paid to supplier |
| `method` | ENUM | {cash, bank_transfer, card} |
| `referenceCode` | VARCHAR(100) | Bank transfer ref |
| `paidAt` | TIMESTAMP | Payment date |
| `receiptId` | UUID | Optional FK → goodsReceipts.id |

#### Payment Status Tracking

| Column | Table | Values |
|--------|-------|--------|
| `paymentStatus` | orders | {unpaid, partial, paid} |
| `paymentStatus` | goodsReceipts | {unpaid, partial, paid} |

### Complete

✓ Full customer and supplier payment tracking with method breakdown.

---

## 9. PROFIT / LOSS REPORT

### Implementation Status

✓ **Implemented** in `report.server.ts`:
- Function: `getProfitLossReport(startDate, endDate, compare?)`
- Returns: Period-over-period comparison with delta %
- Metrics:
  - **Sales Revenue** = `orders.subtotal - orders.discount` (excludes shippingFee)
  - **COGS** = SUM(`order_items.lineCost`) with fallback to current `costPrice`
  - **Gross Profit** = Revenue - COGS
  - **Other Expense** = `expenses` table (fixed + variable)
  - **Net Profit** = Gross Profit - Expenses
  - **Missing Cost Rate** = items with 0 cost; warning metric

### COGS Source & Accuracy

- **Snapshot method:** `order_items.cost_price_at_order_time` captured at order creation
- **Fallback:** Live `productVariants.costPrice` (acceptable for recent orders, risky for old)
- **Accuracy concern:** If cost is updated post-sale (e.g., variance, recount), COGS not recalculated retroactively
- **Safeguard:** `missingCostItems` count alerts when COGS may be understated

### Complete

✓ P&L report is production-ready. Dashboard calls `getFinancialStats()` for KPIs.

---

## 10. CUSTOMER DEBTS REPORT

### Implementation Status

✓ **Implemented** in `report.server.ts`:
- Function: `getCustomerDebtsReport(startDate, endDate, search?, page?, limit?, includeZero?)`
- Logic: Opening debt (pre-period orders - pre-period payments) + Increases (period orders) - Decreases (period payments) = Closing debt
- Detail drill-down: `getCustomerDebtTransactions(customerId, startDate, endDate)` lists each transaction

### Available Fields

| Field | Source | Notes |
|-------|--------|-------|
| **Customer ID** | `orders.customerId` → `profiles.id` | |
| **Customer Name** | `profiles.fullName` | |
| **Customer Phone** | `profiles.phone` | |
| **Customer Code** | `profiles.customerCode` | Unique identifier |
| **Opening Debt** | pre-period orders.total - pre-period payments | Computed |
| **Debt Increase** | SUM(orders.total) in period | Excludes cancelled |
| **Debt Decrease** | SUM(payments.amount) in period | From payments table |
| **Closing Debt** | Opening + Increase - Decrease | Computed |

### Complete

✓ Full aging report with transaction-level drill-down.

---

## 11. SUPPLIER DEBTS REPORT

### Implementation Status

✓ **Implemented** in `report.server.ts`:
- Function: `getSupplierDebtsReport(startDate, endDate, search?, page?, limit?, includeZero?)`
- Logic: Opening debt (pre-period receipts payable - pre-period payments) + Increases (period receipt payables) - Decreases (period supplier payments) = Closing debt
- Detail drill-down: `getSupplierDebtTransactions(supplierId, startDate, endDate)` lists each transaction

### Available Fields

| Field | Source | Notes |
|-------|--------|-------|
| **Supplier ID** | `suppliers.id` | |
| **Supplier Code** | `suppliers.code` | NCC001, NCC002, ... |
| **Supplier Name** | `suppliers.name` | |
| **Supplier Phone** | `suppliers.phone` | |
| **Opening Debt** | pre-period receipts.payableAmount - pre-period payments | Computed |
| **Debt Increase** | SUM(goodsReceipts.payableAmount) in period | For completed receipts |
| **Debt Decrease** | SUM(supplierPayments.amount) in period | |
| **Closing Debt** | Opening + Increase - Decrease | Computed |

### Complete

✓ Full aged payables with transaction-level drill-down.

---

## CRITICAL SCHEMA GAPS & MIGRATION RECOMMENDATIONS

| Priority | Gap | Impact | Recommended Table/Column |
|----------|-----|--------|---------------------------|
| **P0** | No order returns | Can't report RMA, refunds, return rate | `order_returns`, `return_items`, `refunds` |
| **P0** | No fulfillment/shipment tracking | Can't report delivery status, shipping delays | `fulfillments`, `fulfillment_items`, carriers table |
| **P0** | No channel/source on orders | Can't filter sales by POS vs. Web vs. Marketplace | `orders.source` (ENUM) |
| **P1** | No tax tracking | Can't report tax collected, tax liability | `orders.tax_amount`, `order_items.tax_amount` |
| **P1** | No branch/store entity | Can't filter multi-location reports | `branches` table + `branchId` FK on orders, receipts, purchases |
| **P1** | No payment reconciliation | Can't match bank imports to payments | `payments.bank_reconciliation_date`, `bank_imports` table |
| **P2** | No cost variance tracking | Can't report recount adjustments | `inventory_adjustments` table (already has `movementTypeEnum: cost_adjustment`) |
| **P2** | No expense category hierarchy | Expense drill-down limited | Add `categoryId` FK to `expenses` table |

---

## ENUMS AVAILABLE FOR FILTERING

| Enum | Values | Used On |
|------|--------|---------|
| `userRoleEnum` | owner, admin, manager, staff, customer | profiles.role |
| `paymentStatusEnum` | unpaid, partial, paid | orders, goodsReceipts |
| `fulfillmentStatusEnum` | pending, stock_out, completed, cancelled | orders |
| `paymentMethodEnum` | cash, bank_transfer, card | payments, supplierPayments |
| `purchaseOrderStatusEnum` | draft, ordered, partial, received, cancelled | purchaseOrders |
| `receiptStatusEnum` | draft, completed, cancelled | goodsReceipts |
| `movementTypeEnum` | stock_out, supplier_receipt, manual_adjustment, cancellation, stock_count_balance, cost_adjustment | inventoryMovements |
| `supplierOrderStatusEnum` | pending, ordered, received, cancelled | supplierOrders |
| `deliveryPreferenceEnum` | ship_together, ship_available_first | orders |
| `expenseTypeEnum` | fixed, variable | expenses |
| `customerTypeEnum` | wholesale, retail | profiles.customerType |

---

## INDEXING FOR REPORT PERFORMANCE

### Well-Indexed Columns (Fast Queries)

✓ `orders.createdAt`, `orders.customerId`, `orders.paymentStatus`, `orders.fulfillmentStatus`
✓ `orderItems.orderId`, `orderItems.variantId`
✓ `payments.orderId`, `payments.method`
✓ `supplierPayments.supplierId`, `supplierPayments.paidAt`
✓ `goodsReceipts.supplierId`, `goodsReceipts.status`
✓ `inventoryMovements.variantId`, `inventoryMovements.createdAt`, `inventoryMovements.type`
✓ `productVariants.productId`, `productVariants.sku`
✓ `purchases.supplierId`, `purchases.status`

### Missing Indexes (Consider Adding)

- `orders(cancelledAt)` — Frequent filter in WHERE clauses for non-cancelled orders
- `payments(createdAt)` — Cash flow period grouping
- `goodsReceipts(createdAt)` — Cash flow period grouping
- `expenses(date)` — Already indexed, OK

---

## CASH FLOW REPORT

### Implementation Status

✓ **Implemented** in `report.server.ts`:
- Function: `getCashFlowReport(startDate, endDate, groupBy?)`
- Grouping: day, week, month
- Returns: Per-period inflow/outflow/net + breakdown (customer payments, supplier payments, expenses)
- Detail: `getCashFlowTransactions(startDate, endDate)` lists all inflows/outflows with party and reference

### Data Sources

**Inflows:**
- `payments.amount` (customer payments) joined to orders, profiles

**Outflows:**
- `supplierPayments.amount` (supplier payments)
- `expenses.amount` (operating expenses)

### Complete

✓ Cash flow report with drill-down to transaction level.

---

## IMMEDIATE ACTION ITEMS FOR COMPREHENSIVE REPORTING

### Phase 1 (MVP Unblocking)
1. Add `orders.source` VARCHAR(50) with values {web, pos, marketplace}
2. Create `order_returns` and `return_items` tables for basic RMA tracking
3. Verify `costPriceHistory` is being populated on cost updates

### Phase 2 (Operational Excellence)
1. Create `fulfillments` and `fulfillment_items` tables + carrier tracking
2. Add `branches` table and `branchId` FK to `orders`, `purchaseOrders`, `goodsReceipts`
3. Add `tax_amount` columns to `orders` and `order_items`
4. Add `categoryId` FK to `expenses` for cost center reporting

### Phase 3 (Advanced Analytics)
1. Create `bank_imports` table for payment reconciliation
2. Add `payment_reconciliation_date` to `payments`
3. Implement inventory adjustment reason hierarchy
4. Add expense approval workflow (status: draft → approved → paid)

---

## CONCLUSION

**Schema Coverage:** 7 of 11 report categories are fully implemented and production-ready (P&L, customer/supplier debts, cash flow, order detail, payments, product sales, staff sales). **Missing:** Returns/refunds, fulfillment/shipping tracking, sales channel attribution, tax, and branch-level segmentation. **Data Quality:** COGS captured at transaction time with fallback logic; `missingCostItems` warning system in place. **Recommendation:** Prioritize Phase 1 migrations (returns, source, cost history validation) before expanding dashboard analytics.

