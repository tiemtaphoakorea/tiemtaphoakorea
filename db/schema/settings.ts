import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const systemSettings = pgTable("system_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});
