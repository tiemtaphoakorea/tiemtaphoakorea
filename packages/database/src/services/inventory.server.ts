import { and, count, desc, eq, gte, lte, type SQL, sql } from "drizzle-orm";
import { db } from "../db";
import { inventoryMovements } from "../schema/inventory";
import { productVariants } from "../schema/products";
import { profiles } from "../schema/profiles";
import type { DbTransaction } from "../types/database";

export type MovementType = "stock_out" | "supplier_receipt" | "manual_adjustment" | "cancellation";

export async function insertInventoryMovement(
  tx: DbTransaction,
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
  const conditions: SQL[] = [];
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
  const conditions: SQL[] = [];
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
