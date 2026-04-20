# Invoice Management Foundation (Spec 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure order status into 2 independent dimensions (payment + fulfillment), introduce `on_hand`/`reserved` inventory model, add per-customer debt tracking.

**Architecture:** Split `order.status` → `payment_status` + `fulfillment_status`. Inventory becomes `on_hand` (physical) + `reserved` (held by pending orders), with `available = on_hand - reserved`. Stock is deducted from `on_hand` at `stock_out` time, not at order creation. New `/debts` UI aggregates unpaid orders per customer.

**Tech Stack:** TypeScript, Next.js 16 (App Router), Drizzle ORM + PostgreSQL, TanStack Query, Vitest.

**Spec reference:** `docs/superpowers/specs/2026-04-20-invoice-management-redesign-design.md`

---

## Ordering

Tasks 1-5 (schema + migration) must run in order. Tasks 6-11 (server logic) can start after Task 5. Tasks 12-18 (UI) require the server logic. Task 19 (final verification) runs last.

Each task ends with a commit. Use Conventional Commits.

---

## Phase 1 — Schema + Migration

### Task 1: Add new enums

**Files:**
- Modify: `packages/database/src/schema/enums.ts`

- [ ] **Step 1: Add enums**

Append to `packages/database/src/schema/enums.ts`:

```ts
export const paymentStatusEnum = pgEnum("payment_status", ["unpaid", "partial", "paid"]);
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];

export const fulfillmentStatusEnum = pgEnum("fulfillment_status", [
  "pending",
  "stock_out",
  "completed",
  "cancelled",
]);
export type FulfillmentStatus = (typeof fulfillmentStatusEnum.enumValues)[number];
```

Keep existing `orderStatusEnum` for now — it will be dropped in Task 5.

- [ ] **Step 2: Commit**

```bash
git add packages/database/src/schema/enums.ts
git commit -m "feat(db): add payment_status and fulfillment_status enums"
```

---

### Task 2: Update schema columns

**Files:**
- Modify: `packages/database/src/schema/orders.ts`
- Modify: `packages/database/src/schema/products.ts`

- [ ] **Step 1: Update `orders` table**

In `packages/database/src/schema/orders.ts`:

- Add import: `paymentStatusEnum, fulfillmentStatusEnum` from `./enums`.
- Inside `orders` table definition (after line 29 `status`), add:

```ts
paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status").notNull().default("pending"),
stockOutAt: timestamp("stock_out_at"),
completedAt: timestamp("completed_at"),
```

Keep `status` column temporarily (will be dropped in Task 5 after backfill).

Add indexes inside `(table) => { return [...] }`:

```ts
index("idx_orders_payment_status").on(table.paymentStatus),
index("idx_orders_fulfillment_status").on(table.fulfillmentStatus),
index("idx_orders_stock_out_at").on(table.stockOutAt),
```

Remove `index("idx_orders_status")` (old status index — will drop with column).

- [ ] **Step 2: Update `order_status_history` table**

In the same file, replace the `status` column in `orderStatusHistory` (line 112) with both statuses:

```ts
export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    paymentStatus: paymentStatusEnum("payment_status").notNull(),
    fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status").notNull(),
    note: text("note"),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return [index("idx_status_history_order").on(table.orderId)];
  },
);
```

- [ ] **Step 3: Update `product_variants` table**

In `packages/database/src/schema/products.ts`, replace `stockQuantity` (line 51) with:

```ts
onHand: integer("on_hand").notNull().default(0),
reserved: integer("reserved").notNull().default(0),
```

- [ ] **Step 4: Generate Drizzle migration**

Run:

```bash
cd packages/database && pnpm drizzle-kit generate
```

Drizzle will generate a migration file like `drizzle/0006_*.sql` that contains the raw DDL. DO NOT run it yet — we need to hand-edit it to include data backfill (Task 3).

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/schema/ packages/database/drizzle/
git commit -m "feat(db): schema changes for payment/fulfillment split and inventory model"
```

---

### Task 3: Hand-edit migration to backfill data

**Files:**
- Modify: `packages/database/drizzle/0006_<name>.sql` (created by Task 2)

- [ ] **Step 1: Identify the generated migration file**

```bash
ls packages/database/drizzle/0006_*.sql
```

- [ ] **Step 2: Rewrite migration as a single transaction with backfill**

Replace the generated file's contents with the following (preserving whatever name Drizzle used for the file). The migration MUST run inside an implicit transaction (Drizzle runs each migration file in a transaction by default):

```sql
-- Phase 1: create new enums
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'partial', 'paid');--> statement-breakpoint
CREATE TYPE "public"."fulfillment_status" AS ENUM('pending', 'stock_out', 'completed', 'cancelled');--> statement-breakpoint

