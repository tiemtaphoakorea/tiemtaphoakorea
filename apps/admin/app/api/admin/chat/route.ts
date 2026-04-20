import { getInternalUser } from "@workspace/database/lib/auth";
import {
  getChatMessages,
  getChatRooms,
  markMessagesAsRead,
  sendMessage,
  uploadChatImage,
} from "@workspace/database/services/chat.server";
import { CHAT_MESSAGE_TYPE } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getInternalUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");

  try {
    if (roomId) {
      // Get messages for a specific room
      const messages = await getChatMessages(roomId);

      // Also mark as read when fetching details
      await markMessagesAsRead(roomId, user.profile.id);

      return NextResponse.json({
        messages,
      });
    } else {
      const search = searchParams.get("search") || undefined;
      const rooms = await getChatRooms(search);
      return NextResponse.json({
        rooms,
      });
    }
  } catch (error) {
    console.error("Admin Chat API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const contentType = request.headers.get("content-type") || "";

  try {
    // Image upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const roomId = formData.get("roomId") as string;
      const file = formData.get("file") as File;
      const sendAsMessage = formData.get("sendAsMessage") === "true";

      if (!roomId || !file) {
        return NextResponse.json(
          { error: "Missing roomId or file" },
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }

      const imageUrl = await uploadChatImage(roomId, file);

      let message: Awaited<ReturnType<typeof sendMessage>> | null = null;
      if (sendAsMessage) {
        message = await sendMessage({
          roomId,
          senderId: user.profile.id,
          content: "",
          messageType: CHAT_MESSAGE_TYPE.IMAGE,
          imageUrl,
        });
      }

      return NextResponse.json({ success: true, url: imageUrl, message });
    }

    // Text message
    const body = await request.json();
    const { roomId, content, messageType = CHAT_MESSAGE_TYPE.TEXT } = body;

    if (!roomId || !content) {
      return NextResponse.json(
        { error: "Missing roomId or content" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const message = await sendMessage({
      roomId,
      senderId: user.profile.id,
      content,
      messageType,
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Admin Chat POST Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
