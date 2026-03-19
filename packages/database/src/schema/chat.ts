import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { messageTypeEnum } from "./enums";
import { profiles } from "./profiles";

export const chatRooms = pgTable(
  "chat_rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp("last_message_at"),
    unreadCountAdmin: integer("unread_count_admin").default(0),
    unreadCountCustomer: integer("unread_count_customer").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return [
      index("idx_chat_rooms_customer").on(table.customerId),
      index("idx_chat_rooms_last_message").on(table.lastMessageAt),
    ];
  },
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => chatRooms.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => profiles.id),
    content: text("content"),
    messageType: messageTypeEnum("message_type").default("text"),
    imageUrl: text("image_url"),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return [
      index("idx_chat_messages_room").on(table.roomId),
      index("idx_chat_messages_created").on(table.createdAt),
    ];
  },
);