-- Phase 2: add new columns (nullable/defaulted initially so existing rows don't break)
ALTER TABLE "orders" ADD COLUMN "payment_status" "payment_status";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fulfillment_status" "fulfillment_status";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "stock_out_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint

ALTER TABLE "product_variants" RENAME COLUMN "stock_quantity" TO "on_hand";--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "on_hand" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "on_hand" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "reserved" integer NOT NULL DEFAULT 0;--> statement-breakpoint

-- Phase 3: backfill orders
UPDATE "orders" SET
  "payment_status" = CASE
    WHEN COALESCE("paid_amount", '0')::numeric = 0 THEN 'unpaid'::payment_status
    WHEN COALESCE("paid_amount", '0')::numeric < "total"::numeric THEN 'partial'::payment_status
    ELSE 'paid'::payment_status
  END,
  "fulfillment_status" = CASE "status"
    WHEN 'pending'    THEN 'pending'::fulfillment_status
    WHEN 'paid'       THEN 'pending'::fulfillment_status
    WHEN 'preparing'  THEN 'pending'::fulfillment_status
    WHEN 'shipping'   THEN 'stock_out'::fulfillment_status
    WHEN 'delivered'  THEN (CASE WHEN COALESCE("paid_amount", '0')::numeric >= "total"::numeric THEN 'completed'::fulfillment_status ELSE 'stock_out'::fulfillment_status END)
    WHEN 'cancelled'  THEN 'cancelled'::fulfillment_status
  END,
  "stock_out_at" = CASE WHEN "status" IN ('shipping', 'delivered') THEN COALESCE("shipped_at", "updated_at") END,
  "completed_at" = CASE WHEN "status" = 'delivered' AND COALESCE("paid_amount", '0')::numeric >= "total"::numeric THEN COALESCE("delivered_at", "updated_at") END;
--> statement-breakpoint

-- Phase 4: stock correction — old logic deducted on_hand at order creation.
-- Undo that for orders now in fulfillment_status='pending': add qty back to on_hand, set reserved.
WITH pending_qty AS (
  SELECT oi.variant_id, SUM(oi.quantity)::int AS qty
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.fulfillment_status = 'pending'
  GROUP BY oi.variant_id
)
UPDATE product_variants pv
SET on_hand = pv.on_hand + pq.qty, reserved = pq.qty
FROM pending_qty pq
WHERE pv.id = pq.variant_id;
--> statement-breakpoint

-- Phase 5: backfill order_status_history.
ALTER TABLE "order_status_history" ADD COLUMN "payment_status" "payment_status";--> statement-breakpoint
ALTER TABLE "order_status_history" ADD COLUMN "fulfillment_status" "fulfillment_status";--> statement-breakpoint

-- Best-effort mapping of old single status → (payment_status, fulfillment_status) snapshot
UPDATE "order_status_history" SET
  "payment_status" = CASE "status"
    WHEN 'pending'   THEN 'unpaid'::payment_status
    WHEN 'paid'      THEN 'paid'::payment_status
    WHEN 'preparing' THEN 'unpaid'::payment_status
    WHEN 'shipping'  THEN 'unpaid'::payment_status
    WHEN 'delivered' THEN 'paid'::payment_status
    WHEN 'cancelled' THEN 'unpaid'::payment_status
  END,
  "fulfillment_status" = CASE "status"
    WHEN 'pending'   THEN 'pending'::fulfillment_status
    WHEN 'paid'      THEN 'pending'::fulfillment_status
    WHEN 'preparing' THEN 'pending'::fulfillment_status
    WHEN 'shipping'  THEN 'stock_out'::fulfillment_status
    WHEN 'delivered' THEN 'completed'::fulfillment_status
    WHEN 'cancelled' THEN 'cancelled'::fulfillment_status
  END;
--> statement-breakpoint
```

(Task 5 will finalize: SET NOT NULL on the new history columns, drop `orders.status`, drop `order_status_history.status`, drop `order_status` enum, add CHECK constraints.)

- [ ] **Step 3: Commit**

```bash
git add packages/database/drizzle/0006_*.sql
git commit -m "feat(db): migration to backfill payment/fulfillment status and reserved stock"
```

---

### Task 4: Run migration on local dev DB and verify

**Files:** none (runtime verification)

- [ ] **Step 1: Backup local DB (safety)**

```bash
docker compose exec postgres pg_dump -U postgres -d shop_dev > /tmp/shop_dev_pre_spec1.sql
```

(Use the DB name and user from `docker-compose.yml` — adjust if different.)

- [ ] **Step 2: Run migration**

```bash
cd packages/database && pnpm drizzle-kit migrate
```

Expected: `0006_*.sql` applied, no errors.

- [ ] **Step 3: Run verify queries**

Connect to the DB and run:

```sql
-- Should be 0
SELECT COUNT(*) AS negative_on_hand FROM product_variants WHERE on_hand < 0;

-- Should be empty (rows where reserved doesn't match pending orders' quantities)
SELECT pv.id, pv.reserved, COALESCE(SUM(oi.quantity), 0) AS expected
FROM product_variants pv
LEFT JOIN order_items oi ON oi.variant_id = pv.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.fulfillment_status = 'pending'
GROUP BY pv.id, pv.reserved
HAVING pv.reserved != COALESCE(SUM(oi.quantity), 0);

-- All orders have both statuses set
SELECT COUNT(*) AS null_statuses FROM orders WHERE payment_status IS NULL OR fulfillment_status IS NULL;

-- completed orders are fully paid
SELECT COUNT(*) AS invalid FROM orders WHERE fulfillment_status = 'completed' AND COALESCE(paid_amount, '0')::numeric < total::numeric;
```

Expected: `negative_on_hand = 0`, reserved mismatch = empty, null_statuses = 0, invalid = 0.

If any fails: roll back (`psql ... < /tmp/shop_dev_pre_spec1.sql`), debug the migration, re-run.

- [ ] **Step 4: Commit nothing (verification only)**

No commit — this task is a runtime gate.

---

### Task 5: Finalize migration (drop old column, add CHECKs)

**Files:**
- Create: `packages/database/drizzle/0007_<name>.sql` (new migration)
- Modify: `packages/database/src/schema/orders.ts` — remove old `status` column + `orderStatusEnum` import.

- [ ] **Step 1: Remove old columns from schema**

In `packages/database/src/schema/orders.ts`:
- Remove the `status: orderStatusEnum("status").default("pending"),` line from `orders`.
- Remove `orderStatusEnum` from imports.

In `packages/database/src/schema/enums.ts`:
- Delete `orderStatusEnum` export.

- [ ] **Step 2: Generate next migration**

```bash
cd packages/database && pnpm drizzle-kit generate
```

This should produce `0007_*.sql` that drops `orders.status`, `order_status_history.status`, and `order_status` enum.

- [ ] **Step 3: Hand-edit to add CHECK constraints and NOT NULL**

Append to the generated `0007_*.sql`:

```sql
ALTER TABLE "order_status_history" ALTER COLUMN "payment_status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_status_history" ALTER COLUMN "fulfillment_status" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "product_variants" ADD CONSTRAINT "on_hand_non_negative" CHECK ("on_hand" >= 0);--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "reserved_non_negative" CHECK ("reserved" >= 0);--> statement-breakpoint

ALTER TABLE "orders" ADD CONSTRAINT "completed_requires_paid" CHECK (
  "fulfillment_status" != 'completed' OR "payment_status" = 'paid'
);--> statement-breakpoint

ALTER TABLE "orders" ADD CONSTRAINT "stock_out_at_consistency" CHECK (
  ("fulfillment_status" IN ('stock_out', 'completed')) = ("stock_out_at" IS NOT NULL)
);--> statement-breakpoint

ALTER TABLE "orders" ADD CONSTRAINT "completed_at_consistency" CHECK (
  ("fulfillment_status" = 'completed') = ("completed_at" IS NOT NULL)
);--> statement-breakpoint
```

- [ ] **Step 4: Run migration and re-verify**

```bash
cd packages/database && pnpm drizzle-kit migrate
```

Re-run verify queries from Task 4 Step 3. All should still pass.

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/schema/ packages/database/drizzle/
git commit -m "feat(db): finalize migration — drop old status, add CHECK constraints"
```

---

## Phase 2 — Server Logic

### Task 6: Add constants and types for new statuses

**Files:**
- Modify: `packages/database/src/constants/order.ts` (or wherever `ORDER_STATUS` lives — locate first)

- [ ] **Step 1: Locate existing constants file**

Search for where `ORDER_STATUS.PENDING` is defined:

```bash
grep -rn "ORDER_STATUS\s*=" packages/database/src/
```

Likely `packages/database/src/constants/order.ts` or `packages/database/src/schema/enums.ts`.

- [ ] **Step 2: Add new constant objects**

Add in the same file:

```ts
export const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PARTIAL: "partial",
  PAID: "paid",
} as const;

export const FULFILLMENT_STATUS = {
  PENDING: "pending",
  STOCK_OUT: "stock_out",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type PaymentStatusValue = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export type FulfillmentStatusValue = (typeof FULFILLMENT_STATUS)[keyof typeof FULFILLMENT_STATUS];
```

- [ ] **Step 3: Commit**

```bash
git add packages/database/src/constants/
git commit -m "feat(db): add PAYMENT_STATUS and FULFILLMENT_STATUS constants"
```

---

### Task 7: Refactor `createOrder` — reserve instead of deduct

**Files:**
- Modify: `packages/database/src/services/order.server.ts` (lines 217-286 region)
- Test: `tests/unit/services/order.createOrder.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/services/order.createOrder.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@workspace/database/client";
import { orders, orderItems, productVariants } from "@workspace/database/schema";
import { createOrder } from "@workspace/database/services/order.server";
import { eq } from "drizzle-orm";
import { seedOrderTest, cleanOrderTest, type OrderTestFixture } from "./fixtures";

describe("createOrder (reserve model)", () => {
  let fx: OrderTestFixture;
  beforeEach(async () => { fx = await seedOrderTest(); });
  afterEach(async () => { await cleanOrderTest(fx); });

  it("reserves stock without changing on_hand", async () => {
    const before = await db.select().from(productVariants).where(eq(productVariants.id, fx.variantId));
    const onHandBefore = before[0].onHand;
    const reservedBefore = before[0].reserved;

    await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 3 }],
    });

    const after = await db.select().from(productVariants).where(eq(productVariants.id, fx.variantId));
    expect(after[0].onHand).toBe(onHandBefore); // unchanged
    expect(after[0].reserved).toBe(reservedBefore + 3); // increased
  });

  it("sets new order fulfillment_status='pending' and payment_status='unpaid'", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });
    const [row] = await db.select().from(orders).where(eq(orders.id, order.id));
    expect(row.fulfillmentStatus).toBe("pending");
    expect(row.paymentStatus).toBe("unpaid");
  });

  it("allows oversell (reserved can exceed on_hand)", async () => {
    // stock_on_hand fixture = 5
    const { order } = await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 10 }],
    });
    expect(order).toBeDefined();
    const [v] = await db.select().from(productVariants).where(eq(productVariants.id, fx.variantId));
    expect(v.onHand).toBe(5); // physical unchanged
    expect(v.reserved).toBe(10); // reserved exceeds on_hand
  });
});
```

Create `tests/unit/services/fixtures.ts` (if not existing) with a `seedOrderTest` that creates a product variant with `onHand: 5, reserved: 0`, a test customer profile, and a test admin user. Use `truncate` for cleanup.

- [ ] **Step 2: Run the test; confirm failure**

```bash
pnpm vitest run tests/unit/services/order.createOrder.test.ts
```

Expected: fails because `createOrder` currently deducts `on_hand` instead of incrementing `reserved`.

- [ ] **Step 3: Update `createOrder` implementation**

In `packages/database/src/services/order.server.ts` around line 218-286:

Replace the order insert and stock-deduction block:

```ts
// Create Order
const [newOrder] = await tx
  .insert(orders)
  .values({
    orderNumber,
    customerId: resolvedCustomerId,
    paymentStatus: PAYMENT_STATUS.UNPAID,
    fulfillmentStatus: FULFILLMENT_STATUS.PENDING,
    subtotal: subtotal.toString(),
    total: total.toString(),
    totalCost: totalCost.toString(),
    profit: profit.toString(),
    adminNote: data.note,
    createdBy: data.userId,
    deliveryPreference,
  })
  .returning();

// Process Items: increment reserved (NOT on_hand). Report shortage for supplier.
const itemsNeedingStock: Array<{
  sku: string;
  name: string;
  quantityToOrder: number;
  variantId: string;
}> = [];

for (const item of data.items) {
  const variant = variantMap.get(item.variantId)!;
  const available = (variant.onHand ?? 0) - (variant.reserved ?? 0);
  const quantityNeedsSupplier = Math.max(0, item.quantity - available);

  await tx
    .update(productVariants)
    .set({
      reserved: sql`${productVariants.reserved} + ${item.quantity}`,
    })
    .where(eq(productVariants.id, variant.id));

  if (quantityNeedsSupplier > 0) {
    itemsNeedingStock.push({
      sku: variant.sku,
      name: variant.name,
      quantityToOrder: quantityNeedsSupplier,
      variantId: variant.id,
    });
  }

  const unitPrice = item.customPrice ?? Number(variant.price);
  await tx.insert(orderItems).values({
    orderId: newOrder.id,
    variantId: variant.id,
    productName: variant.name,
    variantName: variant.name,
    sku: variant.sku,
    quantity: item.quantity,
    unitPrice: unitPrice.toString(),
    costPriceAtOrderTime: variant.costPrice,
    lineTotal: (unitPrice * item.quantity).toString(),
    lineCost: (Number(variant.costPrice || 0) * item.quantity).toString(),
    lineProfit: ((unitPrice - Number(variant.costPrice || 0)) * item.quantity).toString(),
  });
}

// Create Status History snapshot
await tx.insert(orderStatusHistory).values({
  orderId: newOrder.id,
  paymentStatus: PAYMENT_STATUS.UNPAID,
  fulfillmentStatus: FULFILLMENT_STATUS.PENDING,
  note: "Order created by admin",
  createdBy: data.userId,
});
```

Replace all remaining references to `variant.stockQuantity` inside this function with `variant.onHand`.

- [ ] **Step 4: Run test**

```bash
pnpm vitest run tests/unit/services/order.createOrder.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/services/order.server.ts tests/unit/services/
git commit -m "feat(orders): reserve stock at order creation instead of deducting on_hand"
```

---

### Task 8: New `stockOut` action

**Files:**
- Modify: `packages/database/src/services/order.server.ts` (add new exported function)
- Test: `tests/unit/services/order.stockOut.test.ts`
- Create: `apps/admin/app/api/admin/orders/[id]/stock-out/route.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/services/order.stockOut.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@workspace/database/client";
import { orders, productVariants } from "@workspace/database/schema";
import { createOrder, stockOut } from "@workspace/database/services/order.server";
import { eq } from "drizzle-orm";
import { seedOrderTest, cleanOrderTest, type OrderTestFixture } from "./fixtures";

describe("stockOut", () => {
  let fx: OrderTestFixture;
  beforeEach(async () => { fx = await seedOrderTest(); });
  afterEach(async () => { await cleanOrderTest(fx); });

  it("deducts on_hand, decrements reserved, sets stock_out_at, sets fulfillment_status", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId, userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 3 }],
    });

    await stockOut({ orderId: order.id, userId: fx.userId });

    const [row] = await db.select().from(orders).where(eq(orders.id, order.id));
    expect(row.fulfillmentStatus).toBe("stock_out");
    expect(row.stockOutAt).toBeTruthy();

    const [v] = await db.select().from(productVariants).where(eq(productVariants.id, fx.variantId));
    expect(v.onHand).toBe(5 - 3);
    expect(v.reserved).toBe(0);
  });

  it("rejects when on_hand < qty for any item", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId, userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 10 }], // oversell
    });
    await expect(stockOut({ orderId: order.id, userId: fx.userId }))
      .rejects.toThrow(/insufficient/i);

    const [row] = await db.select().from(orders).where(eq(orders.id, order.id));
    expect(row.fulfillmentStatus).toBe("pending"); // unchanged on failure
  });

  it("rejects if order is already stock_out", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId, userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });
    await stockOut({ orderId: order.id, userId: fx.userId });
    await expect(stockOut({ orderId: order.id, userId: fx.userId }))
      .rejects.toThrow(/invalid transition/i);
  });

  it("rejects if order is cancelled", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId, userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });
    await cancelOrder({ orderId: order.id, userId: fx.userId });
    await expect(stockOut({ orderId: order.id, userId: fx.userId }))
      .rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run tests; confirm failure**

```bash
pnpm vitest run tests/unit/services/order.stockOut.test.ts
```

Expected: fails (`stockOut` is not exported).

- [ ] **Step 3: Implement `stockOut` in `order.server.ts`**

Add to `packages/database/src/services/order.server.ts`:

```ts
export async function stockOut({
  orderId,
  userId,
  note,
}: {
  orderId: string;
  userId: string;
  note?: string;
}) {
  return await db.transaction(async (tx: DbTransaction) => {
    const lockedOrder = await lockOrderForUpdate(tx, orderId);
    if (!lockedOrder) throw new Error(ERROR_MESSAGE.ORDER.NOT_FOUND);

    if (lockedOrder.fulfillmentStatus !== FULFILLMENT_STATUS.PENDING) {
      throw new Error(`Invalid transition: cannot stock_out from ${lockedOrder.fulfillmentStatus}`);
    }

    const items = await tx
      .select({ quantity: orderItems.quantity, variantId: orderItems.variantId })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    if (items.length === 0) throw new Error("Order has no items");

    const variantIds = items.map((i) => i.variantId);
    const variants = await lockVariantsForUpdate(tx, variantIds);
    const byId = new Map(variants.map((v) => [v.id, v]));

    // Validate on_hand >= qty for every item
    for (const item of items) {
      const v = byId.get(item.variantId);
      if (!v) throw new Error(`Variant ${item.variantId} missing`);
      if ((v.onHand ?? 0) < item.quantity) {
        throw new Error(
          `Insufficient stock for SKU ${v.sku}: on_hand=${v.onHand}, need=${item.quantity}`,
        );
      }
    }

    // Deduct on_hand and reserved atomically
    for (const item of items) {
      await tx
        .update(productVariants)
        .set({
          onHand: sql`${productVariants.onHand} - ${item.quantity}`,
          reserved: sql`${productVariants.reserved} - ${item.quantity}`,
        })
        .where(eq(productVariants.id, item.variantId));
    }

    const now = new Date();
    const [updated] = await tx
      .update(orders)
      .set({ fulfillmentStatus: FULFILLMENT_STATUS.STOCK_OUT, stockOutAt: now, updatedAt: now })
      .where(eq(orders.id, orderId))
      .returning();

    await tx.insert(orderStatusHistory).values({
      orderId,
      paymentStatus: updated.paymentStatus,
      fulfillmentStatus: FULFILLMENT_STATUS.STOCK_OUT,
      note: note ?? "Stock out",
      createdBy: userId,
    });

    return updated;
  });
}
```

Add imports as needed (`lockVariantsForUpdate`, `sql`, constants).

- [ ] **Step 4: Run tests**

```bash
pnpm vitest run tests/unit/services/order.stockOut.test.ts
```

Expected: PASS.

- [ ] **Step 5: Create API route**

Create `apps/admin/app/api/admin/orders/[id]/stock-out/route.ts`:

```ts
import { NextResponse } from "next/server";
import { stockOut } from "@workspace/database/services/order.server";
import { getAuthenticatedAdmin } from "@/lib/auth.server"; // adapt to existing auth helper

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const order = await stockOut({ orderId: id, userId: admin.id });
    return NextResponse.json({ order });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
```

Match the exact auth helper used by `apps/admin/app/api/admin/orders/[id]/payments/route.ts` — copy that pattern.

- [ ] **Step 6: Commit**

```bash
git add packages/database/src/services/order.server.ts tests/unit/services/ apps/admin/app/api/admin/orders/
git commit -m "feat(orders): add stockOut action with on_hand/reserved deduction"
```

---

### Task 9: New `completeOrder` action

**Files:**
- Modify: `packages/database/src/services/order.server.ts`
- Test: `tests/unit/services/order.completeOrder.test.ts`
- Create: `apps/admin/app/api/admin/orders/[id]/complete/route.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/services/order.completeOrder.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@workspace/database/client";
import { orders } from "@workspace/database/schema";
import {
  createOrder, stockOut, completeOrder, recordPayment,
} from "@workspace/database/services/order.server";
import { eq } from "drizzle-orm";
import { seedOrderTest, cleanOrderTest, type OrderTestFixture } from "./fixtures";

describe("completeOrder", () => {
  let fx: OrderTestFixture;
  beforeEach(async () => { fx = await seedOrderTest(); });
  afterEach(async () => { await cleanOrderTest(fx); });

  it("rejects when payment_status is not paid", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId, userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });
    await stockOut({ orderId: order.id, userId: fx.userId });
    await expect(completeOrder({ orderId: order.id, userId: fx.userId }))
      .rejects.toThrow(/not fully paid|payment/i);
  });

  it("rejects when fulfillment is still pending", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId, userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });
    // payment full but not stock_out yet
    const [row] = await db.select().from(orders).where(eq(orders.id, order.id));
    await recordPayment({
      orderId: order.id, userId: fx.userId, amount: Number(row.total),
      method: "cash",
    });
    await expect(completeOrder({ orderId: order.id, userId: fx.userId }))
      .rejects.toThrow(/invalid transition/i);
  });

  it("succeeds when stock_out + paid; sets completed_at", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId, userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });
    await stockOut({ orderId: order.id, userId: fx.userId });
    const [row] = await db.select().from(orders).where(eq(orders.id, order.id));
    await recordPayment({
      orderId: order.id, userId: fx.userId, amount: Number(row.total),
      method: "cash",
    });
    const result = await completeOrder({ orderId: order.id, userId: fx.userId });
    expect(result.fulfillmentStatus).toBe("completed");
    expect(result.completedAt).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests; confirm failure**

