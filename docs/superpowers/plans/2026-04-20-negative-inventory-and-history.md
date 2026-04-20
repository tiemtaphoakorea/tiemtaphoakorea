# Negative Inventory & Inventory History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow stock-out to proceed when `onHand` goes negative, and track all inventory movements (in/out/adjustments) with a history UI.

**Architecture:** Add a `inventory_movements` table that records every `onHand` change as an immutable event log. Hook into `stockOut()` and supplier receipt to auto-insert records. Add a manual adjustment API. Build a history page with two tabs (transactions list + daily summary) and a per-variant history section in the product edit sheet.

**Tech Stack:** Next.js 15, Drizzle ORM, PostgreSQL (Supabase), React Query, shadcn/ui DataTable, axios

---

## File Map

| Action | File |
|--------|------|
| Modify | `packages/database/src/schema/enums.ts` |
| Create | `packages/database/src/schema/inventory.ts` |
| Modify | `packages/database/src/schema/index.ts` |
| Modify | `packages/database/src/schema/relations.ts` |
| Auto-generate | `packages/database/drizzle/<migration>.sql` |
| Modify | `packages/database/src/services/order.server.ts` |
| Modify | `packages/database/src/services/supplier.server.ts` |
| Modify | `packages/database/src/scripts/verify-inventory-invariants.ts` |
| Create | `packages/database/src/services/inventory.server.ts` |
| Create | `apps/admin/app/api/admin/inventory/movements/route.ts` |
| Create | `apps/admin/app/api/admin/inventory/movements/adjust/route.ts` |
| Create | `apps/admin/app/api/admin/inventory/movements/daily-summary/route.ts` |
| Modify | `apps/admin/lib/api-endpoints.ts` |
| Modify | `apps/admin/services/admin.client.ts` |
| Modify | `apps/admin/lib/query-keys.ts` |
| Create | `apps/admin/app/(dashboard)/inventory/history/page.tsx` |
| Modify | `apps/admin/components/admin/products/product-edit-sheet.tsx` |
| Modify | `tests/unit/services/order.stockOut.test.ts` |
| Create | `tests/unit/services/inventory.movements.test.ts` |

---

## Task 1: Remove stock-out validation & update existing test

**Files:**
- Modify: `packages/database/src/services/order.server.ts`
- Modify: `tests/unit/services/order.stockOut.test.ts`

- [ ] **Step 1: Update the test — change "rejects" to "allows negative onHand"**

In `tests/unit/services/order.stockOut.test.ts`, find the test named `"rejects when on_hand is below the ordered quantity"` and replace it:

```typescript
it("allows stock-out when quantity exceeds on_hand, leaving onHand negative", async () => {
  // fx.variantId has onHand=5 by default from seedOrderTest
  const { order } = await createOrder({
    customerId: fx.customerId,
    items: [{ variantId: fx.variantId, quantity: 10 }],
    userId: fx.userId,
  });

  const updated = await stockOut({ orderId: order.id, userId: fx.userId });

  const [after] = await db
    .select({ onHand: productVariants.onHand, reserved: productVariants.reserved })
    .from(productVariants)
    .where(eq(productVariants.id, fx.variantId));

  expect(after.onHand).toBe(-5); // 5 - 10 = -5
  expect(after.reserved).toBe(0);
  expect(updated.fulfillmentStatus).toBe(FULFILLMENT_STATUS.STOCK_OUT);
});
```

- [ ] **Step 2: Run the test — verify it FAILS (stockOut still rejects)**

```bash
pnpm test tests/unit/services/order.stockOut.test.ts
```

Expected: FAIL — `"Insufficient stock for SKU"`

- [ ] **Step 3: Remove the hard block in `stockOut()`**

In `packages/database/src/services/order.server.ts`, find and delete these lines (they appear in the `stockOut` function after `const byId = new Map(...)`):

```typescript
// DELETE THIS ENTIRE BLOCK:
for (const item of items) {
  const v = byId.get(item.variantId);
  if (!v) throw new Error(`Variant ${item.variantId} missing`);
  if ((v.onHand ?? 0) < item.quantity) {
    throw new Error(
      `Insufficient stock for SKU ${v.sku}: on_hand=${v.onHand}, need=${item.quantity}`,
    );
  }
}
```

