import { isNotNull } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { customerTypeEnum, userRoleEnum } from "./enums";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: varchar("username", { length: 255 }).unique().notNull(), // Unique as it's the main login identifier
    role: userRoleEnum("role").notNull().default("customer"),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    address: text("address"),
    customerType: customerTypeEnum("customer_type"),
    customerCode: varchar("customer_code", { length: 20 }).unique(),
    avatarUrl: text("avatar_url"),
    passwordHash: varchar("password_hash", { length: 255 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return [
      index("idx_profiles_customer_code").on(table.customerCode),
      index("idx_profiles_role").on(table.role),
      uniqueIndex("idx_profiles_role_phone_unique")
        .on(table.role, table.phone)
        .where(isNotNull(table.phone)),
    ];
  },
);
