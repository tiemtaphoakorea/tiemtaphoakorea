import { DOC_PREFIX, RECEIPT_STATUS, type ReceiptStatusValue } from "@workspace/shared/constants";
import { and, count, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { db } from "../db";
import type { PaymentStatus } from "../schema/enums";
import { costPriceHistory, products, productVariants } from "../schema/products";
import { profiles } from "../schema/profiles";
import { goodsReceiptItems, goodsReceipts, supplierPayments } from "../schema/receipts";
import { suppliers } from "../schema/suppliers";
import type { DbTransaction } from "../types/database";
import { nextDocumentCode } from "./document-code.server";
import { insertInventoryMovement } from "./inventory.server";
import {
  applyReceiptToPurchaseOrder,
  reverseReceiptFromPurchaseOrder,
} from "./purchase-order.server";

const ALL = "All";

export type ReceiptInputItem = {
  variantId: string;
  purchaseOrderItemId?: string;
  quantity: number;
  unitCost: string;
  discount?: string;
  note?: string;
};

export type ReceiptListFilter = {
  search?: string;
  status?: ReceiptStatusValue | "All";
  supplierId?: string;
  paymentStatus?: PaymentStatus;
  page?: number;
  limit?: number;
};

function toMoney(n: number | string): string {
  return Number(n).toFixed(2);
}

function lineSubtotal(item: ReceiptInputItem): string {
  return toMoney(Number(item.unitCost) * item.quantity - Number(item.discount ?? 0));
}

function aggregate(items: ReceiptInputItem[], extraCost = 0, headerDiscount = 0) {
  let totalQty = 0;
  let totalAmount = 0;
  let lineDiscount = 0;
  for (const item of items) {
    totalQty += item.quantity;
    totalAmount += Number(item.unitCost) * item.quantity;
    lineDiscount += Number(item.discount ?? 0);
  }
  const discountAmount = lineDiscount + headerDiscount;
  const payableAmount = totalAmount - discountAmount + extraCost;
  return {
    totalQty,
    totalAmount: toMoney(totalAmount),
    discountAmount: toMoney(discountAmount),
    extraCost: toMoney(extraCost),
    payableAmount: toMoney(payableAmount),
  };
}

function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && Array.isArray((result as { rows?: unknown }).rows)) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}

/**
 * Continuous Weighted Average Cost (WAC) — Sapo-style.
 * Atomically recompute productVariants.costPrice for each received variant
 * and log a costPriceHistory row when the cost changes.
 */
/**
 * Recompute Weighted Average Cost (WAC) for every variant on a completed receipt.
 *
 * Runs AFTER stock-in has incremented `product_variants.on_hand`. To recover the
 * pre-receipt qty, we back out the incoming qty from current on_hand.
 *
 * Formula (Sapo-style WAC):
 *   newCost = (oldCost × oldQty + incomingCost) / (oldQty + incomingQty)
 *     where oldQty = on_hand_now − incomingQty
 * Fallback when oldQty ≤ 0 (zero or negative pre-stock):
 *   newCost = incomingCost / incomingQty
 *
 * Math is done in PG `numeric` to avoid JS float drift; result rounded to 2 dp.
 * Free/gift receipts (incomingCost = 0) preserve the existing costPrice.
 */
async function applyWeightedAverageCost(
  tx: DbTransaction,
  receiptId: string,
  effectiveDate: Date,
  createdBy?: string,
) {
  // Aggregate incoming qty + cost per variant directly in SQL so the SUM is
  // done with PG numeric (zero float drift) and dedup happens at the source.
  const aggResult = rowsOf<{ variantId: string; qty: number; cost: string }>(
    await tx.execute(sql`
      SELECT
        variant_id AS "variantId",
        SUM(quantity)::int AS qty,
        SUM(unit_cost::numeric * quantity)::text AS cost
      FROM goods_receipt_items
      WHERE receipt_id = ${receiptId}
      GROUP BY variant_id
    `),
  );

  for (const agg of aggResult) {
    // R5: free/gift receipt preserves existing WAC, skip update entirely.
    if (Number(agg.cost) <= 0) continue;

    // Single round-trip: select current state, compute newCost in numeric, return both.
    const computed = rowsOf<{ old_cost: string; new_cost: string | null }>(
      await tx.execute(sql`
        SELECT
          cost_price AS old_cost,
          ROUND(
            CASE
              WHEN (on_hand - ${agg.qty}::int) <= 0
                THEN ${agg.cost}::numeric / NULLIF(${agg.qty}::numeric, 0)
              ELSE (cost_price::numeric * (on_hand - ${agg.qty}::int) + ${agg.cost}::numeric)
                   / NULLIF(on_hand::numeric, 0)
            END,
            2
          )::text AS new_cost
        FROM product_variants
        WHERE id = ${agg.variantId}
        FOR UPDATE
      `),
    );

    const row = computed[0];
    if (!row || !row.new_cost) continue;
    if (Number(row.new_cost) === Number(row.old_cost)) continue;

    await tx
      .update(productVariants)
      .set({ costPrice: row.new_cost })
      .where(eq(productVariants.id, agg.variantId));

    await tx.insert(costPriceHistory).values({
      variantId: agg.variantId,
      costPrice: row.new_cost,
      effectiveDate,
      note: `WAC update from supplier receipt (prev cost: ${row.old_cost})`,
      createdBy,
    });
  }
}