Keep the deduction loop below it intact.

- [ ] **Step 4: Run the test — verify it PASSES**

```bash
pnpm test tests/unit/services/order.stockOut.test.ts
```

Expected: PASS (all tests in file)

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/services/order.server.ts tests/unit/services/order.stockOut.test.ts
git commit -m "feat(inventory): allow stock-out when onHand goes negative"
```

---

## Task 2: Update invariant script to allow negative onHand

**Files:**
- Modify: `packages/database/src/scripts/verify-inventory-invariants.ts`

- [ ] **Step 1: Remove the negative onHand invariant check**

In `packages/database/src/scripts/verify-inventory-invariants.ts`, find and delete the block that queries `on_hand < 0` and the `negativeOnHand` field from the return type and return value.

Before (approximate):
```typescript
const negativesResult = await db.execute(
  sql`SELECT COUNT(*) AS c FROM product_variants WHERE on_hand < 0`,
);
const negativesRows = rowsOf<{ c: string | number }>(negativesResult);

return {
  reservedMismatches: mismatchRows.length,
  negativeOnHand: Number(negativesRows[0]?.c ?? 0),
};
```

After:
```typescript
return {
  reservedMismatches: mismatchRows.length,
};
```

Also remove `negativeOnHand` from the `InventoryInvariantReport` type and any exit-code check that uses it.

- [ ] **Step 2: Verify script still compiles**

```bash
pnpm --filter @workspace/database exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add packages/database/src/scripts/verify-inventory-invariants.ts
git commit -m "chore(inventory): remove negative onHand invariant check"
```

---

## Task 3: Add `movementTypeEnum` and `inventoryMovements` schema

**Files:**
- Modify: `packages/database/src/schema/enums.ts`
- Create: `packages/database/src/schema/inventory.ts`
- Modify: `packages/database/src/schema/index.ts`

- [ ] **Step 1: Add enum to `enums.ts`**

At the end of `packages/database/src/schema/enums.ts`, add:

```typescript
export const movementTypeEnum = pgEnum("movement_type", [
  "stock_out",
  "supplier_receipt",
  "manual_adjustment",
  "cancellation",
]);
```

- [ ] **Step 2: Create `inventory.ts`**

Create `packages/database/src/schema/inventory.ts`:

```typescript
import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { movementTypeEnum } from "./enums";
import { profiles } from "./profiles";
import { productVariants } from "./products";

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    type: movementTypeEnum("type").notNull(),
    quantity: integer("quantity").notNull(),
    onHandBefore: integer("on_hand_before").notNull(),
    onHandAfter: integer("on_hand_after").notNull(),
    referenceId: uuid("reference_id"),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
  },
  (table) => [
    index("idx_inv_movements_variant").on(table.variantId),
    index("idx_inv_movements_created_at").on(table.createdAt),
    index("idx_inv_movements_type").on(table.type),
  ],
);
```

- [ ] **Step 3: Export from schema index**

In `packages/database/src/schema/index.ts`, add:

```typescript
export * from "./inventory";
```

- [ ] **Step 4: Verify it compiles**

```bash
pnpm --filter @workspace/database exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/schema/enums.ts packages/database/src/schema/inventory.ts packages/database/src/schema/index.ts
git commit -m "feat(inventory): add inventory_movements schema"
```

---

## Task 4: Add Drizzle relations for `inventoryMovements`

**Files:**
- Modify: `packages/database/src/schema/relations.ts`

- [ ] **Step 1: Add relations**

In `packages/database/src/schema/relations.ts`, add the import and relations:

```typescript
import { inventoryMovements } from "./inventory";

// Add to productVariantsRelations (already exists — add `movements` to the many list):
export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  // ... existing relations ...
  movements: many(inventoryMovements),
}));

