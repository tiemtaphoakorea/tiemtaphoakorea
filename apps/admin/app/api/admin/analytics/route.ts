import { getInternalUser } from "@repo/database/lib/auth";
import { getAnalyticsData } from "@repo/database/services/analytics.server";
import { ROLE } from "@repo/shared/constants";
import { HTTP_STATUS } from "@repo/shared/http-status";
import { NextResponse } from "next/server";

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