export async function listGoodsReceipts(filter: ReceiptListFilter = {}) {
  const conditions: SQL[] = [];

  if (filter.search) {
    conditions.push(
      or(
        ilike(goodsReceipts.code, `%${filter.search}%`),
        ilike(goodsReceipts.note, `%${filter.search}%`),
        ilike(suppliers.name, `%${filter.search}%`),
      )!,
    );
  }
  if (filter.status && filter.status !== ALL) {
    conditions.push(eq(goodsReceipts.status, filter.status));
  }
  if (filter.supplierId) {
    conditions.push(eq(goodsReceipts.supplierId, filter.supplierId));
  }
  if (filter.paymentStatus) {
    conditions.push(eq(goodsReceipts.paymentStatus, filter.paymentStatus));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const page = Math.max(1, filter.page ?? 1);
  const limit = Math.max(1, Math.min(filter.limit ?? 25, 200));

  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: goodsReceipts.id,
        code: goodsReceipts.code,
        status: goodsReceipts.status,
        supplierId: goodsReceipts.supplierId,
        supplierName: suppliers.name,
        purchaseOrderId: goodsReceipts.purchaseOrderId,
        receivedAt: goodsReceipts.receivedAt,
        totalQty: goodsReceipts.totalQty,
        totalAmount: goodsReceipts.totalAmount,
        payableAmount: goodsReceipts.payableAmount,
        paidAmount: goodsReceipts.paidAmount,
        debtAmount: goodsReceipts.debtAmount,
        paymentStatus: goodsReceipts.paymentStatus,
        createdAt: goodsReceipts.createdAt,
        createdByName: profiles.fullName,
        note: goodsReceipts.note,
      })
      .from(goodsReceipts)
      .leftJoin(suppliers, eq(goodsReceipts.supplierId, suppliers.id))
      .leftJoin(profiles, eq(goodsReceipts.createdBy, profiles.id))
      .where(where)
      .orderBy(desc(goodsReceipts.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ total: count() })
      .from(goodsReceipts)
      .leftJoin(suppliers, eq(goodsReceipts.supplierId, suppliers.id))
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

export async function getGoodsReceiptById(id: string) {
  const [header] = await db
    .select({
      id: goodsReceipts.id,
      code: goodsReceipts.code,
      status: goodsReceipts.status,
      supplierId: goodsReceipts.supplierId,
      supplierName: suppliers.name,
      branchId: goodsReceipts.branchId,
      purchaseOrderId: goodsReceipts.purchaseOrderId,
      receivedAt: goodsReceipts.receivedAt,
      invoiceDate: goodsReceipts.invoiceDate,
      invoiceRef: goodsReceipts.invoiceRef,
      totalQty: goodsReceipts.totalQty,
      totalAmount: goodsReceipts.totalAmount,
      discountAmount: goodsReceipts.discountAmount,
      extraCost: goodsReceipts.extraCost,
      payableAmount: goodsReceipts.payableAmount,
      paidAmount: goodsReceipts.paidAmount,
      debtAmount: goodsReceipts.debtAmount,
      paymentStatus: goodsReceipts.paymentStatus,
      note: goodsReceipts.note,
      createdBy: goodsReceipts.createdBy,
      createdByName: profiles.fullName,
      completedBy: goodsReceipts.completedBy,
      cancelledAt: goodsReceipts.cancelledAt,
      createdAt: goodsReceipts.createdAt,
      updatedAt: goodsReceipts.updatedAt,
    })
    .from(goodsReceipts)
    .leftJoin(suppliers, eq(goodsReceipts.supplierId, suppliers.id))
    .leftJoin(profiles, eq(goodsReceipts.createdBy, profiles.id))
    .where(eq(goodsReceipts.id, id));

  if (!header) return null;

  const items = await db
    .select({
      id: goodsReceiptItems.id,
      variantId: goodsReceiptItems.variantId,
      purchaseOrderItemId: goodsReceiptItems.purchaseOrderItemId,
      quantity: goodsReceiptItems.quantity,
      unitCost: goodsReceiptItems.unitCost,
      discount: goodsReceiptItems.discount,
      lineTotal: goodsReceiptItems.lineTotal,
      note: goodsReceiptItems.note,
      productName: products.name,
      variantName: productVariants.name,
      sku: productVariants.sku,
    })
    .from(goodsReceiptItems)
    .leftJoin(productVariants, eq(goodsReceiptItems.variantId, productVariants.id))
    .leftJoin(products, eq(productVariants.productId, products.id))
    .where(eq(goodsReceiptItems.receiptId, id))
    .orderBy(goodsReceiptItems.createdAt);

  return { ...header, items };
}

