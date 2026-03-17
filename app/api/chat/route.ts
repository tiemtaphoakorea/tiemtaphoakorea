import { after, type NextRequest, NextResponse } from "next/server";
import { autoReplyCustomerMessage } from "@/agent/services";
import { getInternalUser } from "@/lib/auth.server";
import { CHAT_MESSAGE_TYPE } from "@/lib/constants";
import { HTTP_STATUS } from "@/lib/http-status";
import {
  getChatMessages,
  getChatRoomByCustomerId,
  getOrCreateChatRoom,
  sendMessage,
  uploadChatImage,
} from "@/services/chat.server";
import { ensureGuestProfile } from "@/services/guest.server";
import type { ChatMessage } from "@/types/admin";

export async function GET(request: NextRequest) {
  const user = await getInternalUser();
  const { searchParams } = new URL(request.url);
  const guestId = searchParams.get("guestId");

  try {
    let roomId: string | null = null;
    let currentUserId: string | null = null;

    if (user) {
      currentUserId = user.profile.id;
      roomId = await getChatRoomByCustomerId(user.profile.id);
      if (!roomId) {
        roomId = await getOrCreateChatRoom(user.profile.id);
      }
    } else if (guestId) {
      const guestProfile = await ensureGuestProfile(guestId);
      currentUserId = guestProfile.id;
      roomId = await getOrCreateChatRoom(guestProfile.id);
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
    }

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const messages = await getChatMessages(roomId);

    return NextResponse.json({
      success: true,
      roomId,
      currentUserId,
      messages,
    });
  } catch (error) {
    console.error("Chat API GET Error:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tải tin nhắn." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getInternalUser();
  const contentType = request.headers.get("content-type") || "";

  try {
    // Handle File Upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const roomId = formData.get("roomId") as string;
      const file = formData.get("file") as File;
      const sendAsMessage = formData.get("sendAsMessage") === "true";
      const guestId = formData.get("guestId") as string | null;

      if (!roomId || !file) {
        return NextResponse.json(
          { error: "Missing roomId or file" },
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }

      // Determine sender
      let senderId: string;
      if (user) {
        senderId = user.profile.id;
      } else if (guestId) {
        // Guest upload - create/get guest profile
        const guestProfile = await ensureGuestProfile(guestId);
        senderId = guestProfile.id;
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
      }

      // Upload image
      const imageUrl = await uploadChatImage(roomId, file);

      let message: ChatMessage | null = null;
      if (sendAsMessage) {
        message = await sendMessage({
          roomId,
          senderId,
          content: "",
          messageType: CHAT_MESSAGE_TYPE.IMAGE,
          imageUrl,
        });
      }

      return NextResponse.json({
        success: true,
        url: imageUrl,
        message,
      });
    }

    // Handle Text Message
    const body = await request.json();
    const { roomId: existingRoomId, content, messageType = CHAT_MESSAGE_TYPE.TEXT, guestId } = body;

    // Determine sender and room
    let senderId: string;
    let roomId: string;

    if (user) {
      // Internal user (admin/staff)
      senderId = user.profile.id;
      if (!existingRoomId) {
        return NextResponse.json({ error: "Missing roomId" }, { status: HTTP_STATUS.BAD_REQUEST });
      }
      roomId = existingRoomId;
    } else if (guestId) {
      // Guest user - create/get guest profile and room
      const guestProfile = await ensureGuestProfile(guestId);
      senderId = guestProfile.id;

      // Get or create room for this guest
      roomId = await getOrCreateChatRoom(guestProfile.id);
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
    }

    const message = await sendMessage({
      roomId,
      senderId,
      content,
      messageType,
    });

    if (
      !user &&
      messageType === CHAT_MESSAGE_TYPE.TEXT &&
      typeof content === "string" &&
      content.trim().length > 0
    ) {
      after(async () => {
        try {
          await autoReplyCustomerMessage({
            roomId,
            triggerMessageId: message.id,
          });
        } catch (error) {
          console.error("AI Agent auto-reply failed:", error);
        }
      });
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      {
        error: "Đã có lỗi xảy ra khi tải tin nhắn.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
