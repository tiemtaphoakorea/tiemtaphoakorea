import { getInternalUser } from "@workspace/database/lib/auth";
import { getCustomerStats } from "@workspace/database/services/customer.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const stats = await getCustomerStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch customer stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