```bash
pnpm vitest run tests/unit/services/order.completeOrder.test.ts
```

Expected: fails (function not exported).

- [ ] **Step 3: Implement `completeOrder`**

Add to `order.server.ts`:

```ts
export async function completeOrder({
  orderId,
  userId,
  note,
}: {
  orderId: string;
  userId: string;
  note?: string;
}) {
  return await db.transaction(async (tx: DbTransaction) => {
    const locked = await lockOrderForUpdate(tx, orderId);
    if (!locked) throw new Error(ERROR_MESSAGE.ORDER.NOT_FOUND);

    if (locked.fulfillmentStatus !== FULFILLMENT_STATUS.STOCK_OUT) {
      throw new Error(`Invalid transition: cannot complete from ${locked.fulfillmentStatus}`);
    }
    if (locked.paymentStatus !== PAYMENT_STATUS.PAID) {
      throw new Error("Order is not fully paid; cannot complete");
    }

    const now = new Date();
    const [updated] = await tx
      .update(orders)
      .set({ fulfillmentStatus: FULFILLMENT_STATUS.COMPLETED, completedAt: now, updatedAt: now })
      .where(eq(orders.id, orderId))
      .returning();

    await tx.insert(orderStatusHistory).values({
      orderId,
      paymentStatus: updated.paymentStatus,
      fulfillmentStatus: FULFILLMENT_STATUS.COMPLETED,
      note: note ?? "Order completed",
      createdBy: userId,
    });

    return updated;
  });
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm vitest run tests/unit/services/order.completeOrder.test.ts
```