export async function createGoodsReceipt(input: {
  purchaseOrderId?: string;
  supplierId?: string;
  branchId?: string;
  invoiceDate?: Date;
  invoiceRef?: string;
  extraCost?: string;
  discountAmount?: string;
  note?: string;
  items: ReceiptInputItem[];
  createdBy: string;
}) {
  if (input.items.length === 0) {
    throw new Error("Cần ít nhất 1 sản phẩm cho phiếu nhập");
  }

  return db.transaction(async (tx) => {
    const code = await nextDocumentCode(tx, DOC_PREFIX.GOODS_RECEIPT);
    const totals = aggregate(
      input.items,
      Number(input.extraCost ?? 0),
      Number(input.discountAmount ?? 0),
    );

    const [header] = await tx
      .insert(goodsReceipts)
      .values({
        code,
        purchaseOrderId: input.purchaseOrderId,
        supplierId: input.supplierId,
        branchId: input.branchId,
        status: RECEIPT_STATUS.DRAFT,
        invoiceDate: input.invoiceDate,
        invoiceRef: input.invoiceRef,
        totalQty: totals.totalQty,
        totalAmount: totals.totalAmount,
        discountAmount: totals.discountAmount,
        extraCost: totals.extraCost,
        payableAmount: totals.payableAmount,
        paidAmount: "0",
        debtAmount: totals.payableAmount,
        paymentStatus: "unpaid",
        note: input.note,
        createdBy: input.createdBy,
      })
      .returning();

    if (!header) throw new Error("Failed to create goods receipt");

    await tx.insert(goodsReceiptItems).values(
      input.items.map((item) => ({
        receiptId: header.id,
        purchaseOrderItemId: item.purchaseOrderItemId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitCost: toMoney(item.unitCost),
        discount: toMoney(item.discount ?? 0),
        lineTotal: lineSubtotal(item),
        note: item.note,
      })),
    );

    return header;
  });
}

/**
 * Complete a draft receipt: stock-in, WAC re-cost, sync linked PO status.
 * Idempotent guard: only acts on draft receipts.
 */
export async function completeGoodsReceipt(id: string, completedBy: string) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(goodsReceipts)
      .where(eq(goodsReceipts.id, id))
      .for("update");

    if (!row) throw new Error("Không tìm thấy phiếu nhập");
    if (row.status !== RECEIPT_STATUS.DRAFT) {
      throw new Error(`Chỉ hoàn tất được phiếu ở trạng thái nháp (hiện: ${row.status})`);
    }
    const items = await tx
      .select()
      .from(goodsReceiptItems)
      .where(eq(goodsReceiptItems.receiptId, id));

    const receivedAt = new Date();

    // 1. Stock-in: increment onHand and ledger entry per item.
    for (const item of items) {
      const [variant] = await tx
        .select({ onHand: productVariants.onHand })
        .from(productVariants)
        .where(eq(productVariants.id, item.variantId))
        .for("update");

      if (!variant) continue;

      const onHandBefore = variant.onHand ?? 0;
      await tx
        .update(productVariants)
        .set({ onHand: onHandBefore + item.quantity })
        .where(eq(productVariants.id, item.variantId));

      await insertInventoryMovement(tx, {
        variantId: item.variantId,
        type: "supplier_receipt",
        quantity: item.quantity,
        onHandBefore,
        referenceId: item.id,
        createdBy: completedBy,
      });
    }

    // 2. Apply Sapo-style WAC (aggregate + compute in SQL with PG numeric).
    await applyWeightedAverageCost(tx, id, receivedAt, completedBy);

    // 3. Sync linked PO if any.
    if (row.purchaseOrderId) {
      const linked = items
        .filter((i) => i.purchaseOrderItemId)
        .map((i) => ({ purchaseOrderItemId: i.purchaseOrderItemId!, quantity: i.quantity }));
      if (linked.length > 0) {
        await applyReceiptToPurchaseOrder(tx, row.purchaseOrderId, linked);
      }
    }

    // 4. Mark receipt completed.
    const [updated] = await tx
      .update(goodsReceipts)
      .set({
        status: RECEIPT_STATUS.COMPLETED,
        receivedAt,
        completedBy,
        updatedAt: new Date(),
      })
      .where(eq(goodsReceipts.id, id))
      .returning();

    return updated;
  });
}

