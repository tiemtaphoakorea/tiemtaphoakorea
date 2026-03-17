import { type NextRequest, NextResponse } from "next/server";
import { getInternalUser } from "@/lib/auth.server";
import { ROLE } from "@/lib/constants";
import { HTTP_STATUS } from "@/lib/http-status";
import { getFinancialStats } from "@/services/finance.server";

export async function GET(request: NextRequest) {
  const user = await getInternalUser();

  // Finance module is Owner-only
  if (!user || user.profile.role !== ROLE.OWNER) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  let stats;

  try {
    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }

      if (startDate > endDate) {
        return NextResponse.json(
          { error: "Start date must be before end date" },
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }

      stats = await getFinancialStats({ startDate, endDate });
    } else if (monthParam && yearParam) {
      const month = Number.parseInt(monthParam, 10);
      const year = Number.parseInt(yearParam, 10);

      if (Number.isNaN(month) || Number.isNaN(year)) {
        return NextResponse.json(
          { error: "Invalid month or year" },
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }
      stats = await getFinancialStats({ month, year });
    } else {
      return NextResponse.json(
        {
          error: "Missing required parameters: month/year or startDate/endDate",
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Failed to fetch financial stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
