import { run } from "@openai/agents";
import { db } from "@workspace/database/db";
import { adminNotifications, profiles } from "@workspace/database/schema";
import { getChatMessages, sendMessage } from "@workspace/database/services/chat.server";
import {
  CHAT_MESSAGE_TYPE,
  CHAT_TEXT_MAX_LENGTH,
  INTERNAL_CHAT_ROLES,
} from "@workspace/shared/constants";
import type { AutoReplyInput } from "@workspace/shared/types/ai-agent";
import { eq } from "drizzle-orm";
import { AGENT_ENABLED, AGENT_USERNAME, MAX_CONTEXT_MESSAGES, MAX_TURNS } from "./constants";
import { agent } from "./index";

const INTERNAL_CHAT_ROLE_SET = new Set(INTERNAL_CHAT_ROLES);
const HANDOFF_NOTIFICATION_TYPE = "ai_handoff_required";
const HANDOFF_NOTIFICATION_TITLE = "AI can nhan vien ho tro";
const HANDOFF_REPLY_MESSAGE =
  "Yeu cau nay can nhan vien ho tro them. Minh da chuyen cho nhan vien va se phan hoi som nhat.";
const RESPONSE_NEEDS_HANDOFF_PATTERN =
  /(khong the|khong du du lieu|chuyen nhan vien|nhan vien ho tro)/i;

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const URL_PATTERN = /\bhttps?:\/\/\S+/gi;
const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const LONG_NUMBER_PATTERN = /\b\d{9,}\b/g;
const PHONE_PATTERN = /(?<!\d)(?:\+?\d[\d.\s-]{7,}\d)(?!\d)/g;

const isInternalRole = (role?: string | null): boolean =>
  role ? INTERNAL_CHAT_ROLE_SET.has(role as (typeof INTERNAL_CHAT_ROLES)[number]) : false;

function normalizeReply(content: string): string {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= CHAT_TEXT_MAX_LENGTH) return normalized;
  return normalized.slice(0, CHAT_TEXT_MAX_LENGTH).trimEnd();
}

function truncateText(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return `${input.slice(0, maxLength).trimEnd()}...`;
}

function redactSensitiveContent(content: string): string {
  return content
    .replace(EMAIL_PATTERN, "[redacted_email]")
    .replace(URL_PATTERN, "[redacted_url]")
    .replace(UUID_PATTERN, "[redacted_id]")
    .replace(PHONE_PATTERN, "[redacted_phone]")
    .replace(LONG_NUMBER_PATTERN, "[redacted_number]");
}

function toSafePreview(content: string, maxLength = 280): string {
  const sanitized = redactSensitiveContent(content).trim();
  return truncateText(sanitized, maxLength);
}

function shouldCreateHandoffFromResponse(response: string): boolean {
  return RESPONSE_NEEDS_HANDOFF_PATTERN.test(response);
}

async function createHandoffNotification({
  roomId,
  triggerMessageId,
  reason,
  customerRequest,
}: {
  roomId: string;
  triggerMessageId: string;
  reason: string;
  customerRequest: string;
}): Promise<void> {
  const safeRequest = toSafePreview(customerRequest, 220) || "[empty]";
  const safeReason = toSafePreview(reason, 120) || "unknown";

  const message = [
    `Reason: ${safeReason}`,
    `Room ID: ${roomId}`,
    `Trigger Message ID: ${triggerMessageId}`,
    `Customer request preview: ${safeRequest}`,
  ].join("\n");

  await db.insert(adminNotifications).values({
    type: HANDOFF_NOTIFICATION_TYPE,
    title: HANDOFF_NOTIFICATION_TITLE,
    message,
  });
}

async function sendHandoffReply(roomId: string, senderId: string): Promise<void> {
  await sendMessage({
    roomId,
    senderId,
    content: HANDOFF_REPLY_MESSAGE,
    messageType: CHAT_MESSAGE_TYPE.TEXT,
  });
}

/**
 * Auto-reply to customer message using AI agent with safe-mode protections.
 */
export async function autoReplyCustomerMessage(input: AutoReplyInput): Promise<void> {
  if (!AGENT_ENABLED) return;

  const { roomId, triggerMessageId } = input;

  try {
    const agentProfile = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.username, AGENT_USERNAME))
      .limit(1);

    if (!agentProfile || agentProfile.length === 0) {
      console.error(`Agent profile not found for username: ${AGENT_USERNAME}`);
      return;
    }

    const agentId = agentProfile[0].id;
    const messages = await getChatMessages(roomId, MAX_CONTEXT_MESSAGES);

    const triggerMessage = messages.find((msg) => msg.id === triggerMessageId);
    const fallbackLatestCustomerMessage = [...messages]
      .reverse()
      .find(
        (msg) =>
          msg.messageType === CHAT_MESSAGE_TYPE.TEXT &&
          !!msg.content?.trim() &&
          !isInternalRole(msg.sender.role),
      );

    const latestCustomerMessage =
      triggerMessage &&
      triggerMessage.messageType === CHAT_MESSAGE_TYPE.TEXT &&
      !isInternalRole(triggerMessage.sender.role)
        ? triggerMessage
        : fallbackLatestCustomerMessage;

    const rawCustomerContent = latestCustomerMessage?.content?.trim() || "";
    if (!rawCustomerContent) return;

    const modelInput = rawCustomerContent;

    const result = await run(agent, modelInput, { maxTurns: MAX_TURNS });
    const finalOutput = typeof result.finalOutput === "string" ? result.finalOutput.trim() : "";

    if (!finalOutput) {
      await createHandoffNotification({
        roomId,
        triggerMessageId,
        reason: "empty_agent_output",
        customerRequest: rawCustomerContent,
      });
      await sendHandoffReply(roomId, agentId);
      return;
    }

    const agentResponse = normalizeReply(finalOutput);

    if (shouldCreateHandoffFromResponse(agentResponse)) {
      await createHandoffNotification({
        roomId,
        triggerMessageId,
        reason: "agent_requested_human_handoff",
        customerRequest: rawCustomerContent,
      });
    }

    await sendMessage({
      roomId,
      senderId: agentId,
      content: agentResponse,
      messageType: CHAT_MESSAGE_TYPE.TEXT,
    });
  } catch (error) {
    console.error("Error in autoReplyCustomerMessage:", error);

    try {
      const agentProfile = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.username, AGENT_USERNAME))
        .limit(1);

      const agentId = agentProfile[0]?.id;
      if (!agentId) return;

      await createHandoffNotification({
        roomId,
        triggerMessageId,
        reason: "agent_runtime_error",
        customerRequest: "runtime_error",
      });
      await sendHandoffReply(roomId, agentId);
    } catch (handoffError) {
      console.error("Failed to create handoff fallback:", handoffError);
    }
  }
}
