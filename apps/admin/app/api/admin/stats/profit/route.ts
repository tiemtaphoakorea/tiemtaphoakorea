import { getInternalUser } from "@workspace/database/lib/auth";
import { getFinancialStats } from "@workspace/database/services/finance.server";
import { ROLE } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getInternalUser(request);

  // Detailed profit stats are Owner-only
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (user.profile.role !== ROLE.OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  if (!month || !year) {
    return NextResponse.json(
      { error: "Month and year are required" },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  try {
    const stats = await getFinancialStats({
      month: Number.parseInt(month, 10),
      year: Number.parseInt(year, 10),
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Failed to fetch profit stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
