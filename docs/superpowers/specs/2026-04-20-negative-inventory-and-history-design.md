# Design: Negative Inventory & Inventory History

**Date:** 2026-04-20  
**Status:** Approved

---

## Background

Two related issues with inventory management:

1. The `stockOut()` function throws an error when `onHand < quantity`, preventing fulfillment of orders when physical stock runs out. Admins want to allow negative inventory (backfilling later).
2. There is no inventory movement log. Admins need to see per-day and per-variant stock changes (in/out/closing balance).

---

## Feature 1: Allow Negative Inventory

### Backend

**File:** `packages/database/src/services/order.server.ts`

Remove the hard block in `stockOut()`:

```typescript
// Remove this check:
if ((v.onHand ?? 0) < item.quantity) {
  throw new Error(`Insufficient stock for SKU ${v.sku}: on_hand=${v.onHand}, need=${item.quantity}`);
}
```

`onHand` will be allowed to go negative after stock-out. The system already supports pre-orders and reservations; this change extends that to the physical fulfillment step.

**File:** `packages/database/src/scripts/verify-inventory-invariants.ts`

Remove the "negative on_hand" invariant check, since negative values are now valid.

### UI

No changes. The admin UI already shows:
- Orange "Hết hàng" label on variants with `available <= 0`
- Amber warning "Sắp thiếu hàng, cần nhập thêm X cái" when `quantity > available`

These warnings remain as informational indicators. No blocking behavior is added.

---

## Feature 2: Inventory History

### Schema: `inventory_movements` table

New table in `packages/database/src/schema/`:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `variantId` | uuid FK → product_variants | |
| `type` | enum | `stock_out`, `supplier_receipt`, `manual_adjustment`, `cancellation` |
| `quantity` | integer | Positive = stock in, negative = stock out |
| `onHandBefore` | integer | Snapshot of onHand before this movement |
| `onHandAfter` | integer | Snapshot of onHand after this movement |
| `referenceId` | uuid nullable | Order ID or supplier order ID |
| `note` | text nullable | Admin note for manual adjustments |
| `createdAt` | timestamp | Auto |
| `createdBy` | uuid nullable FK → users | Null for system-triggered events |

### Event hooks

| Trigger | Type | quantity sign |
|---------|------|---------------|
| `stockOut()` completes | `stock_out` | negative (-qty) |
| Supplier order received | `supplier_receipt` | positive (+qty) |
| Admin manual adjustment | `manual_adjustment` | positive or negative |
| Order cancelled after stock-out (future) | `cancellation` | positive (+qty) |

> Order cancellation of **pending** orders (before stock-out) only releases `reserved`, does not change `onHand`, and is NOT recorded in inventory_movements.

### API

New endpoints under `/api/admin/inventory/`:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/movements` | List movements — filters: date range, variantId, type |
| GET | `/movements/daily-summary` | Aggregate by date: total in, total out, closing balance |
| POST | `/movements/adjust` | Create manual adjustment movement |

### UI

**New page: `/inventory/history`**

Two tabs:
- **Giao dịch** (Transactions): Paginated list of all movements. Columns: date/time, variant, type badge, quantity (+/-), onHand before/after, reference (order/supplier link), note.
- **Tổng hợp theo ngày** (Daily Summary): Table grouped by date. Columns: date, total received, total shipped, closing balance. Filterable by variant.

**Product detail page** (existing): Add a "Lịch sử kho" section under variant details, showing movements for that specific variant only.

---

## Out of scope

- Reversing a stock-out (return goods after fulfillment) — deferred
- Inventory snapshots at end of day (can be derived from `onHandAfter` of last movement per day)
- Stock reconciliation workflow
