import { getInternalUser } from "@repo/database/lib/auth";
import { getChatMessages } from "@repo/database/services/chat.server";
import { HTTP_STATUS } from "@repo/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getInternalUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { id: roomId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const messages = await getChatMessages(roomId, limit, offset);

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Chat Messages GET API Error:", error);
    return NextResponse.json(
      {
        error: "Đã có lỗi xảy ra khi tải tin nhắn hội thoại.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