// New relation block:
export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  variant: one(productVariants, {
    fields: [inventoryMovements.variantId],
    references: [productVariants.id],
  }),
  createdByUser: one(profiles, {
    fields: [inventoryMovements.createdBy],
    references: [profiles.id],
  }),
}));
```

- [ ] **Step 2: Verify**

```bash
pnpm --filter @workspace/database exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add packages/database/src/schema/relations.ts
git commit -m "feat(inventory): add relations for inventory_movements"
```

---

## Task 5: Generate and apply Drizzle migration

- [ ] **Step 1: Generate migration**

```bash
pnpm --filter @workspace/database exec drizzle-kit generate
```

Expected: New file created in `packages/database/drizzle/` with `CREATE TYPE movement_type` and `CREATE TABLE inventory_movements`.

- [ ] **Step 2: Apply migration**

```bash
pnpm --filter @workspace/database exec drizzle-kit migrate
```

Expected: Migration applied successfully.

- [ ] **Step 3: Commit**

```bash
git add packages/database/drizzle/
git commit -m "feat(inventory): migration for inventory_movements table"
```

---

## Task 6: Create inventory service

**Files:**
- Create: `packages/database/src/services/inventory.server.ts`

- [ ] **Step 1: Write the failing test first**

Create `tests/unit/services/inventory.movements.test.ts`:

```typescript
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { inventoryMovements } from "@/db/schema/inventory";
import { productVariants } from "@/db/schema/products";
import {
  adjustInventory,
  getInventoryDailySummary,
  getInventoryMovements,
} from "@/services/inventory.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "./fixtures";

describe("adjustInventory", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  it("increments onHand and inserts a manual_adjustment movement", async () => {
    const movement = await adjustInventory({
      variantId: fx.variantId,
      quantity: 10,
      note: "Nhập hàng bổ sung",
      userId: fx.userId,
    });

    const [variant] = await db
      .select({ onHand: productVariants.onHand })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));

    expect(variant.onHand).toBe(15); // 5 + 10
    expect(movement.type).toBe("manual_adjustment");
    expect(movement.quantity).toBe(10);
    expect(movement.onHandBefore).toBe(5);
    expect(movement.onHandAfter).toBe(15);
  });

  it("decrements onHand with negative quantity", async () => {
    await adjustInventory({
      variantId: fx.variantId,
      quantity: -3,
      userId: fx.userId,
    });

    const [variant] = await db
      .select({ onHand: productVariants.onHand })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));

    expect(variant.onHand).toBe(2); // 5 - 3
  });
});

describe("getInventoryMovements", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  it("returns paginated movements filtered by variantId", async () => {
    await adjustInventory({ variantId: fx.variantId, quantity: 5, userId: fx.userId });
    await adjustInventory({ variantId: fx.variantId, quantity: -2, userId: fx.userId });

    const result = await getInventoryMovements({ variantId: fx.variantId, page: 1, limit: 10 });

    expect(result.data).toHaveLength(2);
    expect(result.metadata.total).toBe(2);
  });
});

describe("getInventoryDailySummary", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  it("aggregates in/out by date", async () => {
    await adjustInventory({ variantId: fx.variantId, quantity: 10, userId: fx.userId });
    await adjustInventory({ variantId: fx.variantId, quantity: -3, userId: fx.userId });

    const rows = await getInventoryDailySummary({ variantId: fx.variantId });

    expect(rows).toHaveLength(1);
    expect(Number(rows[0].totalIn)).toBe(10);
    expect(Number(rows[0].totalOut)).toBe(3);
  });
});
```

- [ ] **Step 2: Run — verify FAILS**

```bash
pnpm test tests/unit/services/inventory.movements.test.ts
```

Expected: FAIL — `Cannot find module '@/services/inventory.server'`

- [ ] **Step 3: Implement the service**

Create `packages/database/src/services/inventory.server.ts`:

```typescript
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../db/db.server";
import { inventoryMovements } from "../schema/inventory";
import { profiles } from "../schema/profiles";
import { productVariants } from "../schema/products";

export type MovementType = "stock_out" | "supplier_receipt" | "manual_adjustment" | "cancellation";

export async function insertInventoryMovement(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  {
    variantId,
    type,
    quantity,
    onHandBefore,
    referenceId,
    note,
    createdBy,
  }: {
    variantId: string;
    type: MovementType;
    quantity: number;
    onHandBefore: number;
    referenceId?: string;
    note?: string;
    createdBy?: string;
  },
) {
  await tx.insert(inventoryMovements).values({
    variantId,
    type,
    quantity,
    onHandBefore,
    onHandAfter: onHandBefore + quantity,
    referenceId,
    note,
    createdBy,
  });
}

