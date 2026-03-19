import { getInternalUser } from "@repo/database/lib/auth";
import { markMessagesAsRead } from "@repo/database/services/chat.server";
import { HTTP_STATUS } from "@repo/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getInternalUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { id: roomId } = await params;

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    await markMessagesAsRead(roomId, user.profile.id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Mark Messages as Read API Error:", error);
    return NextResponse.json(
      {
        error: "Đã có lỗi xảy ra khi đánh dấu đã đọc.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
