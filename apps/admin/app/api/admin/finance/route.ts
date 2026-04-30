import { getFinancialStats } from "@workspace/database/services/finance.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { parseDateRange } from "@/lib/date-range";

export async function GET(request: NextRequest) {
  // Finance module is Owner-only
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const hasDateRange = searchParams.has("startDate") || searchParams.has("endDate");

  let stats;

  try {
    if (hasDateRange) {
      const range = parseDateRange(searchParams);
      if (!range.ok) return range.response;
      stats = await getFinancialStats({ startDate: range.startDate, endDate: range.endDate });
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
