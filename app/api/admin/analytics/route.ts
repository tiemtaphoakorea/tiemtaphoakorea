import { NextResponse } from "next/server";
import { getInternalUser } from "@/lib/auth.server";
import { ROLE } from "@/lib/constants";
import { HTTP_STATUS } from "@/lib/http-status";
import { getAnalyticsData } from "@/services/analytics.server";

export async function GET(request: Request) {
  const internalUser = await getInternalUser(request);
  if (!internalUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (![ROLE.OWNER, ROLE.MANAGER].includes(internalUser.profile.role as any)) {
    return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
  }

  try {
    const data = await getAnalyticsData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tải dữ liệu báo cáo." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
