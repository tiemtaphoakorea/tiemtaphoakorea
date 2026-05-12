import {
  getProfitByOrderReport,
  type ProfitByOrderSort,
} from "@workspace/database/services/report.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { parseDateRange } from "@/lib/date-range";

const SORT_VALUES = new Set<ProfitByOrderSort>([
  "recent",
  "profit_desc",
  "profit_asc",
  "margin_desc",
]);

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const range = parseDateRange(searchParams);
  if (!range.ok) return range.response;

  const search = searchParams.get("search") ?? undefined;
  const rawSort = searchParams.get("sort") as ProfitByOrderSort | null;
  const sort = rawSort && SORT_VALUES.has(rawSort) ? rawSort : undefined;
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");

  try {
    const report = await getProfitByOrderReport({
      startDate: range.startDate,
      endDate: range.endDate,
      search,
      sort,
      page,
      limit,
    });
    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to fetch profit-by-order report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
