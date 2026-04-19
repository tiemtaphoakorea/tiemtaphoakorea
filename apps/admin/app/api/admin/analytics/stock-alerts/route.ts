import { getInternalUser } from "@workspace/database/lib/auth";
import { getStockAlerts } from "@workspace/database/services/analytics.server";
import { ROLE } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
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
    const data = await getStockAlerts();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch stock alerts:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tải dữ liệu tồn kho." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
