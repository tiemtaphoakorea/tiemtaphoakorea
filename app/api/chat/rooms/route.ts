import { type NextRequest, NextResponse } from "next/server";
import { getInternalUser } from "@/lib/auth.server";
import { HTTP_STATUS } from "@/lib/http-status";
import { getOrCreateChatRoom } from "@/services/chat.server";

export async function POST(request: NextRequest) {
  const user = await getInternalUser();

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