export async function adjustInventory({
  variantId,
  quantity,
  note,
  userId,
}: {
  variantId: string;
  quantity: number;
  note?: string;
  userId: string;
}) {
  return await db.transaction(async (tx) => {
    const [variant] = await tx
      .select({ onHand: productVariants.onHand })
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .for("update");

    if (!variant) throw new Error("Variant not found");

    const onHandBefore = variant.onHand ?? 0;

    await tx
      .update(productVariants)
      .set({ onHand: sql`${productVariants.onHand} + ${quantity}` })
      .where(eq(productVariants.id, variantId));

    const [movement] = await tx
      .insert(inventoryMovements)
      .values({
        variantId,
        type: "manual_adjustment",
        quantity,
        onHandBefore,
        onHandAfter: onHandBefore + quantity,
        note,
        createdBy: userId,
      })
      .returning();

    return movement;
  });
}

export async function getInventoryMovements({
  variantId,
  type,
  startDate,
  endDate,
  page = 1,
  limit = 20,
}: {
  variantId?: string;
  type?: MovementType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const conditions = [];
  if (variantId) conditions.push(eq(inventoryMovements.variantId, variantId));
  if (type) conditions.push(eq(inventoryMovements.type, type));
  if (startDate) conditions.push(gte(inventoryMovements.createdAt, startDate));
  if (endDate) conditions.push(lte(inventoryMovements.createdAt, endDate));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: inventoryMovements.id,
        variantId: inventoryMovements.variantId,
        variantSku: productVariants.sku,
        variantName: productVariants.name,
        type: inventoryMovements.type,
        quantity: inventoryMovements.quantity,
        onHandBefore: inventoryMovements.onHandBefore,
        onHandAfter: inventoryMovements.onHandAfter,
        referenceId: inventoryMovements.referenceId,
        note: inventoryMovements.note,
        createdAt: inventoryMovements.createdAt,
        createdByName: profiles.fullName,
      })
      .from(inventoryMovements)
      .leftJoin(productVariants, eq(inventoryMovements.variantId, productVariants.id))
      .leftJoin(profiles, eq(inventoryMovements.createdBy, profiles.id))
      .where(where)
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ total: count() }).from(inventoryMovements).where(where),
  ]);

  return {
    data,
    metadata: {
      total: Number(total),
      page,
      totalPages: Math.ceil(Number(total) / limit),
    },
  };
}

export async function getInventoryDailySummary({
  variantId,
  startDate,
  endDate,
}: {
  variantId?: string;
  startDate?: Date;
  endDate?: Date;
} = {}) {
  const conditions = [];
  if (variantId) conditions.push(eq(inventoryMovements.variantId, variantId));
  if (startDate) conditions.push(gte(inventoryMovements.createdAt, startDate));
  if (endDate) conditions.push(lte(inventoryMovements.createdAt, endDate));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      date: sql<string>`DATE(${inventoryMovements.createdAt})`,
      totalIn: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovements.quantity} > 0 THEN ${inventoryMovements.quantity} ELSE 0 END), 0)`,
      totalOut: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovements.quantity} < 0 THEN ABS(${inventoryMovements.quantity}) ELSE 0 END), 0)`,
    })
    .from(inventoryMovements)
    .where(where)
    .groupBy(sql`DATE(${inventoryMovements.createdAt})`)
    .orderBy(sql`DATE(${inventoryMovements.createdAt}) DESC`);
}
```

- [ ] **Step 4: Run — verify PASSES**

```bash
pnpm test tests/unit/services/inventory.movements.test.ts
```

Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/services/inventory.server.ts tests/unit/services/inventory.movements.test.ts
git commit -m "feat(inventory): add inventory service with adjust and history queries"
```

---

## Task 7: Hook `stockOut()` to record movements

**Files:**
- Modify: `packages/database/src/services/order.server.ts`

- [ ] **Step 1: Import `insertInventoryMovement`**

At the top of `order.server.ts`, add:

```typescript
import { insertInventoryMovement } from "./inventory.server";
```

- [ ] **Step 2: Insert movement records after the deduction loop**

