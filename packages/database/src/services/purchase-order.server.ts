import {
  DOC_PREFIX,
  PURCHASE_ORDER_STATUS,
  type PurchaseOrderStatusValue,
} from "@workspace/shared/constants";
import { and, count, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { db } from "../db";
import { products, productVariants } from "../schema/products";
import { profiles } from "../schema/profiles";
import { purchaseOrderItems, purchaseOrders } from "../schema/purchases";
import { suppliers } from "../schema/suppliers";
import type { DbTransaction } from "../types/database";
import { nextDocumentCode } from "./document-code.server";

export type PurchaseOrderInputItem = {
  variantId: string;
  orderedQty: number;
  unitCost: string;
  discount?: string;
  note?: string;
};

export type PurchaseOrderListFilter = {
  search?: string;
  status?: PurchaseOrderStatusValue | "All";
  supplierId?: string;
  page?: number;
  limit?: number;
};

export type PurchaseOrderListRow = Awaited<ReturnType<typeof listPurchaseOrders>>["data"][number];

const ALL = "All";

function toMoney(n: number | string): string {
  return Number(n).toFixed(2);
}

function lineSubtotal(item: PurchaseOrderInputItem): string {
  const total = Number(item.unitCost) * item.orderedQty - Number(item.discount ?? 0);
  return toMoney(total);
}

function aggregate(items: PurchaseOrderInputItem[]) {
  let totalQty = 0;
  let totalAmount = 0;
  let discountAmount = 0;
  for (const item of items) {
    totalQty += item.orderedQty;
    totalAmount += Number(item.unitCost) * item.orderedQty;
    discountAmount += Number(item.discount ?? 0);
  }
  return {
    totalQty,
    totalAmount: toMoney(totalAmount),
    discountAmount: toMoney(discountAmount),
  };
}

/** Recompute PO status from current item received quantities. */
async function recomputePurchaseOrderStatus(
  tx: DbTransaction,
  purchaseOrderId: string,
): Promise<PurchaseOrderStatusValue> {
  const [current] = await tx
    .select({ status: purchaseOrders.status })
    .from(purchaseOrders)
    .where(eq(purchaseOrders.id, purchaseOrderId))
    .for("update");

  if (!current) throw new Error("Purchase order not found");
  // Cancelled is terminal; never overwrite.
  if (current.status === PURCHASE_ORDER_STATUS.CANCELLED) return current.status;

  const items = await tx
    .select({
      orderedQty: purchaseOrderItems.orderedQty,
      receivedQty: purchaseOrderItems.receivedQty,
    })
    .from(purchaseOrderItems)
    .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));

  if (items.length === 0) return current.status as PurchaseOrderStatusValue;

  const allReceived = items.every((i) => i.receivedQty >= i.orderedQty);
  const anyReceived = items.some((i) => i.receivedQty > 0);

  let next: PurchaseOrderStatusValue;
  if (allReceived) next = PURCHASE_ORDER_STATUS.RECEIVED;
  else if (anyReceived) next = PURCHASE_ORDER_STATUS.PARTIAL;
  else if (current.status === PURCHASE_ORDER_STATUS.DRAFT) next = PURCHASE_ORDER_STATUS.DRAFT;
  else next = PURCHASE_ORDER_STATUS.ORDERED;

  if (next === current.status) return next;

  await tx
    .update(purchaseOrders)
    .set({
      status: next,
      completedAt: next === PURCHASE_ORDER_STATUS.RECEIVED ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(purchaseOrders.id, purchaseOrderId));

  return next;
}

export async function listPurchaseOrders(filter: PurchaseOrderListFilter = {}) {
  const conditions: SQL[] = [];

  if (filter.search) {
    conditions.push(
      or(
        ilike(purchaseOrders.code, `%${filter.search}%`),
        ilike(purchaseOrders.note, `%${filter.search}%`),
        ilike(suppliers.name, `%${filter.search}%`),
      )!,
    );
  }
  if (filter.status && filter.status !== ALL) {
    conditions.push(eq(purchaseOrders.status, filter.status));
  }
  if (filter.supplierId) {
    conditions.push(eq(purchaseOrders.supplierId, filter.supplierId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const page = Math.max(1, filter.page ?? 1);
  const limit = Math.max(1, Math.min(filter.limit ?? 25, 200));

  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: purchaseOrders.id,
        code: purchaseOrders.code,
        status: purchaseOrders.status,
        supplierId: purchaseOrders.supplierId,
        supplierName: suppliers.name,
        totalQty: purchaseOrders.totalQty,
        totalAmount: purchaseOrders.totalAmount,
        discountAmount: purchaseOrders.discountAmount,
        orderedAt: purchaseOrders.orderedAt,
        expectedDate: purchaseOrders.expectedDate,
        completedAt: purchaseOrders.completedAt,
        createdAt: purchaseOrders.createdAt,
        createdByName: profiles.fullName,
        note: purchaseOrders.note,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .leftJoin(profiles, eq(purchaseOrders.createdBy, profiles.id))
      .where(where)
      .orderBy(desc(purchaseOrders.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ total: count() })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .where(where),
  ]);

  return {
    data,
    metadata: {
      total: Number(total),
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(Number(total) / limit)),
    },
  };
}