Expected: PASS.

- [ ] **Step 5: Create API route `/orders/[id]/complete`**

`apps/admin/app/api/admin/orders/[id]/complete/route.ts` — same pattern as stock-out (Task 8 Step 5), but calls `completeOrder`.

- [ ] **Step 6: Commit**

```bash
git add packages/database/src/services/order.server.ts tests/unit/services/ apps/admin/app/api/admin/orders/
git commit -m "feat(orders): add completeOrder action (requires paid + stock_out)"
```

---

### Task 10: Update `cancelOrder` — restrict to pending, return `reserved`

**Files:**
- Modify: `packages/database/src/services/order.server.ts` (`updateOrderStatus` line 304-392 is the old cancel path — replace it with a new `cancelOrder`)
- Test: `tests/unit/services/order.cancelOrder.test.ts`
- Modify: `apps/admin/app/api/admin/orders/[id]/status/route.ts` (was used for status changes; update or deprecate)

- [ ] **Step 1: Write failing tests**

Create `tests/unit/services/order.cancelOrder.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@workspace/database/client";
import { orders, productVariants } from "@workspace/database/schema";
import {
  createOrder, stockOut, cancelOrder,
} from "@workspace/database/services/order.server";
import { eq } from "drizzle-orm";
import { seedOrderTest, cleanOrderTest, type OrderTestFixture } from "./fixtures";

describe("cancelOrder", () => {
  let fx: OrderTestFixture;
  beforeEach(async () => { fx = await seedOrderTest(); });
  afterEach(async () => { await cleanOrderTest(fx); });

  it("cancels a pending order and returns reserved", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId, userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 2 }],
    });
    await cancelOrder({ orderId: order.id, userId: fx.userId });
    const [v] = await db.select().from(productVariants).where(eq(productVariants.id, fx.variantId));
    expect(v.onHand).toBe(5); // unchanged
    expect(v.reserved).toBe(0); // returned
    const [o] = await db.select().from(orders).where(eq(orders.id, order.id));
    expect(o.fulfillmentStatus).toBe("cancelled");
  });

  it("rejects cancelling after stock_out", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId, userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });
    await stockOut({ orderId: order.id, userId: fx.userId });
    await expect(cancelOrder({ orderId: order.id, userId: fx.userId }))
      .rejects.toThrow(/cannot cancel after stock_out/i);
  });
});
```

