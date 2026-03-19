import { getInternalUser } from "@repo/database/lib/auth";
import { getOrderStats } from "@repo/database/services/order.server";
import { HTTP_STATUS } from "@repo/shared/http-status";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const stats = await getOrderStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch order stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
