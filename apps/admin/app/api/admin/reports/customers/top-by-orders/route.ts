import { getCustomerAggregate } from "@workspace/database/services/report-customers.server";
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

  const search = searchParams.get("search") ?? undefined;
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 50);

  try {
    const report = await getCustomerAggregate({
      startDate: range.startDate,
      endDate: range.endDate,
      sortBy: "order_count",
      search,
      page,
      limit,
    });
    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to fetch top-by-orders report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
