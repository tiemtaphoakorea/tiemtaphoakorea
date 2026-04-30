import { getInternalUser } from "@workspace/database/lib/auth";
import { getDailyStats } from "@workspace/database/services/finance.server";
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
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  if (!startDateParam || !endDateParam) {
    return NextResponse.json(
      { error: "Missing required parameters: startDate and endDate" },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const startDate = new Date(startDateParam);
  const endDate = new Date(endDateParam);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  if (startDate > endDate) {
    return NextResponse.json(
      { error: "Start date must be before end date" },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  try {
    const result = await getDailyStats(startDate, endDate);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch daily financial stats:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
