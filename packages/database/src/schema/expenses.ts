import { decimal, index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { expenseTypeEnum } from "./enums";
import { profiles } from "./profiles";

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    description: varchar("description", { length: 255 }).notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    type: expenseTypeEnum("type").notNull(), // fixed, variable
    date: timestamp("date").defaultNow().notNull(),

    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return [index("idx_expenses_type").on(table.type), index("idx_expenses_date").on(table.date)];
  },
);
