import { NextResponse } from "next/server";
import { getInternalUser } from "@/lib/auth.server";
import { HTTP_STATUS } from "@/lib/http-status";

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
