import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import type * as schema from "../schema";

/**
 * Type for Drizzle transaction object
 * This is the proper type for db.transaction() callback parameter
 */
export type DbTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<typeof schema>
>;

/**
 * Type for database error with constraint information
 */
export interface DbError extends Error {
  code?: string;
  constraint?: string;
  detail?: string;
}

/**
 * Variant data with product information (from query with relations)
 */
export interface VariantWithProduct {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: string;
  costPrice: string | null;
  onHand: number;
  reserved: number;
  lowStockThreshold?: number | null;
  isActive?: boolean | null;
  product?: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Supplier order returned from database
 */
export interface SupplierOrderRecord {
  id: string;
  variantId: string | null;
  supplierId: string | null;
  quantity: number;
  status: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  orderedAt: Date | null;
  expectedDate: Date | null;
  receivedAt: Date | null;
  actualCostPrice: string | null;
}
