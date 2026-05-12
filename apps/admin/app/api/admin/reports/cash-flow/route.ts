import { getCashFlowReport } from "@workspace/database/services/report.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { parseDateRange } from "@/lib/date-range";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const range = parseDateRange(searchParams);
  if (!range.ok) return range.response;

  const groupByRaw = (searchParams.get("groupBy") ?? "day").toLowerCase();
  const groupBy: "day" | "week" | "month" =
    groupByRaw === "week" || groupByRaw === "month" ? groupByRaw : "day";

  try {
    const report = await getCashFlowReport({
      startDate: range.startDate,
      endDate: range.endDate,
      groupBy,
    });
    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to fetch cash flow report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