In the `stockOut()` function, after the loop that calls `tx.update(productVariants)...`, add:

```typescript
// After the deduction loop:
for (const item of items) {
  const v = byId.get(item.variantId)!;
  await insertInventoryMovement(tx, {
    variantId: item.variantId,
    type: "stock_out",
    quantity: -item.quantity,
    onHandBefore: v.onHand ?? 0,
    referenceId: orderId,
    createdBy: userId,
  });
}
```

- [ ] **Step 3: Run the stockOut tests to verify nothing broke**

```bash
pnpm test tests/unit/services/order.stockOut.test.ts
```

Expected: PASS

- [ ] **Step 4: Write a test verifying movement is recorded**

In `tests/unit/services/order.stockOut.test.ts`, add this test inside the `describe("stockOut")` block:

```typescript
it("records a stock_out movement in inventory_movements", async () => {
  const { order } = await createOrder({
    customerId: fx.customerId,
    items: [{ variantId: fx.variantId, quantity: 2 }],
    userId: fx.userId,
  });

  await stockOut({ orderId: order.id, userId: fx.userId });

  const movements = await db
    .select()
    .from(inventoryMovements)
    .where(eq(inventoryMovements.variantId, fx.variantId));

  expect(movements).toHaveLength(1);
  expect(movements[0].type).toBe("stock_out");
  expect(movements[0].quantity).toBe(-2);
  expect(movements[0].onHandBefore).toBe(5);
  expect(movements[0].onHandAfter).toBe(3);
  expect(movements[0].referenceId).toBe(order.id);
});
```

Add import at top of test file:
```typescript
import { inventoryMovements } from "@/db/schema/inventory";
```

- [ ] **Step 5: Run — verify PASSES**

```bash
pnpm test tests/unit/services/order.stockOut.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/database/src/services/order.server.ts tests/unit/services/order.stockOut.test.ts
git commit -m "feat(inventory): record stock_out movements after fulfillment"
```

---

## Task 8: Hook supplier receipt to record movements

**Files:**
- Modify: `packages/database/src/services/supplier.server.ts`

- [ ] **Step 1: Import `insertInventoryMovement`**

At the top of `supplier.server.ts`, add:

```typescript
import { insertInventoryMovement } from "./inventory.server";
```

- [ ] **Step 2: Insert movement after `onHand` increment**

In `updateSupplierOrderStatus()`, after the block that updates `productVariants.onHand`, add:

```typescript
await insertInventoryMovement(tx, {
  variantId: variantId,
  type: "supplier_receipt",
  quantity: row.quantity,
  onHandBefore: variant.onHand ?? 0,
  referenceId: id, // supplier order id
  createdBy: undefined, // system-triggered
});
```

The full "RECEIVED" block should look like:

```typescript
if (
  status === SUPPLIER_ORDER_STATUS.RECEIVED &&
  row.status !== SUPPLIER_ORDER_STATUS.RECEIVED
) {
  const variantId = row.variantId;
  if (variantId) {
    const [variant] = await tx
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .limit(1);

    if (variant) {
      await tx
        .update(productVariants)
        .set({ onHand: (variant.onHand || 0) + row.quantity })
        .where(eq(productVariants.id, variantId));

      await insertInventoryMovement(tx, {
        variantId,
        type: "supplier_receipt",
        quantity: row.quantity,
        onHandBefore: variant.onHand ?? 0,
        referenceId: id,
        createdBy: undefined,
      });
    }
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm --filter @workspace/database exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add packages/database/src/services/supplier.server.ts
git commit -m "feat(inventory): record supplier_receipt movements when goods arrive"
```

---

## Task 9: Create inventory API routes

**Files:**
- Modify: `apps/admin/lib/api-endpoints.ts`
- Create: `apps/admin/app/api/admin/inventory/movements/route.ts`
- Create: `apps/admin/app/api/admin/inventory/movements/adjust/route.ts`
- Create: `apps/admin/app/api/admin/inventory/movements/daily-summary/route.ts`

- [ ] **Step 1: Add endpoints to `api-endpoints.ts`**

In `apps/admin/lib/api-endpoints.ts`, find the `ADMIN` object and add:

