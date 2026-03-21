import { getInternalUser } from "@workspace/database/lib/auth";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const result = await getInternalUser(request);

  if (!result) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    return NextResponse.json({ profile: result.profile });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tải thông tin cá nhân." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
