import { getCustomerDebtsReport } from "@workspace/database/services/report.server";
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

  const search = searchParams.get("search") ?? "";
  const includeZero = searchParams.get("includeZero") === "1";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    200,
    Math.max(1, Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20),
  );

  try {
    const report = await getCustomerDebtsReport({
      startDate: range.startDate,
      endDate: range.endDate,
      search,
      includeZero,
      page,
      limit,
    });
    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to fetch customer debts report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
