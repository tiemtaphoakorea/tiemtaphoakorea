import {
  ERROR_MESSAGE,
  SUPPLIER_ORDER_STATUS,
  SUPPLIER_ORDER_STATUS_ALL,
} from "@workspace/shared/constants";
import { and, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { db } from "../db";
import { supplierOrders } from "../schema/orders";
import { products, productVariants } from "../schema/products";
import type { DbTransaction } from "../types/database";

/** Đơn nhập hàng và đơn bán tạo riêng, không kết nối với nhau. Supplier order chỉ gắn variantId. */
export async function getSupplierOrders({
  search = "",
  status = SUPPLIER_ORDER_STATUS_ALL,
}: {
  search?: string;
  status?: string;
} = {}) {
  const whereConditions: SQL[] = [];

  if (search) {
    whereConditions.push(
      or(
        ilike(productVariants.sku, `%${search}%`),
        ilike(products.name, `%${search}%`),
        ilike(productVariants.name, `%${search}%`),
        // Allow searching by metadata in note (e.g. auto-created via specific order number)
        ilike(supplierOrders.note, `%${search}%`),
      )!,
    );
  }

  if (status !== SUPPLIER_ORDER_STATUS_ALL) {
    // @ts-expect-error
    whereConditions.push(eq(supplierOrders.status, status));
  }

  const results = await db
    .select({
      id: supplierOrders.id,
      variantId: supplierOrders.variantId,
      status: supplierOrders.status,
      quantity: supplierOrders.quantity,
      createdAt: supplierOrders.createdAt,
      orderedAt: supplierOrders.orderedAt,
      receivedAt: supplierOrders.receivedAt,
      expectedDate: supplierOrders.expectedDate,
      actualCostPrice: supplierOrders.actualCostPrice,
      note: supplierOrders.note,
      productName: products.name,
      variantName: productVariants.name,
      variantSku: productVariants.sku,
    })
    .from(supplierOrders)
    .leftJoin(productVariants, eq(supplierOrders.variantId, productVariants.id))
    .leftJoin(products, eq(productVariants.productId, products.id))
    .where(and(...whereConditions))
    .orderBy(desc(supplierOrders.createdAt));

  return results.map((r) => ({
    id: r.id,
    variantId: r.variantId ?? undefined,
    status: r.status,
    quantity: r.quantity,
    createdAt: r.createdAt,
    orderedAt: r.orderedAt,
    receivedAt: r.receivedAt,
    expectedDate: r.expectedDate,
    actualCostPrice: r.actualCostPrice,
    note: r.note,
    item: {
      productName: r.productName ?? undefined,
      variantName: r.variantName ?? undefined,
      sku: r.variantSku ?? undefined,
    },
  }));
}

export async function getSupplierOrderDetails(id: string) {
  const [result] = await db
    .select({
      id: supplierOrders.id,
      status: supplierOrders.status,
      quantity: supplierOrders.quantity,
      createdAt: supplierOrders.createdAt,
      orderedAt: supplierOrders.orderedAt,
      receivedAt: supplierOrders.receivedAt,
      expectedDate: supplierOrders.expectedDate,
      actualCostPrice: supplierOrders.actualCostPrice,
      note: supplierOrders.note,
      productName: products.name,
      variantName: productVariants.name,
      variantSku: productVariants.sku,
    })
    .from(supplierOrders)
    .leftJoin(productVariants, eq(supplierOrders.variantId, productVariants.id))
    .leftJoin(products, eq(productVariants.productId, products.id))
    .where(eq(supplierOrders.id, id));

  if (!result) return null;

  return {
    id: result.id,
    status: result.status,
    quantity: result.quantity,
    createdAt: result.createdAt,
    orderedAt: result.orderedAt,
    receivedAt: result.receivedAt,
    expectedDate: result.expectedDate,
    actualCostPrice: result.actualCostPrice,
    note: result.note,
    item: {
      productName: result.productName ?? undefined,
      variantName: result.variantName ?? undefined,
      sku: result.variantSku ?? undefined,
    },
  };
}

export async function createSupplierOrders(data: {
  items: Array<{
    variantId: string;
    quantity: number;
    expectedDate?: Date;
    note?: string;
  }>;
  createdBy: string;
  supplierId?: string;
}) {
  const values = data.items.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
    expectedDate: item.expectedDate,
    note: item.note,
    createdBy: data.createdBy,
    supplierId: data.supplierId,
    status: SUPPLIER_ORDER_STATUS.PENDING,
  }));

  const results = await db.insert(supplierOrders).values(values).returning();
  return results;
}

