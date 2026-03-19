import { getInternalUser } from "@repo/database/lib/auth";
import { getOrCreateChatRoom } from "@repo/database/services/chat.server";
import { HTTP_STATUS } from "@repo/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const user = await getInternalUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: "Missing customerId" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const roomId = await getOrCreateChatRoom(customerId);

    return NextResponse.json({
      success: true,
      room: { id: roomId },
    });
  } catch (error) {
    console.error("Chat Rooms API Error:", error);
    return NextResponse.json(
      {
        error: "Đã có lỗi xảy ra khi tải danh sách hội thoại.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
