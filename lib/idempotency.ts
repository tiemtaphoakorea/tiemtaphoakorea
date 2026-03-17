import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db/db.server";
import { idempotencyKeys } from "@/db/schema";

/**
 * Idempotency Service
 * Provides functions to check and store idempotency keys
 */

interface IdempotencyKeyData {
  key: string;
  resourceType: "order" | "payment";
  resourceId?: string;
  requestPayload: any;
  responsePayload?: any;
}

/**
 * Check if an idempotency key already exists and is still valid
 * Returns the stored response if found, null otherwise
 */
export async function checkIdempotencyKey(
  key: string,
  resourceType: "order" | "payment",
): Promise<{
  exists: boolean;
  response?: any;
  resourceId?: string;
  requestPayload?: any;
} | null> {
  const now = new Date();

  const [existing] = await db
    .select()
    .from(idempotencyKeys)
    .where(
      and(
        eq(idempotencyKeys.key, key),
        eq(idempotencyKeys.resourceType, resourceType),
        gt(idempotencyKeys.expiresAt, now),
      ),
    )
    .limit(1);

  if (!existing) {
    return null;
  }

  return {
    exists: true,
    response: existing.responsePayload ? JSON.parse(existing.responsePayload) : null,
    resourceId: existing.resourceId || undefined,
    requestPayload: existing.requestPayload ? JSON.parse(existing.requestPayload) : null,
  };
}

/**
 * Store an idempotency key with its response
 * Keys expire after 24 hours
 */
export async function storeIdempotencyKey(data: IdempotencyKeyData): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  await db.insert(idempotencyKeys).values({
    key: data.key,
    resourceType: data.resourceType,
    resourceId: data.resourceId,
    requestPayload: JSON.stringify(data.requestPayload),
    responsePayload: data.responsePayload ? JSON.stringify(data.responsePayload) : null,
    expiresAt,
  });
}

/**
 * Update an existing idempotency key with response data
 */
export async function updateIdempotencyKey(
  key: string,
  resourceId: string,
  responsePayload: any,
): Promise<void> {
  await db
    .update(idempotencyKeys)
    .set({
      resourceId,
      responsePayload: JSON.stringify(responsePayload),
    })
    .where(eq(idempotencyKeys.key, key));
}

/**
 * Compare two request payloads to check if they're identical
 */
export function comparePayloads(payload1: any, payload2: any): boolean {
  return JSON.stringify(payload1) === JSON.stringify(payload2);
}

/**
 * Clean up expired idempotency keys (should be run periodically)
 */
export async function cleanupExpiredKeys(): Promise<number> {
  const now = new Date();
  const result = await db.delete(idempotencyKeys).where(lt(idempotencyKeys.expiresAt, now));

  return result.rowCount || 0;
}
