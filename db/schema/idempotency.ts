import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

/**
 * Idempotency Keys Table
 * Stores idempotency tokens to prevent duplicate operations
 * - Supports order creation and payment operations
 * - Keys expire after 24 hours
 * - Stores original request and response for replay
 */
export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 255 }).notNull().unique(),
    resourceType: varchar("resource_type", { length: 50 }).notNull(), // 'order' | 'payment'
    resourceId: uuid("resource_id"), // ID of created resource
    requestPayload: text("request_payload").notNull(), // JSON string of request
    responsePayload: text("response_payload"), // JSON string of response
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(), // 24 hours from creation
  },
  (table) => ({
    keyIdx: index("idempotency_key_idx").on(table.key),
    expiresAtIdx: index("idempotency_expires_at_idx").on(table.expiresAt),
  }),
);
