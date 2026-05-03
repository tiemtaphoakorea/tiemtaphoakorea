import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    source: varchar("source", { length: 50 }),
    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
    unsubscribedAt: timestamp("unsubscribed_at"),
  },
  (table) => [index("idx_newsletter_subscribers_subscribed_at").on(table.subscribedAt)],
);
