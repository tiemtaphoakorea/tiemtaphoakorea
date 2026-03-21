import { getInternalUser } from "@workspace/database/lib/auth";
import { sendMessage } from "@workspace/database/services/chat.server";
import { CHAT_MESSAGE_TYPE } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const user = await getInternalUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const body = await request.json();
    const { roomId, message, content, senderId, messageType = CHAT_MESSAGE_TYPE.TEXT } = body;

    // Accept both 'message' and 'content' for flexibility
    const messageContent = message || content;

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    if (!messageContent) {
      return NextResponse.json(
        { error: "Missing message content" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    // Use provided senderId or default to current user
    const effectiveSenderId = senderId || user.profile.id;

    const messageResult = await sendMessage({
      roomId,
      senderId: effectiveSenderId,
      content: messageContent,
      messageType,
    });

    return NextResponse.json({
      success: true,
      message: messageResult,
    });
  } catch (error) {
    console.error("Chat Messages API Error:", error);
    return NextResponse.json(
      {
        error: "Đã có lỗi xảy ra khi gửi tin nhắn.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