- [ ] **Step 2: Run tests; confirm failure**

```bash
pnpm vitest run tests/unit/services/order.cancelOrder.test.ts
```

- [ ] **Step 3: Implement `cancelOrder`**

Add to `order.server.ts` (and remove the CANCELLED branch from `updateOrderStatus`):

```ts
export async function cancelOrder({
  orderId,
  userId,
  note,
}: {
  orderId: string;
  userId: string;
  note?: string;
}) {
  return await db.transaction(async (tx: DbTransaction) => {
    const locked = await lockOrderForUpdate(tx, orderId);
    if (!locked) throw new Error(ERROR_MESSAGE.ORDER.NOT_FOUND);

    if (locked.fulfillmentStatus !== FULFILLMENT_STATUS.PENDING) {
      throw new Error(
        `Cannot cancel after stock_out. Use return_order instead (not yet available in Spec 1).`,
      );
    }

    const items = await tx
      .select({ quantity: orderItems.quantity, variantId: orderItems.variantId })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const variantIds = items.map((i) => i.variantId);
    if (variantIds.length > 0) {
      await lockVariantsForUpdate(tx, variantIds);
      for (const item of items) {
        await tx
          .update(productVariants)
          .set({ reserved: sql`${productVariants.reserved} - ${item.quantity}` })
          .where(eq(productVariants.id, item.variantId));
      }
    }

    const now = new Date();
    const [updated] = await tx
      .update(orders)
      .set({ fulfillmentStatus: FULFILLMENT_STATUS.CANCELLED, cancelledAt: now, updatedAt: now })
      .where(eq(orders.id, orderId))
      .returning();

    await tx.insert(orderStatusHistory).values({
      orderId,
      paymentStatus: updated.paymentStatus,
      fulfillmentStatus: FULFILLMENT_STATUS.CANCELLED,
      note: note ?? "Order cancelled",
      createdBy: userId,
    });

    // Cancel linked supplier orders (pattern from old updateOrderStatus)
    await tx
      .update(supplierOrders)
      .set({ status: SUPPLIER_ORDER_STATUS.CANCELLED, updatedAt: now })
      .where(ilike(supplierOrders.note, `%${locked.orderNumber}%`));

    return updated;
  });
}
```

Remove the `updateOrderStatus` export — search callers with `grep -rn "updateOrderStatus" apps/ packages/` and update each call site to `stockOut` / `completeOrder` / `cancelOrder` as appropriate. The main caller is `apps/admin/app/api/admin/orders/[id]/status/route.ts` — replace this single PATCH route with three POST routes (`/stock-out`, `/complete`, `/cancel`) already created in Tasks 8, 9, and this task.

- [ ] **Step 4: Run tests**

```bash
pnpm vitest run tests/unit/services/order.cancelOrder.test.ts
```

Expected: PASS.

- [ ] **Step 5: Update existing API route**

In `apps/admin/app/api/admin/orders/[id]/status/route.ts`, route the old `PATCH` calls to the new specific actions based on the target status, OR deprecate it in favor of the new `/stock-out`, `/complete`, `/cancel` routes. Create `apps/admin/app/api/admin/orders/[id]/cancel/route.ts` following the same pattern as Task 8 Step 5.

- [ ] **Step 6: Commit**

```bash
git add packages/database/src/services/order.server.ts tests/unit/services/ apps/admin/app/api/admin/orders/
git commit -m "feat(orders): cancelOrder returns reserved; blocks cancel after stock_out"
```

---

### Task 11: Update `recordPayment` — compute `payment_status`, add guards

**Files:**
- Modify: `packages/database/src/services/order.server.ts` (lines 788-874, `recordPayment`)
- Test: `tests/unit/services/order.recordPayment.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/services/order.recordPayment.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@workspace/database/client";
import { orders } from "@workspace/database/schema";
import {
  createOrder, recordPayment, cancelOrder, stockOut, completeOrder,
} from "@workspace/database/services/order.server";
import { eq } from "drizzle-orm";
import { seedOrderTest, cleanOrderTest, type OrderTestFixture } from "./fixtures";

describe("recordPayment", () => {
  let fx: OrderTestFixture;
  beforeEach(async () => { fx = await seedOrderTest(); });
  afterEach(async () => { await cleanOrderTest(fx); });

  it("transitions unpaid → partial when paidAmount < total", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId, userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 2 }], // total = 2*price
    });
    const [row] = await db.select().from(orders).where(eq(orders.id, order.id));
    const total = Number(row.total);
    await recordPayment({ orderId: order.id, userId: fx.userId, amount: total / 2, method: "cash" });
    const [after] = await db.select().from(orders).where(eq(orders.id, order.id));
    expect(after.paymentStatus).toBe("partial");
  });

  it("transitions partial → paid when total reached", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId, userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });
    const [row] = await db.select().from(orders).where(eq(orders.id, order.id));
    const total = Number(row.total);
    await recordPayment({ orderId: order.id, userId: fx.userId, amount: total / 2, method: "cash" });
    await recordPayment({ orderId: order.id, userId: fx.userId, amount: total / 2, method: "cash" });
    const [after] = await db.select().from(orders).where(eq(orders.id, order.id));
    expect(after.paymentStatus).toBe("paid");
  });

  it("rejects payment on cancelled order", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId, userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });
    await cancelOrder({ orderId: order.id, userId: fx.userId });
    await expect(
      recordPayment({ orderId: order.id, userId: fx.userId, amount: 100, method: "cash" }),
    ).rejects.toThrow(/cancelled/i);
  });

  it("rejects overpayment (paid_amount + amount > total)", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId, userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });
    const [row] = await db.select().from(orders).where(eq(orders.id, order.id));
    const total = Number(row.total);
    await expect(
      recordPayment({ orderId: order.id, userId: fx.userId, amount: total + 1, method: "cash" }),
    ).rejects.toThrow(/overpay/i);
  });
});
```

- [ ] **Step 2: Run tests; confirm existing overpayment guard passes but new status logic fails**

```bash
pnpm vitest run tests/unit/services/order.recordPayment.test.ts
```

- [ ] **Step 3: Update `recordPayment`**

In `order.server.ts` `recordPayment`, replace the status transition block that writes `status: "paid"` with:

```ts
// Recompute payment_status from paid_amount and total
const newPaid = Number(locked.paidAmount ?? 0) + amount;
const total = Number(locked.total ?? 0);
const nextPaymentStatus =
  newPaid === 0 ? PAYMENT_STATUS.UNPAID :
  newPaid < total ? PAYMENT_STATUS.PARTIAL :
  PAYMENT_STATUS.PAID;

// Guard: reject if cancelled or completed
if (locked.fulfillmentStatus === FULFILLMENT_STATUS.CANCELLED) {
  throw new Error("Cannot record payment on cancelled order");
}
if (locked.fulfillmentStatus === FULFILLMENT_STATUS.COMPLETED) {
  throw new Error("Order already completed; no further payment");
}

// Keep existing overpayment guard (newPaid > total → throw)

const [updated] = await tx
  .update(orders)
  .set({
    paidAmount: newPaid.toString(),
    paymentStatus: nextPaymentStatus,
    paidAt: nextPaymentStatus === PAYMENT_STATUS.PAID ? new Date() : locked.paidAt,
    updatedAt: new Date(),
  })
  .where(eq(orders.id, orderId))
  .returning();

await tx.insert(orderStatusHistory).values({
  orderId,
  paymentStatus: nextPaymentStatus,
  fulfillmentStatus: updated.fulfillmentStatus,
  note: `Payment recorded: ${amount} (${method})`,
  createdBy: userId,
});
```