```typescript
INVENTORY: {
  MOVEMENTS: "/api/admin/inventory/movements",
  ADJUST: "/api/admin/inventory/movements/adjust",
  DAILY_SUMMARY: "/api/admin/inventory/movements/daily-summary",
},
```

- [ ] **Step 2: Create GET movements route**

Create `apps/admin/app/api/admin/inventory/movements/route.ts`:

```typescript
import { getInventoryMovements } from "@workspace/database/services/inventory.server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const variantId = searchParams.get("variantId") ?? undefined;
  const type = (searchParams.get("type") ?? undefined) as Parameters<typeof getInventoryMovements>[0]["type"];
  const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
  const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));

  const result = await getInventoryMovements({ variantId, type, startDate, endDate, page, limit });
  return NextResponse.json(result);
}
```

- [ ] **Step 3: Create POST adjust route**

Create `apps/admin/app/api/admin/inventory/movements/adjust/route.ts`:

```typescript
import { adjustInventory } from "@workspace/database/services/inventory.server";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { variantId, quantity, note } = body as {
    variantId: string;
    quantity: number;
    note?: string;
  };

  if (!variantId || typeof quantity !== "number" || quantity === 0) {
    return NextResponse.json({ error: "variantId and non-zero quantity required" }, { status: 400 });
  }

  const movement = await adjustInventory({
    variantId,
    quantity,
    note,
    userId: session.user.id,
  });

  return NextResponse.json(movement, { status: 201 });
}
```

> Note: check how `getServerSession` is imported in other API routes in this codebase (e.g., `apps/admin/app/api/admin/orders/route.ts`) and use the same pattern.

- [ ] **Step 4: Create GET daily-summary route**

Create `apps/admin/app/api/admin/inventory/movements/daily-summary/route.ts`:

```typescript
import { getInventoryDailySummary } from "@workspace/database/services/inventory.server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const variantId = searchParams.get("variantId") ?? undefined;
  const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
  const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;

  const rows = await getInventoryDailySummary({ variantId, startDate, endDate });
  return NextResponse.json({ data: rows });
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm --filter admin exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add apps/admin/lib/api-endpoints.ts \
  apps/admin/app/api/admin/inventory/movements/route.ts \
  apps/admin/app/api/admin/inventory/movements/adjust/route.ts \
  apps/admin/app/api/admin/inventory/movements/daily-summary/route.ts
git commit -m "feat(inventory): add API routes for movements list, adjust, and daily summary"
```

---

## Task 10: Add admin client methods and query keys

**Files:**
- Modify: `apps/admin/services/admin.client.ts`
- Modify: `apps/admin/lib/query-keys.ts`

- [ ] **Step 1: Add types**

At the top of `admin.client.ts` (or a separate types file if one exists), add:

```typescript
export type InventoryMovement = {
  id: string;
  variantId: string;
  variantSku: string;
  variantName: string;
  type: "stock_out" | "supplier_receipt" | "manual_adjustment" | "cancellation";
  quantity: number;
  onHandBefore: number;
  onHandAfter: number;
  referenceId: string | null;
  note: string | null;
  createdAt: string;
  createdByName: string | null;
};

export type DailySummaryRow = {
  date: string;
  totalIn: number;
  totalOut: number;
};
```

- [ ] **Step 2: Add methods to admin client**

In `apps/admin/services/admin.client.ts`, add these methods to the client object:

```typescript
async getInventoryMovements(params?: {
  variantId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return axios.get<{ data: InventoryMovement[]; metadata: { total: number; page: number; totalPages: number } }>(
    API_ENDPOINTS.ADMIN.INVENTORY.MOVEMENTS,
    { params },
  ) as unknown as Promise<{ data: InventoryMovement[]; metadata: { total: number; page: number; totalPages: number } }>;
},

async getInventoryDailySummary(params?: {
  variantId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return axios.get<{ data: DailySummaryRow[] }>(
    API_ENDPOINTS.ADMIN.INVENTORY.DAILY_SUMMARY,
    { params },
  ) as unknown as Promise<{ data: DailySummaryRow[] }>;
},

async adjustInventory(body: { variantId: string; quantity: number; note?: string }) {
  return axios.post<InventoryMovement>(
    API_ENDPOINTS.ADMIN.INVENTORY.ADJUST,
    body,
  ) as unknown as Promise<InventoryMovement>;
},
```

