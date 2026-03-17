import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db/db.server";
import { supplierOrders } from "@/db/schema/orders";
import { suppliers } from "@/db/schema/suppliers";
import {
  CODE_PAD_CHAR,
  CODE_PAD_LENGTH,
  SUPPLIER_CODE_PREFIX,
  SUPPLIER_ORDER_STATUS,
} from "@/lib/constants";

/**
 * Get list of suppliers with search functionality
 */
export async function getSuppliers({
  search = "",
  includeInactive = false,
}: {
  search?: string;
  includeInactive?: boolean;
} = {}) {
  const whereConditions: (any | undefined)[] = [];

  if (!includeInactive) {
    whereConditions.push(eq(suppliers.isActive, true));
  }

  if (search) {
    whereConditions.push(
      or(
        ilike(suppliers.name, `%${search}%`),
        ilike(suppliers.code, `%${search}%`),
        ilike(suppliers.phone, `%${search}%`),
        ilike(suppliers.email, `%${search}%`),
      ),
    );
  }

  const supplierList = await db
    .select({
      id: suppliers.id,
      code: suppliers.code,
      name: suppliers.name,
      phone: suppliers.phone,
      email: suppliers.email,
      address: suppliers.address,
      paymentTerms: suppliers.paymentTerms,
      note: suppliers.note,
      isActive: suppliers.isActive,
      createdAt: suppliers.createdAt,
      updatedAt: suppliers.updatedAt,
      // Count of supplier orders
      totalOrders: sql<number>`count(${supplierOrders.id})`.mapWith(Number),
    })
    .from(suppliers)
    .leftJoin(supplierOrders, eq(suppliers.id, supplierOrders.supplierId))
    .where(and(...whereConditions.filter((c): c is any => !!c)))
    .groupBy(suppliers.id)
    .orderBy(desc(suppliers.createdAt));

  return supplierList;
}

/**
 * Get supplier by ID with detailed stats
 */
export async function getSupplierById(id: string) {
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);

  return result[0] || null;
}

/**
 * Get supplier statistics (order count, total amount, etc.)
 */
export async function getSupplierStats(id: string) {
  const stats = await db
    .select({
      totalOrders: count(supplierOrders.id),
      pendingOrders:
        sql<number>`count(case when ${supplierOrders.status} = ${SUPPLIER_ORDER_STATUS.PENDING} then 1 end)`.mapWith(
          Number,
        ),
      orderedOrders:
        sql<number>`count(case when ${supplierOrders.status} = ${SUPPLIER_ORDER_STATUS.ORDERED} then 1 end)`.mapWith(
          Number,
        ),
      receivedOrders:
        sql<number>`count(case when ${supplierOrders.status} = ${SUPPLIER_ORDER_STATUS.RECEIVED} then 1 end)`.mapWith(
          Number,
        ),
      cancelledOrders:
        sql<number>`count(case when ${supplierOrders.status} = ${SUPPLIER_ORDER_STATUS.CANCELLED} then 1 end)`.mapWith(
          Number,
        ),
      totalCost: sql<number>`coalesce(sum(${supplierOrders.actualCostPrice}), 0)`.mapWith(Number),
    })
    .from(supplierOrders)
    .where(eq(supplierOrders.supplierId, id));

  // Get recent orders for this supplier
  const recentOrders = await db
    .select()
    .from(supplierOrders)
    .where(eq(supplierOrders.supplierId, id))
    .orderBy(desc(supplierOrders.createdAt))
    .limit(10);

  return {
    ...stats[0],
    recentOrders,
  };
}

/**
 * Generate supplier code (NCC001, NCC002...)
 */
async function generateSupplierCode() {
  const result = await db
    .select({ code: suppliers.code })
    .from(suppliers)
    .orderBy(desc(suppliers.code))
    .limit(1);

  const lastSupplier = result[0];

  let nextId = 1;
  if (lastSupplier?.code) {
    const match = lastSupplier.code.match(/\d+/);
    if (match) {
      nextId = parseInt(match[0], 10) + 1;
    }
  }

  return `${SUPPLIER_CODE_PREFIX}${nextId.toString().padStart(CODE_PAD_LENGTH, CODE_PAD_CHAR)}`;
}

/**
 * Create a new supplier with retry logic for code conflicts
 */
export async function createSupplier(data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentTerms?: string;
  note?: string;
}) {
  const maxRetries = 10;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const code = await generateSupplierCode();

      const [newSupplier] = await db
        .insert(suppliers)
        .values({
          code,
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          paymentTerms: data.paymentTerms,
          note: data.note,
        })
        .returning();

      return newSupplier;
    } catch (error: any) {
      lastError = error;

      const errorMsg = error.message?.toLowerCase() || "";
      const errorCode = error.code?.toLowerCase() || "";
      const errorDetail = error.detail?.toLowerCase() || "";

      // Check if it's a unique constraint violation
      // PostgreSQL error code 23505 is for unique_violation
      const isUniqueViolation =
        errorMsg.includes("duplicate") ||
        errorMsg.includes("unique") ||
        errorMsg.includes("already exists") ||
        errorDetail.includes("duplicate") ||
        errorDetail.includes("unique") ||
        errorCode === "23505" ||
        error.constraint?.includes("unique") ||
        error.constraint?.includes("code");

      if (isUniqueViolation && attempt < maxRetries - 1) {
        // Wait before retrying (exponential backoff with jitter)
        const baseDelay = 2 ** attempt * 50;
        const jitter = Math.random() * 50;
        await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
        continue;
      }

      // If it's not a unique violation or we're out of retries, throw
      throw error;
    }
  }

  throw new Error(`Failed to create supplier after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Update an existing supplier
 */
export async function updateSupplier(
  id: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    paymentTerms?: string;
    note?: string;
    isActive?: boolean;
  },
) {
  const [updatedSupplier] = await db
    .update(suppliers)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(suppliers.id, id))
    .returning();

  return updatedSupplier;
}

/**
 * Delete (soft) a supplier by setting isActive to false
 */
export async function deleteSupplier(id: string) {
  return updateSupplier(id, { isActive: false });
}

/**
 * Get all active suppliers (for dropdown selection)
 */
export async function getActiveSuppliers() {
  return db
    .select({
      id: suppliers.id,
      code: suppliers.code,
      name: suppliers.name,
    })
    .from(suppliers)
    .where(eq(suppliers.isActive, true))
    .orderBy(suppliers.name);
}
