import { resetUserPassword } from "@workspace/database/services/user.server";
import type { IdRouteParams } from "@workspace/database/types/api";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";

export async function POST(request: NextRequest, { params }: IdRouteParams) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

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
