import {
  getInOutMovementReport,
  getVariantMovementsInPeriod,
} from "@workspace/database/services/report-inventory.server";
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

  const view = searchParams.get("view");

  try {
    // Drill-down: movements for a single variant in the period
    if (view === "drill") {
      const variantId = searchParams.get("variantId");
      if (!variantId) {
        return NextResponse.json(
          { error: "variantId required for drill view" },
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }
      const data = await getVariantMovementsInPeriod(variantId, range.startDate, range.endDate);
      return NextResponse.json({ data });
    }

    const report = await getInOutMovementReport({
      startDate: range.startDate,
      endDate: range.endDate,
      search: searchParams.get("search") ?? undefined,
      typeFilter: (searchParams.get("typeFilter") as "in" | "out" | "adjust" | "all") ?? "all",
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 50,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to fetch in-out-movement report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
