import {
  CHAT_BUCKET_NAME,
  CHAT_IMAGE_ALLOWED_TYPES,
  CHAT_IMAGE_MAX_SIZE_BYTES,
  CHAT_MESSAGE_TYPE,
  CHAT_MESSAGES_PAGE_LIMIT_DEFAULT,
  CHAT_TEXT_MAX_LENGTH,
  ERROR_MESSAGE,
  INTERNAL_CHAT_ROLES,
  STORAGE_CACHE_CONTROL,
} from "@workspace/shared/constants";
import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { db } from "../db";
import { createAdminClient } from "../lib/supabase/admin";
import { createClient } from "../lib/supabase/server";
import { chatMessages, chatRooms, orders, profiles } from "../schema";

// Types
export interface ChatRoomWithDetails {
  id: string;
  customer: {
    id: string;
    fullName: string | null;
    customerCode: string | null;
    phone: string | null;
    customerType: string | null;
  };
  lastMessage: {
    content: string | null;
    messageType: string | null;
    createdAt: Date | null;
    senderId: string;
    senderName: string | null;
  } | null;
  unreadCountAdmin: number;
  lastMessageAt: Date | null;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string | null;
  messageType: string | null;
  imageUrl: string | null;
  isRead: boolean | null;
  createdAt: Date | null;
  sender: {
    fullName: string | null;
    role: string | null;
  };
}

export interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: Date | null;
}

const INTERNAL_CHAT_ROLE_SET = new Set(INTERNAL_CHAT_ROLES);

const isInternalRole = (role?: string | null) =>
  role ? INTERNAL_CHAT_ROLE_SET.has(role as (typeof INTERNAL_CHAT_ROLES)[number]) : false;

