import { getInternalUser } from "@repo/database/lib/auth";
import { resetUserPassword } from "@repo/database/services/user.server";
import type { IdRouteParams } from "@repo/database/types/api";
import { ROLE } from "@repo/shared/constants";
import { HTTP_STATUS } from "@repo/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (user.profile.role !== ROLE.OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
  }

  try {
    const { id } = await params;
    const result = await resetUserPassword(id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Failed to reset user password:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi đặt lại mật khẩu." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
