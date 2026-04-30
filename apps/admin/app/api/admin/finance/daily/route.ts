import { getInternalUser } from "@workspace/database/lib/auth";
import { getDayOrders } from "@workspace/database/services/finance.server";
import { ROLE } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getInternalUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (user.profile.role !== ROLE.OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: "Missing required parameter: date" },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  try {
    const orders = await getDayOrders(date);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Failed to fetch day orders:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