// Get all chat rooms for admin with last message and unread count (filter by search on backend)
export async function getChatRooms(search?: string): Promise<ChatRoomWithDetails[]> {
  const where = search?.trim()
    ? or(
        ilike(profiles.fullName, `%${search.trim()}%`),
        ilike(profiles.customerCode, `%${search.trim()}%`),
        ilike(profiles.phone, `%${search.trim()}%`),
      )
    : undefined;

  const rooms = await db
    .select({
      id: chatRooms.id,
      customerId: chatRooms.customerId,
      unreadCountAdmin: chatRooms.unreadCountAdmin,
      lastMessageAt: chatRooms.lastMessageAt,
      customerFullName: profiles.fullName,
      customerCode: profiles.customerCode,
      customerPhone: profiles.phone,
      customerType: profiles.customerType,
    })
    .from(chatRooms)
    .innerJoin(profiles, eq(chatRooms.customerId, profiles.id))
    .where(where)
    .orderBy(desc(chatRooms.lastMessageAt));

  // Get last message for each room
  const roomsWithMessages = await Promise.all(
    rooms.map(async (room) => {
      const lastMessageResult = await db
        .select({
          content: chatMessages.content,
          messageType: chatMessages.messageType,
          createdAt: chatMessages.createdAt,
          senderId: chatMessages.senderId,
          senderName: profiles.fullName,
        })
        .from(chatMessages)
        .leftJoin(profiles, eq(chatMessages.senderId, profiles.id))
        .where(eq(chatMessages.roomId, room.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(1);

      return {
        id: room.id,
        customer: {
          id: room.customerId,
          fullName: room.customerFullName,
          customerCode: room.customerCode,
          phone: room.customerPhone,
          customerType: room.customerType,
        },
        lastMessage: lastMessageResult[0]
          ? {
              content: lastMessageResult[0].content,
              messageType: lastMessageResult[0].messageType,
              createdAt: lastMessageResult[0].createdAt,
              senderId: lastMessageResult[0].senderId,
              senderName: lastMessageResult[0].senderName,
            }
          : null,
        unreadCountAdmin: room.unreadCountAdmin ?? 0,
        lastMessageAt: room.lastMessageAt,
      };
    }),
  );

  return roomsWithMessages;
}

// Get or create chat room for a customer
export async function getOrCreateChatRoom(customerId: string): Promise<string> {
  // Check if room exists
  const existingRoom = await db
    .select({ id: chatRooms.id })
    .from(chatRooms)
    .where(eq(chatRooms.customerId, customerId))
    .limit(1);

  if (existingRoom.length > 0) {
    return existingRoom[0].id;
  }

  // Create new room
  const newRoom = await db
    .insert(chatRooms)
    .values({
      customerId,
    })
    .returning({ id: chatRooms.id });

  return newRoom[0].id;
}

// Get chat room by ID with customer info
export async function getChatRoomById(roomId: string) {
  const result = await db
    .select({
      id: chatRooms.id,
      customerId: chatRooms.customerId,
      unreadCountAdmin: chatRooms.unreadCountAdmin,
      unreadCountCustomer: chatRooms.unreadCountCustomer,
      customerFullName: profiles.fullName,
      customerCode: profiles.customerCode,
      customerPhone: profiles.phone,
      customerType: profiles.customerType,
    })
    .from(chatRooms)
    .innerJoin(profiles, eq(chatRooms.customerId, profiles.id))
    .where(eq(chatRooms.id, roomId))
    .limit(1);

  if (result.length === 0) return null;

  return {
    id: result[0].id,
    customerId: result[0].customerId,
    unreadCountAdmin: result[0].unreadCountAdmin ?? 0,
    unreadCountCustomer: result[0].unreadCountCustomer ?? 0,
    customer: {
      id: result[0].customerId,
      fullName: result[0].customerFullName,
      customerCode: result[0].customerCode,
      phone: result[0].customerPhone,
      customerType: result[0].customerType,
    },
  };
}

// Get chat room by customer ID
export async function getChatRoomByCustomerId(customerId: string) {
  const result = await db
    .select({ id: chatRooms.id })
    .from(chatRooms)
    .where(eq(chatRooms.customerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0].id : null;
}

// Get messages in a room with pagination
export async function getChatMessages(
  roomId: string,
  limit: number = CHAT_MESSAGES_PAGE_LIMIT_DEFAULT,
  offset: number = 0,
): Promise<ChatMessage[]> {
  const messages = await db
    .select({
      id: chatMessages.id,
      roomId: chatMessages.roomId,
      senderId: chatMessages.senderId,
      content: chatMessages.content,
      messageType: chatMessages.messageType,
      imageUrl: chatMessages.imageUrl,
      isRead: chatMessages.isRead,
      createdAt: chatMessages.createdAt,
      senderFullName: profiles.fullName,
      senderRole: profiles.role,
    })
    .from(chatMessages)
    .leftJoin(profiles, eq(chatMessages.senderId, profiles.id))
    .where(eq(chatMessages.roomId, roomId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit)
    .offset(offset);

  // Return in chronological order (oldest first)
  return messages.reverse().map((msg) => ({
    id: msg.id,
    roomId: msg.roomId,
    senderId: msg.senderId,
    content: msg.content,
    messageType: msg.messageType,
    imageUrl: msg.imageUrl,
    isRead: msg.isRead,
    createdAt: msg.createdAt,
    sender: {
      fullName: msg.senderFullName,
      role: msg.senderRole,
    },
  }));
}

// Send a message
export async function sendMessage(input: {
  roomId: string;
  senderId: string;
  content: string;
  messageType?: (typeof CHAT_MESSAGE_TYPE)[keyof typeof CHAT_MESSAGE_TYPE];
  imageUrl?: string;
}): Promise<ChatMessage> {
  const { roomId, senderId, content, messageType = CHAT_MESSAGE_TYPE.TEXT, imageUrl } = input;
  const effectiveMessageType = messageType;

  // Validate content
  if (
    effectiveMessageType === CHAT_MESSAGE_TYPE.TEXT &&
    (!content || content.trim().length === 0)
  ) {
    throw new Error(ERROR_MESSAGE.CHAT.EMPTY_MESSAGE);
  }

  if (effectiveMessageType === CHAT_MESSAGE_TYPE.TEXT && content.length > CHAT_TEXT_MAX_LENGTH) {
    throw new Error(ERROR_MESSAGE.CHAT.MESSAGE_TOO_LONG);
  }

  // Get sender info to determine who sent the message
  const senderInfo = await db
    .select({ role: profiles.role, fullName: profiles.fullName })
    .from(profiles)
    .where(eq(profiles.id, senderId))
    .limit(1);

  const isAdmin = isInternalRole(senderInfo[0]?.role);

  // Insert message
  const newMessage = await db
    .insert(chatMessages)
    .values({
      roomId,
      senderId,
      content: effectiveMessageType === CHAT_MESSAGE_TYPE.IMAGE ? "[Hình ảnh]" : content,
      messageType: effectiveMessageType,
      imageUrl,
      isRead: false,
    })
    .returning();

  // Update room's lastMessageAt and unread count with retry logic for concurrent updates
  const now = new Date();
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (isAdmin) {
        // Admin sends message, increment customer unread count
        await db
          .update(chatRooms)
          .set({
            lastMessageAt: now,
            updatedAt: now,
            unreadCountCustomer: sql`COALESCE(${chatRooms.unreadCountCustomer}, 0) + 1`,
          })
          .where(eq(chatRooms.id, roomId));
      } else {
        // Customer sends message, increment admin unread count
        await db
          .update(chatRooms)
          .set({
            lastMessageAt: now,
            updatedAt: now,
            unreadCountAdmin: sql`COALESCE(${chatRooms.unreadCountAdmin}, 0) + 1`,
          })
          .where(eq(chatRooms.id, roomId));
      }
      // Success - break out of retry loop
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // Only retry on deadlock or serialization errors
      if (
        attempt < maxRetries - 1 &&
        (lastError.message.includes("deadlock") ||
          lastError.message.includes("could not serialize"))
      ) {
        // Wait with exponential backoff before retrying
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 10));
        continue;
      }
      // If it's not a retryable error or we're out of retries, throw
      throw lastError;
    }
  }

  const result = {
    id: newMessage[0].id,
    roomId: newMessage[0].roomId,
    senderId: newMessage[0].senderId,
    content: newMessage[0].content,
    messageType: newMessage[0].messageType,
    imageUrl: newMessage[0].imageUrl,
    isRead: newMessage[0].isRead,
    createdAt: newMessage[0].createdAt,
    sender: {
      fullName: senderInfo[0]?.fullName ?? null,
      role: senderInfo[0]?.role ?? null,
    },
  };

  // Broadcast the message via Supabase Realtime
  try {
    // Use service role for server-side broadcast to avoid auth-session dependency.
    const supabase = createAdminClient();
    const channel = supabase.channel(roomId);
    const broadcastPayload = {
      id: result.id,
      content: result.content,
      senderId: result.senderId,
      user: {
        name: result.sender.fullName || "Unknown",
      },
      createdAt: result.createdAt?.toISOString() || new Date().toISOString(),
    };
    const broadcastResult = await channel.httpSend("message", broadcastPayload);

    if (!broadcastResult.success) {
      console.error(
        `Failed to broadcast chat message via REST (${broadcastResult.status}): ${broadcastResult.error}`,
      );
    }
  } catch (error) {
    // Log broadcast error but don't fail the request since message is saved to DB
    console.error("Failed to broadcast chat message:", error);
  }

  return result;
}

