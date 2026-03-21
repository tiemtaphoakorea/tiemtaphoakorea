import { getInternalUser } from "@workspace/database/lib/auth";
import {
  getChatMessages,
  getChatRooms,
  markMessagesAsRead,
} from "@workspace/database/services/chat.server";
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