- [ ] **Step 3: Add query keys**

In `apps/admin/lib/query-keys.ts`, add inventory keys. Follow the existing pattern in the file:

```typescript
inventory: {
  movements: (params: Record<string, unknown>) =>
    ["admin", "inventory", "movements", params] as const,
  dailySummary: (params: Record<string, unknown>) =>
    ["admin", "inventory", "daily-summary", params] as const,
},
```

- [ ] **Step 4: Verify TypeScript**

```bash
pnpm --filter admin exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add apps/admin/services/admin.client.ts apps/admin/lib/query-keys.ts
git commit -m "feat(inventory): add admin client methods and query keys for inventory history"
```

---

## Task 11: Create inventory history page

**Files:**
- Create: `apps/admin/app/(dashboard)/inventory/history/page.tsx`

- [ ] **Step 1: Create the page**

Create `apps/admin/app/(dashboard)/inventory/history/page.tsx`:

```typescript
"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { DataTable } from "@workspace/ui/components/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { adminClient, type InventoryMovement } from "@/services/admin.client";
import { queryKeys } from "@/lib/query-keys";

const MOVEMENT_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  stock_out: { label: "Xuất kho", variant: "destructive" },
  supplier_receipt: { label: "Nhập hàng", variant: "default" },
  manual_adjustment: { label: "Điều chỉnh", variant: "secondary" },
  cancellation: { label: "Hoàn hàng", variant: "outline" },
};

const movementColumns: ColumnDef<InventoryMovement>[] = [
  {
    accessorKey: "createdAt",
    header: "Thời gian",
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleString("vi-VN"),
  },
  {
    accessorKey: "variantSku",
    header: "SKU",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.variantSku}</div>
        <div className="text-xs text-muted-foreground">{row.original.variantName}</div>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Loại",
    cell: ({ row }) => {
      const cfg = MOVEMENT_LABELS[row.original.type];
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
    },
  },
  {
    accessorKey: "quantity",
    header: "Số lượng",
    cell: ({ row }) => {
      const qty = row.original.quantity;
      return (
        <span className={qty > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
          {qty > 0 ? `+${qty}` : qty}
        </span>
      );
    },
  },
  {
    id: "onHand",
    header: "Tồn kho",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        {row.original.onHandBefore} → {row.original.onHandAfter}
      </span>
    ),
  },
  {
    accessorKey: "createdByName",
    header: "Người thực hiện",
    cell: ({ row }) => row.original.createdByName ?? "Hệ thống",
  },
  {
    accessorKey: "note",
    header: "Ghi chú",
    cell: ({ row }) => row.original.note ?? "—",
  },
];

function MovementsTab() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.inventory.movements({ page, limit }),
    queryFn: () => adminClient.getInventoryMovements({ page, limit }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });

  const movements = data?.data ?? [];
  const metadata = data?.metadata;

  return (
    <DataTable
      columns={movementColumns}
      data={movements}
      isLoading={isLoading}
      isFetching={isFetching}
      pageCount={metadata?.totalPages ?? 1}
      pagination={{ pageIndex: page - 1, pageSize: limit }}
      onPaginationChange={(p) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(p.pageIndex + 1));
        router.push(`${pathname}?${params.toString()}`);
      }}
      emptyMessage="Chưa có giao dịch kho nào."
    />
  );
}

function DailySummaryTab() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.inventory.dailySummary({}),
    queryFn: () => adminClient.getInventoryDailySummary(),
    staleTime: 1000 * 60 * 5,
  });

  const rows = data?.data ?? [];

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2 text-left">Ngày</th>
            <th className="px-4 py-2 text-right text-green-700">Nhập</th>
            <th className="px-4 py-2 text-right text-red-700">Xuất</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Chưa có dữ liệu.</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.date} className="border-b">
                <td className="px-4 py-2">{row.date}</td>
                <td className="px-4 py-2 text-right text-green-600 font-medium">+{Number(row.totalIn)}</td>
                <td className="px-4 py-2 text-right text-red-600 font-medium">-{Number(row.totalOut)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function InventoryHistoryContent() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Lịch sử kho</h1>
        <p className="text-muted-foreground text-sm">Theo dõi nhập xuất tồn kho</p>
      </div>

      <Tabs defaultValue="movements">
        <TabsList>
          <TabsTrigger value="movements">Giao dịch</TabsTrigger>
          <TabsTrigger value="daily">Tổng hợp theo ngày</TabsTrigger>
        </TabsList>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danh sách giao dịch</CardTitle>
            </CardHeader>
            <CardContent>
              <MovementsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tổng hợp theo ngày</CardTitle>
            </CardHeader>
            <CardContent>
              <DailySummaryTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function InventoryHistoryPage() {
  return (
    <Suspense fallback={<div />}>
      <InventoryHistoryContent />
    </Suspense>
  );
}
```

