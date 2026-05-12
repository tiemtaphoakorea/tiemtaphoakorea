import { getLedgerReport } from "@workspace/database/services/report-inventory.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { parseDateRange } from "@/lib/date-range";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const variantId = searchParams.get("variantId");

  if (!variantId) {
    return NextResponse.json(
      { error: "variantId is required" },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const range = parseDateRange(searchParams);
  if (!range.ok) return range.response;

  try {
    const report = await getLedgerReport({
      variantId,
      startDate: range.startDate,
      endDate: range.endDate,
      typeFilter: (searchParams.get("typeFilter") as "in" | "out" | "adjust" | "all") ?? "all",
      search: searchParams.get("search") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 50,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to fetch ledger report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