Remove any code in the old `recordPayment` that auto-transitions fulfillment to "paid" (that was the old enum; no longer exists).

- [ ] **Step 4: Run tests**

```bash
pnpm vitest run tests/unit/services/order.recordPayment.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/services/order.server.ts tests/unit/services/
git commit -m "feat(orders): recordPayment computes payment_status + guards cancelled/completed"
```

---

### Task 12: Block edits after pending

**Files:**
- Modify: `packages/database/src/services/order.server.ts` (`updateOrder` ~line 549, `updateOrderItems` ~line 608)

- [ ] **Step 1: Add guards at top of both functions**

In `updateOrder`:

```ts
const locked = await lockOrderForUpdate(tx, orderId);
if (!locked) throw new Error(ERROR_MESSAGE.ORDER.NOT_FOUND);
if (locked.fulfillmentStatus !== FULFILLMENT_STATUS.PENDING) {
  throw new Error(`Cannot edit order after ${locked.fulfillmentStatus}`);
}
```

In `updateOrderItems`: same guard. Additionally, when changing quantities:
- If new qty > old qty: `reserved += (new - old)` for that variant.
- If new qty < old qty: `reserved -= (old - new)`.
- `on_hand` never touched (pending orders only).

- [ ] **Step 2: Write tests**

Add to `tests/unit/services/order.updateOrder.test.ts`:

```ts
it("rejects update after stock_out", async () => {
  const { order } = await createOrder({
    customerId: fx.customerId, userId: fx.userId,
    items: [{ variantId: fx.variantId, quantity: 1 }],
  });
  await stockOut({ orderId: order.id, userId: fx.userId });
  await expect(updateOrder({ orderId: order.id, userId: fx.userId, note: "x" }))
    .rejects.toThrow(/cannot edit/i);
});

it("updates reserved when qty increases on pending order", async () => {
  const { order } = await createOrder({
    customerId: fx.customerId, userId: fx.userId,
    items: [{ variantId: fx.variantId, quantity: 2 }],
  });
  await updateOrderItems({
    orderId: order.id, userId: fx.userId,
    items: [{ variantId: fx.variantId, quantity: 5 }],
  });
  const [v] = await db.select().from(productVariants).where(eq(productVariants.id, fx.variantId));
  expect(v.reserved).toBe(5);
});
```

- [ ] **Step 3: Run tests — expect PASS**

```bash
pnpm vitest run tests/unit/services/order.updateOrder.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add packages/database/src/services/order.server.ts tests/unit/services/
git commit -m "feat(orders): block edits after pending; reserved updates on item qty change"
```

---

### Task 13: Debt query helpers

**Files:**
- Create: `packages/database/src/services/debt.server.ts`
- Test: `tests/unit/services/debt.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/services/debt.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getDebtSummary, getCustomerDebt,
} from "@workspace/database/services/debt.server";
import {
  createOrder, stockOut, recordPayment,
} from "@workspace/database/services/order.server";
import { seedOrderTest, cleanOrderTest, type OrderTestFixture } from "./fixtures";

describe("getDebtSummary", () => {
  let fx: OrderTestFixture;
  beforeEach(async () => { fx = await seedOrderTest(); });
  afterEach(async () => { await cleanOrderTest(fx); });

  it("lists customers with stock_out + unpaid orders", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId, userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });
    await stockOut({ orderId: order.id, userId: fx.userId });
    const result = await getDebtSummary({});
    expect(result.data.length).toBeGreaterThan(0);
    const entry = result.data.find((r) => r.customerId === fx.customerId);
    expect(entry).toBeDefined();
    expect(Number(entry!.debt)).toBeGreaterThan(0);
    expect(entry!.unpaidOrders).toBe(1);
  });

  it("excludes customers with all paid", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId, userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });
    await stockOut({ orderId: order.id, userId: fx.userId });
    // fetch order.total, pay in full
    // ...
    // then assert getDebtSummary.data does not contain fx.customerId
  });
});

describe("getCustomerDebt", () => {
  // tabs: unpaid orders, payment history, all orders
});
```

- [ ] **Step 2: Run; confirm failure**

```bash
pnpm vitest run tests/unit/services/debt.test.ts
```

- [ ] **Step 3: Implement `debt.server.ts`**

Create `packages/database/src/services/debt.server.ts`:

```ts
import { and, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { db } from "../client";
import { orders, payments } from "../schema/orders";
import { profiles } from "../schema/profiles";
import { FULFILLMENT_STATUS, PAYMENT_STATUS } from "../constants/order";
import { PAGINATION_DEFAULT, calculateMetadata } from "@workspace/shared/pagination";

type DebtSummaryOpts = {
  search?: string;
  minAgeDays?: number;
  page?: number;
  limit?: number;
};

export async function getDebtSummary({
  search = "",
  minAgeDays,
  page = PAGINATION_DEFAULT.PAGE,
  limit = PAGINATION_DEFAULT.LIMIT,
}: DebtSummaryOpts) {
  const offset = (page - 1) * limit;

  const conditions = [
    eq(orders.fulfillmentStatus, FULFILLMENT_STATUS.STOCK_OUT),
    sql`${orders.paymentStatus} != 'paid'`,
  ];

  if (search) {
    conditions.push(
      or(ilike(profiles.fullName, `%${search}%`), ilike(profiles.phone, `%${search}%`))!,
    );
  }

  const subquery = db
    .select({
      customerId: orders.customerId,
      unpaidOrders: sql<number>`count(*)`.mapWith(Number),
      debt: sql<string>`sum(${orders.total}::numeric - coalesce(${orders.paidAmount}, '0')::numeric)`,
      oldestDebtDate: sql<Date>`min(${orders.stockOutAt})`,
    })
    .from(orders)
    .innerJoin(profiles, eq(orders.customerId, profiles.id))
    .where(and(...conditions))
    .groupBy(orders.customerId)
    .as("debt_summary");

  let query = db
    .select({
      customerId: subquery.customerId,
      unpaidOrders: subquery.unpaidOrders,
      debt: subquery.debt,
      oldestDebtDate: subquery.oldestDebtDate,
      customerName: profiles.fullName,
      customerPhone: profiles.phone,
    })
    .from(subquery)
    .innerJoin(profiles, eq(subquery.customerId, profiles.id));

  if (minAgeDays != null) {
    const cutoff = new Date(Date.now() - minAgeDays * 24 * 60 * 60 * 1000);
    query = query.where(sql`${subquery.oldestDebtDate} <= ${cutoff}`);
  }

  const rows = await query
    .orderBy(sql`${subquery.oldestDebtDate} ASC`)
    .limit(limit)
    .offset(offset);

  // Count total customers with debt
  const [countRow] = await db
    .select({ c: sql<number>`count(distinct ${orders.customerId})`.mapWith(Number) })
    .from(orders)
    .where(and(...conditions));

  return { data: rows, metadata: calculateMetadata(Number(countRow?.c ?? 0), page, limit) };
}

export async function getCustomerDebt(customerId: string) {
  const [customer] = await db.select().from(profiles).where(eq(profiles.id, customerId)).limit(1);
  if (!customer) return null;

  const allOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt));

  const unpaidOrders = allOrders.filter(
    (o) =>
      o.fulfillmentStatus === FULFILLMENT_STATUS.STOCK_OUT && o.paymentStatus !== PAYMENT_STATUS.PAID,
  );

  const totalDebt = unpaidOrders.reduce(
    (sum, o) => sum + (Number(o.total ?? 0) - Number(o.paidAmount ?? 0)),
    0,
  );

  const paymentHistory = await db
    .select({
      id: payments.id,
      orderId: payments.orderId,
      amount: payments.amount,
      method: payments.method,
      referenceCode: payments.referenceCode,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(payments.createdAt));

  return {
    customer,
    totalDebt,
    unpaidOrders,
    paymentHistory,
    allOrders,
  };
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm vitest run tests/unit/services/debt.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/services/debt.server.ts tests/unit/services/debt.test.ts
git commit -m "feat(debt): add getDebtSummary and getCustomerDebt queries"
```

