import { getSalesByOrderReport } from "@workspace/database/services/report-sales.server";
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
  const paymentStatus = searchParams.get("paymentStatus") ?? undefined;
  const fulfillmentStatus = searchParams.get("fulfillmentStatus") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");

  try {
    const report = await getSalesByOrderReport({
      startDate: range.startDate,
      endDate: range.endDate,
      search,
      paymentStatus,
      fulfillmentStatus,
      page,
      limit,
    });
    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to fetch sales by-order report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