export async function updateSupplierOrderStatus(
  id: string,
  status: (typeof SUPPLIER_ORDER_STATUS)[keyof typeof SUPPLIER_ORDER_STATUS],
  data: {
    note?: string;
    actualCostPrice?: string;
    expectedDate?: Date;
  } = {},
) {
  return await db.transaction(async (tx: DbTransaction) => {
    // 1. Get current supplier order first to check existing timestamps
    // Use select with for update to lock the row
    const [row] = await tx
      .select()
      .from(supplierOrders)
      .where(eq(supplierOrders.id, id))
      .for("update");

    if (!row) {
      throw new Error(ERROR_MESSAGE.SUPPLIER_ORDER.NOT_FOUND);
    }

    const updates: {
      status: typeof status;
      updatedAt: Date;
      orderedAt?: Date;
      receivedAt?: Date;
      note?: string;
      actualCostPrice?: string;
      expectedDate?: Date;
    } = {
      status,
      updatedAt: new Date(),
    };

    // Only set timestamps on first transition to that status
    if (status === SUPPLIER_ORDER_STATUS.ORDERED && !row.orderedAt) {
      updates.orderedAt = new Date();
    }
    if (status === SUPPLIER_ORDER_STATUS.RECEIVED && !row.receivedAt) {
      updates.receivedAt = new Date();
    }

    if (data.note !== undefined) updates.note = data.note;
    if (data.actualCostPrice) updates.actualCostPrice = data.actualCostPrice;
    if (data.expectedDate) updates.expectedDate = data.expectedDate;

    // Validate transition: Once RECEIVED or CANCELLED, status is final.
    if (
      (row.status === SUPPLIER_ORDER_STATUS.RECEIVED ||
        row.status === SUPPLIER_ORDER_STATUS.CANCELLED) &&
      row.status !== status
    ) {
      throw new Error(`Cannot change status from ${row.status} to ${status}`);
    }

    // 2. If status is changing to 'received', update stock (supplier order chỉ gắn variantId)
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
            .set({
              stockQuantity: (variant.stockQuantity || 0) + row.quantity,
            })
            .where(eq(productVariants.id, variantId));
        }
      }
    }

    // 3. Update Supplier Order
    const [updated] = await tx
      .update(supplierOrders)
      .set(updates)
      .where(eq(supplierOrders.id, id))
      .returning();

    return updated;
  });
}

export async function deleteSupplierOrder(id: string) {
  const [current] = await db
    .select({ id: supplierOrders.id, status: supplierOrders.status })
    .from(supplierOrders)
    .where(eq(supplierOrders.id, id));

  if (!current) {
    throw new Error(ERROR_MESSAGE.SUPPLIER_ORDER.NOT_FOUND);
  }

  if (current.status !== SUPPLIER_ORDER_STATUS.CANCELLED) {
    throw new Error(
      `Cannot delete supplier order with status "${current.status}". Only cancelled orders can be deleted.`,
    );
  }

  await db.delete(supplierOrders).where(eq(supplierOrders.id, id));
  return { success: true, deletedSupplierOrderId: id };
}

export async function getSupplierStats(supplierId: string) {
  // Get supplier order statistics
  const stats = await db
    .select({
      totalOrders: sql<number>`count(*)`.mapWith(Number),
      pendingOrders:
        sql<number>`count(*) filter (where ${supplierOrders.status} = ${SUPPLIER_ORDER_STATUS.PENDING})`.mapWith(
          Number,
        ),
      orderedOrders:
        sql<number>`count(*) filter (where ${supplierOrders.status} = ${SUPPLIER_ORDER_STATUS.ORDERED})`.mapWith(
          Number,
        ),
      receivedOrders:
        sql<number>`count(*) filter (where ${supplierOrders.status} = ${SUPPLIER_ORDER_STATUS.RECEIVED})`.mapWith(
          Number,
        ),
    })
    .from(supplierOrders)
    .where(eq(supplierOrders.supplierId, supplierId));

  // Get recent orders
  const recentOrders = await db
    .select({
      id: supplierOrders.id,
      status: supplierOrders.status,
      quantity: supplierOrders.quantity,
      createdAt: supplierOrders.createdAt,
      expectedDate: supplierOrders.expectedDate,
      productName: products.name,
      variantName: productVariants.name,
      sku: productVariants.sku,
    })
    .from(supplierOrders)
    .leftJoin(productVariants, eq(supplierOrders.variantId, productVariants.id))
    .leftJoin(products, eq(productVariants.productId, products.id))
    .where(eq(supplierOrders.supplierId, supplierId))
    .orderBy(desc(supplierOrders.createdAt))
    .limit(10);

  return {
    stats: stats[0] || {
      totalOrders: 0,
      pendingOrders: 0,
      orderedOrders: 0,
      receivedOrders: 0,
    },
    recentOrders,
  };
}
