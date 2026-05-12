import { getPayoutTransactionsByMethod } from "@workspace/database/services/report-purchases.server";
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

  const method = searchParams.get("method");
  if (!method) {
    return NextResponse.json(
      { error: "Missing required parameter: method" },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  try {
    const transactions = await getPayoutTransactionsByMethod({
      method,
      startDate: range.startDate,
      endDate: range.endDate,
    });
    return NextResponse.json({ data: transactions });
  } catch (error) {
    console.error("Failed to fetch payout transactions drilldown:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