// Mark messages as read
export async function markMessagesAsRead(roomId: string, readerId: string): Promise<void> {
  // Get reader info to determine their role
  const readerInfo = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, readerId))
    .limit(1);

  const isAdmin = isInternalRole(readerInfo[0]?.role);

  // Mark all unread messages from the other party as read
  await db
    .update(chatMessages)
    .set({ isRead: true })
    .where(
      and(
        eq(chatMessages.roomId, roomId),
        ne(chatMessages.senderId, readerId),
        eq(chatMessages.isRead, false),
      ),
    );

  // Reset unread count for the reader
  if (isAdmin) {
    await db.update(chatRooms).set({ unreadCountAdmin: 0 }).where(eq(chatRooms.id, roomId));
  } else {
    await db.update(chatRooms).set({ unreadCountCustomer: 0 }).where(eq(chatRooms.id, roomId));
  }
}

// Get total unread count for admin
export async function getTotalUnreadCountForAdmin(): Promise<number> {
  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${chatRooms.unreadCountAdmin}), 0)::int`,
    })
    .from(chatRooms);

  return result[0]?.total ?? 0;
}

// Upload chat image
export async function uploadChatImage(roomId: string, file: File): Promise<string> {
  // Validate file type
  if (!CHAT_IMAGE_ALLOWED_TYPES.includes(file.type as (typeof CHAT_IMAGE_ALLOWED_TYPES)[number])) {
    throw new Error(ERROR_MESSAGE.CHAT.INVALID_IMAGE_TYPE);
  }

  // Validate file size (5MB)
  if (file.size > CHAT_IMAGE_MAX_SIZE_BYTES) {
    throw new Error(ERROR_MESSAGE.CHAT.IMAGE_TOO_LARGE);
  }

  const supabase = await createClient();

  // Generate unique filename
  const ext = file.name.split(".").pop();
  const filename = `${roomId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage.from(CHAT_BUCKET_NAME).upload(filename, file, {
    cacheControl: STORAGE_CACHE_CONTROL,
    upsert: false,
  });

  if (error) {
    throw new Error(`${ERROR_MESSAGE.CHAT.UPLOAD_FAILED}: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(CHAT_BUCKET_NAME).getPublicUrl(data.path);

  return publicUrl;
}

// Get customer stats for chat info panel
export async function getCustomerStatsForChat(customerId: string): Promise<CustomerStats> {
  const result = await db
    .select({
      totalOrders: sql<number>`COUNT(*)::int`,
      totalSpent: sql<number>`COALESCE(SUM(${orders.total}), 0)::numeric`,
      lastOrderDate: sql<Date>`MAX(${orders.createdAt})`,
    })
    .from(orders)
    .where(eq(orders.customerId, customerId));

  return {
    totalOrders: result[0]?.totalOrders ?? 0,
    totalSpent: Number(result[0]?.totalSpent ?? 0),
    lastOrderDate: result[0]?.lastOrderDate ?? null,
  };
}