> Check if `Tabs` is already exported from `@workspace/ui/components/tabs` — if not, use the one available in the admin app or add it.

- [ ] **Step 2: Check Tabs component exists**

```bash
ls apps/admin/components/ | grep tab
ls packages/ui/src/components/ | grep tab
```

If `tabs.tsx` exists in `packages/ui`, import from `@workspace/ui/components/tabs`. Otherwise use shadcn/ui directly.

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm --filter admin exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/admin/app/\(dashboard\)/inventory/
git commit -m "feat(inventory): add inventory history page with transactions and daily summary"
```

---

## Task 12: Add variant inventory history to product edit sheet

**Files:**
- Modify: `apps/admin/components/admin/products/product-edit-sheet.tsx`

- [ ] **Step 1: Add query for variant movements**

In `product-edit-sheet.tsx`, add a `useQuery` for inventory movements of the current variant. Find how the sheet receives `variantId` (likely as a prop) and add:

```typescript
const { data: movementsData, isLoading: movementsLoading } = useQuery({
  queryKey: queryKeys.inventory.movements({ variantId, limit: 10, page: 1 }),
  queryFn: () => adminClient.getInventoryMovements({ variantId, limit: 10, page: 1 }),
  enabled: !!variantId,
  staleTime: 1000 * 60,
});

const movements = movementsData?.data ?? [];
```

- [ ] **Step 2: Add history section to sheet content**

After the existing cost price history section in the sheet (or at the bottom of the sheet content), add:

```typescript
<div className="space-y-2">
  <h3 className="text-sm font-medium">Lịch sử kho</h3>
  {movementsLoading ? (
    <p className="text-xs text-muted-foreground">Đang tải...</p>
  ) : movements.length === 0 ? (
    <p className="text-xs text-muted-foreground">Chưa có giao dịch nào.</p>
  ) : (
    <div className="space-y-1">
      {movements.map((m) => {
        const cfg = MOVEMENT_LABELS[m.type];
        return (
          <div key={m.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
            <div className="flex items-center gap-2">
              <Badge variant={cfg.variant} className="text-[10px] px-1 py-0">{cfg.label}</Badge>
              <span className="text-muted-foreground">
                {new Date(m.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <span className={m.quantity > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
            </span>
          </div>
        );
      })}
    </div>
  )}
</div>
```

Import `MOVEMENT_LABELS` from the history page or define it locally (copy the same object).

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm --filter admin exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/admin/components/admin/products/product-edit-sheet.tsx
git commit -m "feat(inventory): show variant inventory history in product edit sheet"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Covered by |
|-----------------|-----------|
| Allow stock-out when onHand goes negative | Task 1 — remove check in `stockOut()` |
| Keep UI warnings, don't block | No UI change needed — warnings already non-blocking |
| Remove negative onHand invariant | Task 2 |
| `inventory_movements` table | Task 3, 4 |
| Record on: stock_out | Task 7 |
| Record on: supplier_receipt | Task 8 |
| Record on: manual_adjustment | Task 6 (service) + Task 9 (API) |
| Record on: cancellation (future) | Schema has the type, deferred |
| GET /movements API | Task 9 |
| GET /daily-summary API | Task 9 |
| POST /adjust API | Task 9 |
| Admin client methods | Task 10 |
| `/inventory/history` page with 2 tabs | Task 11 |
| Per-variant history in product edit | Task 12 |

All requirements covered. Cancellation (post-stock-out) is deferred per spec.
