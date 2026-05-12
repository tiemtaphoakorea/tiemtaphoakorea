import { getPaymentsByTimeReport } from "@workspace/database/services/report-sales.server";
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

  const groupBy = (searchParams.get("groupBy") ?? "day") as "day" | "week" | "month";
  const compare = searchParams.get("compare") === "1";

  try {
    const report = await getPaymentsByTimeReport({
      startDate: range.startDate,
      endDate: range.endDate,
      groupBy,
      compare,
    });
    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to fetch payments-by-time report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
