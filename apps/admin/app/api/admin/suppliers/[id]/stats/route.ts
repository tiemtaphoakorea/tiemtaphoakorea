import { getInternalUser } from "@repo/database/lib/auth";
import { getSupplierStats } from "@repo/database/services/supplier.server";
import type { IdRouteParams } from "@repo/database/types/api";
import { HTTP_STATUS } from "@repo/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { id } = await params;
    const result = await getSupplierStats(id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to fetch supplier stats:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tải thống kê nhà cung cấp." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