export async function getPurchaseOrderById(id: string) {
  const [header] = await db
    .select({
      id: purchaseOrders.id,
      code: purchaseOrders.code,
      status: purchaseOrders.status,
      supplierId: purchaseOrders.supplierId,
      supplierName: suppliers.name,
      branchId: purchaseOrders.branchId,
      orderedAt: purchaseOrders.orderedAt,
      expectedDate: purchaseOrders.expectedDate,
      completedAt: purchaseOrders.completedAt,
      cancelledAt: purchaseOrders.cancelledAt,
      totalQty: purchaseOrders.totalQty,
      totalAmount: purchaseOrders.totalAmount,
      discountAmount: purchaseOrders.discountAmount,
      note: purchaseOrders.note,
      createdBy: purchaseOrders.createdBy,
      createdByName: profiles.fullName,
      confirmedBy: purchaseOrders.confirmedBy,
      createdAt: purchaseOrders.createdAt,
      updatedAt: purchaseOrders.updatedAt,
    })
    .from(purchaseOrders)
    .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
    .leftJoin(profiles, eq(purchaseOrders.createdBy, profiles.id))
    .where(eq(purchaseOrders.id, id));

  if (!header) return null;

  const items = await db
    .select({
      id: purchaseOrderItems.id,
      variantId: purchaseOrderItems.variantId,
      orderedQty: purchaseOrderItems.orderedQty,
      receivedQty: purchaseOrderItems.receivedQty,
      unitCost: purchaseOrderItems.unitCost,
      discount: purchaseOrderItems.discount,
      lineTotal: purchaseOrderItems.lineTotal,
      note: purchaseOrderItems.note,
      productName: products.name,
      variantName: productVariants.name,
      sku: productVariants.sku,
    })
    .from(purchaseOrderItems)
    .leftJoin(productVariants, eq(purchaseOrderItems.variantId, productVariants.id))
    .leftJoin(products, eq(productVariants.productId, products.id))
    .where(eq(purchaseOrderItems.purchaseOrderId, id))
    .orderBy(purchaseOrderItems.createdAt);

  return { ...header, items };
}

export async function createPurchaseOrder(input: {
  supplierId?: string;
  branchId?: string;
  expectedDate?: Date;
  note?: string;
  items: PurchaseOrderInputItem[];
  createdBy: string;
}) {
  if (input.items.length === 0) {
    throw new Error("Cần ít nhất 1 sản phẩm cho đơn nhập");
  }

  return db.transaction(async (tx) => {
    const code = await nextDocumentCode(tx, DOC_PREFIX.PURCHASE_ORDER);
    const totals = aggregate(input.items);

    const [header] = await tx
      .insert(purchaseOrders)
      .values({
        code,
        supplierId: input.supplierId,
        branchId: input.branchId,
        status: PURCHASE_ORDER_STATUS.DRAFT,
        expectedDate: input.expectedDate,
        totalQty: totals.totalQty,
        totalAmount: totals.totalAmount,
        discountAmount: totals.discountAmount,
        note: input.note,
        createdBy: input.createdBy,
      })
      .returning();

    if (!header) throw new Error("Failed to create purchase order");

    await tx.insert(purchaseOrderItems).values(
      input.items.map((item) => ({
        purchaseOrderId: header.id,
        variantId: item.variantId,
        orderedQty: item.orderedQty,
        receivedQty: 0,
        unitCost: toMoney(item.unitCost),
        discount: toMoney(item.discount ?? 0),
        lineTotal: lineSubtotal(item),
        note: item.note,
      })),
    );

    return header;
  });
}

export async function confirmPurchaseOrder(id: string, confirmedBy: string) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ status: purchaseOrders.status })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id))
      .for("update");

    if (!row) throw new Error("Không tìm thấy đơn nhập");
    if (row.status !== PURCHASE_ORDER_STATUS.DRAFT) {
      throw new Error(`Chỉ confirm được đơn ở trạng thái nháp (hiện: ${row.status})`);
    }

    const [updated] = await tx
      .update(purchaseOrders)
      .set({
        status: PURCHASE_ORDER_STATUS.ORDERED,
        orderedAt: new Date(),
        confirmedBy,
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrders.id, id))
      .returning();

    return updated;
  });
}

export async function cancelPurchaseOrder(id: string) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ status: purchaseOrders.status })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id))
      .for("update");

    if (!row) throw new Error("Không tìm thấy đơn nhập");
    if (row.status === PURCHASE_ORDER_STATUS.RECEIVED) {
      throw new Error("Không thể huỷ đơn đã nhận hàng");
    }

    const [updated] = await tx
      .update(purchaseOrders)
      .set({
        status: PURCHASE_ORDER_STATUS.CANCELLED,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrders.id, id))
      .returning();

    return updated;
  });
}

/**
 * Apply received quantities back onto the PO and recompute its status.
 * Called from the goods-receipt service when a receipt is completed.
 */
export async function applyReceiptToPurchaseOrder(
  tx: DbTransaction,
  purchaseOrderId: string,
  receivedItems: Array<{ purchaseOrderItemId: string; quantity: number }>,
) {
  for (const item of receivedItems) {
    await tx
      .update(purchaseOrderItems)
      .set({
        receivedQty: sql`${purchaseOrderItems.receivedQty} + ${item.quantity}`,
      })
      .where(eq(purchaseOrderItems.id, item.purchaseOrderItemId));
  }
  await recomputePurchaseOrderStatus(tx, purchaseOrderId);
}

/** Reverse receipt qty when a receipt is cancelled. */
export async function reverseReceiptFromPurchaseOrder(
  tx: DbTransaction,
  purchaseOrderId: string,
  receivedItems: Array<{ purchaseOrderItemId: string; quantity: number }>,
) {
  for (const item of receivedItems) {
    await tx
      .update(purchaseOrderItems)
      .set({
        receivedQty: sql`GREATEST(${purchaseOrderItems.receivedQty} - ${item.quantity}, 0)`,
      })
      .where(eq(purchaseOrderItems.id, item.purchaseOrderItemId));
  }
  await recomputePurchaseOrderStatus(tx, purchaseOrderId);
}