---

## Phase 3 — UI

### Task 14: Update `/orders` list — 2 filters, 2 badges, debt preset

**Files:**
- Modify: `apps/admin/app/(dashboard)/orders/page.tsx`
- Modify: any API route backing the list (`apps/admin/app/api/admin/orders/route.ts`) to accept `paymentStatus` and `fulfillmentStatus` query params instead of `status`.
- Modify: `packages/database/src/services/order.server.ts` `getOrders()` (line 396) — accept both filters.

- [ ] **Step 1: Update `getOrders` signature**

Change `getOrders` to:

```ts
export async function getOrders({
  search = "",
  paymentStatus,        // PaymentStatusValue | undefined
  fulfillmentStatus,    // FulfillmentStatusValue | undefined
  customerId,
  page = PAGINATION_DEFAULT.PAGE,
  limit = PAGINATION_DEFAULT.LIMIT,
  debtOnly,             // boolean: shortcut for fulfillment_status=stock_out AND payment_status != paid
}: {
  search?: string;
  paymentStatus?: PaymentStatusValue;
  fulfillmentStatus?: FulfillmentStatusValue;
  customerId?: string;
  page?: number;
  limit?: number;
  debtOnly?: boolean;
} = {}) {
  // ...build whereConditions with the new fields
  // if debtOnly: add eq(orders.fulfillmentStatus, 'stock_out') + sql`${orders.paymentStatus} != 'paid'`
}
```

Also return `paymentStatus` and `fulfillmentStatus` in the select (instead of single `status`).

- [ ] **Step 2: Update API route**

In `apps/admin/app/api/admin/orders/route.ts`, parse `paymentStatus`, `fulfillmentStatus`, `debtOnly` from query string and forward.

- [ ] **Step 3: Update page.tsx**

In `apps/admin/app/(dashboard)/orders/page.tsx`:

Replace `STATUS_CONFIG` with two separate configs:

```tsx
const PAYMENT_BADGE: Record<PaymentStatusValue, { label: string; className: string }> = {
  unpaid: { label: "Chưa thanh toán", className: "bg-red-100 text-red-800" },
  partial: { label: "Thanh toán một phần", className: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Đã thanh toán", className: "bg-green-100 text-green-800" },
};

const FULFILLMENT_BADGE: Record<FulfillmentStatusValue, { label: string; className: string }> = {
  pending: { label: "Chờ xử lý", className: "bg-gray-100 text-gray-800" },
  stock_out: { label: "Đã xuất kho", className: "bg-blue-100 text-blue-800" },
  completed: { label: "Hoàn tất", className: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Đã hủy", className: "bg-gray-300 text-gray-600" },
};
```

In the table, render BOTH badges in the status column (stacked or side-by-side).

In the filter bar, replace the single Status dropdown with TWO dropdowns (Payment, Fulfillment) plus a "🔴 Công nợ" preset button that sets `debtOnly=true` in URL.

- [ ] **Step 4: Manual smoke test**

Start dev server:

```bash
pnpm dev
```

Open `/orders`, verify:
- Two badges per row render correctly.
- Filters filter correctly.
- "Công nợ" preset shows only stock_out+unpaid rows.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/ packages/database/src/services/order.server.ts
git commit -m "feat(admin): orders list with payment+fulfillment filters and dual badges"
```

---

### Task 15: Update `/orders/[id]` detail — badges, action buttons, progress

**Files:**
- Modify: `apps/admin/app/(dashboard)/orders/[id]/page.tsx`
- Modify: the order detail API route if it exposes old status directly.

- [ ] **Step 1: Read current page structure**

```bash
cat apps/admin/app/\(dashboard\)/orders/\[id\]/page.tsx | head -100
```

Identify: header badge area, action button area, timeline section, payment area.

- [ ] **Step 2: Replace single status header with two badges**

Use the same `PAYMENT_BADGE` / `FULFILLMENT_BADGE` maps from Task 14 (extract to a shared module if needed, e.g. `apps/admin/lib/order-badges.ts`).

- [ ] **Step 3: Action buttons based on state**

```tsx
{order.fulfillmentStatus === "pending" && (
  <>
    <Button onClick={handleStockOut}>Xuất kho</Button>
    <Button variant="destructive" onClick={handleCancel}>Hủy đơn</Button>
    <Button variant="secondary" onClick={openPaymentDialog}>Ghi nhận thanh toán</Button>
  </>
)}
{order.fulfillmentStatus === "stock_out" && order.paymentStatus !== "paid" && (
  <Button variant="secondary" onClick={openPaymentDialog}>Ghi nhận thanh toán</Button>
)}
{order.fulfillmentStatus === "stock_out" && order.paymentStatus === "paid" && (
  <Button onClick={handleComplete}>Hoàn tất đơn</Button>
)}
```

Where `handleStockOut`, `handleComplete`, `handleCancel` POST to the respective routes from Tasks 8, 9, 10.

- [ ] **Step 4: Add paid progress bar**

Below the total: `<Progress value={paidAmount / total * 100} />` with label `{formatMoney(paidAmount)} / {formatMoney(total)}`.

- [ ] **Step 5: Update timeline to render 2-dim history**

Map `order_status_history` rows to display both statuses in each timeline item.

- [ ] **Step 6: Manual smoke test + commit**

```bash
git add apps/admin/
git commit -m "feat(admin): order detail page with two-dim status and action buttons"
```

---

### Task 16: Update `/orders/new` — show `available`, oversell warning

**Files:**
- Modify: `apps/admin/app/(dashboard)/orders/new/page.tsx`
- Modify: The API route that returns product variants for the picker — change `stockQuantity` to `onHand` + include `available` (computed).

- [ ] **Step 1: Update variant picker API**

Find the route (likely `apps/admin/app/api/admin/products/with-variants/route.ts`). Select `onHand`, `reserved`, and compute `available = onHand - reserved` in the select or on the client.

- [ ] **Step 2: Update form**

For each selected item in the order form:
- Show `available` next to the quantity input.
- If `quantity > available`: show yellow warning banner "Sắp thiếu hàng, cần nhập thêm {quantity - available} cái".
- Allow submit regardless (oversell OK at order creation).

- [ ] **Step 3: Commit**

```bash
git add apps/admin/
git commit -m "feat(admin): new order form shows available stock and oversell warning"
```

---

### Task 17: New `/debts` page

**Files:**
- Create: `apps/admin/app/(dashboard)/debts/page.tsx`
- Create: `apps/admin/app/api/admin/debts/route.ts`

- [ ] **Step 1: Create API route**

```ts
// apps/admin/app/api/admin/debts/route.ts
import { NextResponse } from "next/server";
import { getDebtSummary } from "@workspace/database/services/debt.server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? "";
  const minAgeDays = url.searchParams.get("minAgeDays");
  const page = Number(url.searchParams.get("page") ?? 1);
  const limit = Number(url.searchParams.get("limit") ?? 20);

  const result = await getDebtSummary({
    search,
    minAgeDays: minAgeDays ? Number(minAgeDays) : undefined,
    page,
    limit,
  });
  return NextResponse.json(result);
}
```

- [ ] **Step 2: Create page**

```tsx
// apps/admin/app/(dashboard)/debts/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@workspace/ui/components/data-table";
// ...

