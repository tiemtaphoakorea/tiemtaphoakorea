import { DOC_PREFIX, type PaymentMethodValue } from "@workspace/shared/constants";
import { and, count, desc, eq, type SQL, sql } from "drizzle-orm";
import { db } from "../db";
import { profiles } from "../schema/profiles";
import { goodsReceipts, supplierPayments } from "../schema/receipts";
import { suppliers } from "../schema/suppliers";
import { nextDocumentCode } from "./document-code.server";
import { recomputeReceiptPaymentStatus } from "./goods-receipt.server";

export type SupplierPaymentListFilter = {
  supplierId?: string;
  receiptId?: string;
  method?: PaymentMethodValue;
  page?: number;
  limit?: number;
};

function toMoney(n: number | string): string {
  return Number(n).toFixed(2);
}

export async function listSupplierPayments(filter: SupplierPaymentListFilter = {}) {
  const conditions: SQL[] = [];
  if (filter.supplierId) conditions.push(eq(supplierPayments.supplierId, filter.supplierId));
  if (filter.receiptId) conditions.push(eq(supplierPayments.receiptId, filter.receiptId));
  if (filter.method) conditions.push(eq(supplierPayments.method, filter.method));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const page = Math.max(1, filter.page ?? 1);
  const limit = Math.max(1, Math.min(filter.limit ?? 25, 200));

  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: supplierPayments.id,
        code: supplierPayments.code,
        supplierId: supplierPayments.supplierId,
        supplierName: suppliers.name,
        receiptId: supplierPayments.receiptId,
        receiptCode: goodsReceipts.code,
        amount: supplierPayments.amount,
        method: supplierPayments.method,
        referenceCode: supplierPayments.referenceCode,
        paidAt: supplierPayments.paidAt,
        note: supplierPayments.note,
        createdAt: supplierPayments.createdAt,
        createdByName: profiles.fullName,
      })
      .from(supplierPayments)
      .leftJoin(suppliers, eq(supplierPayments.supplierId, suppliers.id))
      .leftJoin(goodsReceipts, eq(supplierPayments.receiptId, goodsReceipts.id))
      .leftJoin(profiles, eq(supplierPayments.createdBy, profiles.id))
      .where(where)
      .orderBy(desc(supplierPayments.paidAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ total: count() }).from(supplierPayments).where(where),
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

export async function createSupplierPayment(input: {
  supplierId: string;
  receiptId?: string;
  amount: string;
  method: PaymentMethodValue;
  referenceCode?: string;
  paidAt?: Date;
  note?: string;
  createdBy: string;
}) {
  if (Number(input.amount) <= 0) {
    throw new Error("Số tiền thanh toán phải lớn hơn 0");
  }

  return db.transaction(async (tx) => {
    // If allocated to a receipt, ensure the receipt belongs to the same supplier
    // and there is outstanding debt to cover.
    if (input.receiptId) {
      const [receipt] = await tx
        .select({
          supplierId: goodsReceipts.supplierId,
          payable: goodsReceipts.payableAmount,
          paid: goodsReceipts.paidAmount,
        })
        .from(goodsReceipts)
        .where(eq(goodsReceipts.id, input.receiptId))
        .for("update");
      if (!receipt) throw new Error("Không tìm thấy phiếu nhập");
      if (receipt.supplierId && receipt.supplierId !== input.supplierId) {
        throw new Error("NCC của phiếu chi không khớp NCC của phiếu nhập");
      }
      const outstanding = Number(receipt.payable) - Number(receipt.paid);
      if (Number(input.amount) > outstanding + 0.01) {
        throw new Error(
          `Số tiền vượt quá công nợ còn lại của phiếu nhập (còn ${outstanding.toLocaleString()})`,
        );
      }
    }

    const code = await nextDocumentCode(tx, DOC_PREFIX.SUPPLIER_PAYMENT);

    const [payment] = await tx
      .insert(supplierPayments)
      .values({
        code,
        supplierId: input.supplierId,
        receiptId: input.receiptId,
        amount: toMoney(input.amount),
        method: input.method,
        referenceCode: input.referenceCode,
        paidAt: input.paidAt ?? new Date(),
        note: input.note,
        createdBy: input.createdBy,
      })
      .returning();

    if (!payment) throw new Error("Failed to create supplier payment");

    if (input.receiptId) {
      await recomputeReceiptPaymentStatus(tx, input.receiptId);
    }

    return payment;
  });
}

export async function deleteSupplierPayment(id: string) {
  return db.transaction(async (tx) => {
    const [payment] = await tx
      .select({ receiptId: supplierPayments.receiptId })
      .from(supplierPayments)
      .where(eq(supplierPayments.id, id));
    if (!payment) throw new Error("Không tìm thấy phiếu chi");

    await tx.delete(supplierPayments).where(eq(supplierPayments.id, id));

    if (payment.receiptId) {
      await recomputeReceiptPaymentStatus(tx, payment.receiptId);
    }

    return { success: true };
  });
}

/**
 * Aggregated supplier debt aging report — counterpart of customer debts.
 */
export async function getSupplierDebtsAggregate() {
  return db
    .select({
      supplierId: goodsReceipts.supplierId,
      supplierName: suppliers.name,
      totalReceipts: sql<number>`COUNT(*)::int`,
      totalPayable: sql<string>`COALESCE(SUM(${goodsReceipts.payableAmount}), 0)`,
      totalPaid: sql<string>`COALESCE(SUM(${goodsReceipts.paidAmount}), 0)`,
      totalDebt: sql<string>`COALESCE(SUM(${goodsReceipts.debtAmount}), 0)`,
    })
    .from(goodsReceipts)
    .leftJoin(suppliers, eq(goodsReceipts.supplierId, suppliers.id))
    .where(sql`${goodsReceipts.status} = 'completed' AND ${goodsReceipts.debtAmount} > 0`)
    .groupBy(goodsReceipts.supplierId, suppliers.name)
    .orderBy(sql`COALESCE(SUM(${goodsReceipts.debtAmount}), 0) DESC`);
}
