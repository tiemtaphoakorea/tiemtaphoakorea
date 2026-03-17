import { tool } from "@openai/agents";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/db.server";
import { chatRooms } from "@/db/schema/chat";
import { adminNotifications } from "@/db/schema/notifications";

const HANDOFF_NOTIFICATION_TYPE = "ai_handoff_required";
const HANDOFF_NOTIFICATION_TITLE = "AI can nhan vien ho tro";
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const URL_PATTERN = /\bhttps?:\/\/\S+/gi;
const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const LONG_NUMBER_PATTERN = /\b\d{9,}\b/g;
const PHONE_PATTERN = /(?<!\d)(?:\+?\d[\d.\s-]{7,}\d)(?!\d)/g;

function sanitizeText(value: string): string {
  return value
    .replace(EMAIL_PATTERN, "[redacted_email]")
    .replace(URL_PATTERN, "[redacted_url]")
    .replace(UUID_PATTERN, "[redacted_id]")
    .replace(PHONE_PATTERN, "[redacted_phone]")
    .replace(LONG_NUMBER_PATTERN, "[redacted_number]")
    .trim();
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}...`;
}

export const notifyHumanSupportTool = tool({
  name: "notify_human_support",
  description: "Tao thong bao noi bo cho nhan vien khi AI khong the xu ly yeu cau cua khach.",
  parameters: z.object({
    roomId: z.string().uuid().nullable(),
    customerRequest: z.string().min(1),
    reason: z.string().min(1),
    priority: z.enum(["low", "normal", "high"]).default("normal"),
  }),
  execute: async ({ roomId, customerRequest, reason, priority }) => {
    const safeRequest = truncateText(sanitizeText(customerRequest), 220) || "[empty]";
    const safeReason = truncateText(sanitizeText(reason), 120) || "unknown";

    if (roomId) {
      const roomExists = await db
        .select({ id: chatRooms.id })
        .from(chatRooms)
        .where(eq(chatRooms.id, roomId))
        .limit(1);
      if (roomExists.length === 0) {
        return JSON.stringify({
          status: "skipped",
          reason: "room_not_found",
        });
      }
    }

    const message = [
      `Priority: ${priority}`,
      `Room ID: ${roomId || "unknown"}`,
      `Reason: ${safeReason}`,
      `Customer request preview: ${safeRequest}`,
    ].join("\n");

    const inserted = await db
      .insert(adminNotifications)
      .values({
        type: HANDOFF_NOTIFICATION_TYPE,
        title: HANDOFF_NOTIFICATION_TITLE,
        message,
      })
      .returning({ id: adminNotifications.id, createdAt: adminNotifications.createdAt });

    return JSON.stringify({
      status: "created",
      notificationId: inserted[0]?.id || null,
      createdAt: inserted[0]?.createdAt || null,
      target: "human_support_staff",
    });
  },
});