/**
 * Cancel a receipt: reverses stock and PO status. Only completed/draft can be
 * cancelled; payment must be cleared first (UI guards against this).
 */
export async function cancelGoodsReceipt(id: string, cancelledBy: string) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(goodsReceipts)
      .where(eq(goodsReceipts.id, id))
      .for("update");

    if (!row) throw new Error("Không tìm thấy phiếu nhập");
    if (row.status === RECEIPT_STATUS.CANCELLED) return row;
    if (Number(row.paidAmount) > 0) {
      throw new Error("Không thể huỷ phiếu đã có thanh toán — vui lòng huỷ phiếu chi trước");
    }

    if (row.status === RECEIPT_STATUS.COMPLETED) {
      const items = await tx
        .select()
        .from(goodsReceiptItems)
        .where(eq(goodsReceiptItems.receiptId, id));

      // Reverse stock with cancellation movement type.
      for (const item of items) {
        const [variant] = await tx
          .select({ onHand: productVariants.onHand })
          .from(productVariants)
          .where(eq(productVariants.id, item.variantId))
          .for("update");

        if (!variant) continue;

        const onHandBefore = variant.onHand ?? 0;
        await tx
          .update(productVariants)
          .set({ onHand: onHandBefore - item.quantity })
          .where(eq(productVariants.id, item.variantId));

        await insertInventoryMovement(tx, {
          variantId: item.variantId,
          type: "cancellation",
          quantity: -item.quantity,
          onHandBefore,
          referenceId: item.id,
          createdBy: cancelledBy,
          note: "Cancellation of receipt",
        });
      }

      if (row.purchaseOrderId) {
        const linked = items
          .filter((i) => i.purchaseOrderItemId)
          .map((i) => ({ purchaseOrderItemId: i.purchaseOrderItemId!, quantity: i.quantity }));
        if (linked.length > 0) {
          await reverseReceiptFromPurchaseOrder(tx, row.purchaseOrderId, linked);
        }
      }
    }

    const [updated] = await tx
      .update(goodsReceipts)
      .set({
        status: RECEIPT_STATUS.CANCELLED,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(goodsReceipts.id, id))
      .returning();

    return updated;
  });
}

/**
 * Sync paidAmount/debtAmount/paymentStatus on a receipt from its current
 * supplier_payments rows. Called by supplier-payment service after CRUD.
 */
export async function recomputeReceiptPaymentStatus(tx: DbTransaction, receiptId: string) {
  const [row] = await tx
    .select({ payable: goodsReceipts.payableAmount })
    .from(goodsReceipts)
    .where(eq(goodsReceipts.id, receiptId))
    .for("update");
  if (!row) return;

  const [agg] = await tx
    .select({
      paid: sql<string>`COALESCE(SUM(${supplierPayments.amount}), 0)`,
    })
    .from(supplierPayments)
    .where(eq(supplierPayments.receiptId, receiptId));

  const paid = Number(agg?.paid ?? 0);
  const payable = Number(row.payable ?? 0);
  const debt = Math.max(payable - paid, 0);
  const paymentStatus = paid <= 0 ? "unpaid" : paid >= payable ? "paid" : "partial";

  await tx
    .update(goodsReceipts)
    .set({
      paidAmount: toMoney(paid),
      debtAmount: toMoney(debt),
      paymentStatus,
      updatedAt: new Date(),
    })
    .where(eq(goodsReceipts.id, receiptId));
}
