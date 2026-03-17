import { type NextRequest, NextResponse } from "next/server";
import { getInternalUser } from "@/lib/auth.server";
import { ROLE } from "@/lib/constants";
import { HTTP_STATUS } from "@/lib/http-status";
import { resetUserPassword } from "@/services/user.server";
import type { IdRouteParams } from "@/types/api";

export async function POST(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user || user.profile.role !== ROLE.OWNER) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
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
