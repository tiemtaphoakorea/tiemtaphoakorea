import {
  pgTable,
  uuid,
  date,
  integer,
  decimal,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const dailyReports = pgTable(
  "daily_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportDate: date("report_date").notNull().unique(),
    totalOrders: integer("total_orders").default(0),
    completedOrders: integer("completed_orders").default(0),
    cancelledOrders: integer("cancelled_orders").default(0),
    totalRevenue: decimal("total_revenue", { precision: 15, scale: 2 }).default(
      "0"
    ),
    totalCost: decimal("total_cost", { precision: 15, scale: 2 }).default("0"),
    totalProfit: decimal("total_profit", { precision: 15, scale: 2 }).default(
      "0"
    ),
    topProducts: jsonb("top_products"), // Array of {variant_id, name, quantity, revenue}
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return [index("idx_daily_reports_date").on(table.reportDate)];
  }
);