function DebtsPage() {
  // useQuery for /api/admin/debts with search + minAgeDays filter state
  // Render DataTable with columns: Khách hàng, Số đơn nợ, Tổng nợ, Đơn cũ nhất, Số ngày nợ, Thao tác
  // Action: Link to /debts/[customerId], button "Thu tiền" opens payment modal
  // Filter presets: >30, >60, >90 days
  // Search input for name/phone
}

export default DebtsPage;
```

Format columns:
- Tổng nợ: VND currency
- Đơn cũ nhất: format as YYYY-MM-DD
- Số ngày nợ: `Math.floor((Date.now() - new Date(oldestDebtDate).getTime()) / 86400000)`

- [ ] **Step 3: Add sidebar nav entry**

Find the admin sidebar config (likely `apps/admin/components/layout/sidebar.tsx` or similar) and add `{ label: "Công nợ", href: "/debts", icon: <Wallet /> }`.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/
git commit -m "feat(admin): add /debts page with per-customer debt summary"
```

---

### Task 18: New `/debts/[customerId]` page

**Files:**
- Create: `apps/admin/app/(dashboard)/debts/[customerId]/page.tsx`
- Create: `apps/admin/app/api/admin/debts/[customerId]/route.ts`

- [ ] **Step 1: Create API route**

```ts
// apps/admin/app/api/admin/debts/[customerId]/route.ts
import { NextResponse } from "next/server";
import { getCustomerDebt } from "@workspace/database/services/debt.server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ customerId: string }> },
) {
  const { customerId } = await params;
  const result = await getCustomerDebt(customerId);
  if (!result) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  return NextResponse.json(result);
}
```

- [ ] **Step 2: Create page with tabs**

```tsx
// apps/admin/app/(dashboard)/debts/[customerId]/page.tsx
"use client";
// Header: name, phone, totalDebt, unpaidOrders.length, sum(allOrders.total), sum(paymentHistory.amount)
// Tabs:
//   1. "Đơn đang nợ" → table of unpaidOrders (orderNumber, stockOutAt, total, paidAmount, debt, link)
//   2. "Lịch sử thanh toán" → paymentHistory table (date, orderNumber, amount, method, ref)
//   3. "Tất cả đơn" → allOrders table
// Action: "Thu tiền" button → modal that collects amount, selects orders FIFO by stockOutAt,
//          splits across multiple orders, POSTs to /api/admin/orders/[id]/payments for each
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/
git commit -m "feat(admin): add /debts/[customerId] detail page with tabs and bulk payment"
```

---

### Task 19: Update `/products` to show `on_hand` and `available`

**Files:**
- Modify: `apps/admin/app/(dashboard)/products/page.tsx` (and the variants detail view)
- Modify: `apps/admin/app/api/admin/products/route.ts` (or wherever product list is fetched)

- [ ] **Step 1: Update API to return `onHand`, `reserved`, and computed `available`**

- [ ] **Step 2: Update list to render: `{onHand} (còn bán được: {available})`**

Add red highlight class when `available < 0`:

```tsx
<span className={available < 0 ? "text-red-600 font-semibold" : ""}>
  {onHand} (còn bán được: {available})
</span>
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/
git commit -m "feat(admin): products page shows on_hand and available stock"
```

---

## Phase 4 — Final Verification

### Task 20: Integration smoke test + invariant check script

**Files:**
- Create: `tests/integration/invoice-flow.test.ts`
- Create: `packages/database/src/scripts/verify-inventory-invariants.ts`

- [ ] **Step 1: Write end-to-end flow test**

```ts
// tests/integration/invoice-flow.test.ts
describe("full invoice flow", () => {
  it("create → stock_out → partial payment → full payment → complete", async () => {
    // ... using real DB, exercise the full happy path
  });

  it("create → cancel (pending) returns reserved; cancel after stock_out rejected", async () => { /* ... */ });

  it("oversell: create OK, stock_out blocked, nhập kho, stock_out now OK", async () => { /* ... */ });
});
```

- [ ] **Step 2: Write invariant verify script**

`packages/database/src/scripts/verify-inventory-invariants.ts`:

```ts
import { db } from "../client";
import { sql } from "drizzle-orm";

async function main() {
  // 1. reserved matches pending-order quantities
  const mismatch = await db.execute(sql`
    SELECT pv.id, pv.reserved, COALESCE(SUM(oi.quantity), 0) AS expected
    FROM product_variants pv
    LEFT JOIN order_items oi ON oi.variant_id = pv.id
    LEFT JOIN orders o ON o.id = oi.order_id AND o.fulfillment_status = 'pending'
    GROUP BY pv.id, pv.reserved
    HAVING pv.reserved != COALESCE(SUM(oi.quantity), 0)
  `);
  if (mismatch.rowCount && mismatch.rowCount > 0) {
    console.error(`RESERVED MISMATCH: ${mismatch.rowCount} variants`);
    process.exit(1);
  }

  // 2. on_hand >= 0
  const negatives = await db.execute(sql`SELECT COUNT(*) AS c FROM product_variants WHERE on_hand < 0`);
  if (Number((negatives.rows[0] as any).c) > 0) {
    console.error("NEGATIVE on_hand detected");
    process.exit(1);
  }

  console.log("All inventory invariants hold");
}

main().catch((e) => { console.error(e); process.exit(1); });
```

Add a package.json script: `"verify:inventory": "tsx src/scripts/verify-inventory-invariants.ts"`.

- [ ] **Step 3: Run full suite**

```bash
pnpm test
pnpm --filter @workspace/database verify:inventory
pnpm build
```

All must pass.

- [ ] **Step 4: Manual regression smoke in UI**

Open the dev server, exercise:
- Create order → verify reserved increments.
- Stock out → verify on_hand decrements and stock_out_at set.
- Partial payment → badge shows "partial".
- Full payment → badge shows "paid"; "Hoàn tất" button enables.
- Complete → completed_at set; all actions disabled.
- Cancel on pending → reserved returns to 0.
- Try cancel on stock_out → error shown.
- /debts page → shows the order as debt while in stock_out + unpaid.

- [ ] **Step 5: Commit**

```bash
git add tests/ packages/database/
git commit -m "test(invoice): end-to-end flow + inventory invariant verify script"
```

---

## Notes for the executor

- **Rollback plan:** if Phase 1 fails mid-migration on shared staging, restore from the `pg_dump` backup taken in Task 4 Step 1. Do not attempt to re-run a partially-applied migration.
- **Idempotency:** the new `stockOut`, `completeOrder`, `cancelOrder` routes should accept an `Idempotency-Key` header the same way `recordPayment` does. Reuse `checkIdempotencyKey` / `storeIdempotencyKey` from `packages/database/src/lib/idempotency.ts`.
- **No backwards-compat shims:** after this plan is executed, the old `status` enum and `updateOrderStatus` function should be gone. Any caller still referencing them must be migrated.
- **Out of scope:** `return_order` (Spec 2). Do not implement returns or adjustments in this plan — if you feel tempted, stop and consult the spec.
- **Canonical spec docs to update after execution:** `docs/030-Specs/Spec-Order-Management.md` and `docs/030-Specs/Spec-Finance-Accounting.md` describe the old status model and must be updated to reflect the new two-dimensional status + inventory model once this plan is done. Not a blocking task, but needs a follow-up commit.
- **Callers of `getOrders`:** Task 14 changes the `getOrders` signature. Search `grep -rn "getOrders\b" apps/ packages/` and update each caller to pass `paymentStatus`/`fulfillmentStatus` instead of `status`.
