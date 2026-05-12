import {
  getCustomersInBucket,
  getNewVsReturningReport,
  type SegmentBucket,
} from "@workspace/database/services/report-customers.server";
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

  // Drilldown mode: ?mode=customers&bucket=new|returning
  const mode = searchParams.get("mode");
  if (mode === "customers") {
    const bucket = searchParams.get("bucket") as SegmentBucket | null;
    if (bucket !== "new" && bucket !== "returning") {
      return NextResponse.json(
        { error: "bucket must be 'new' or 'returning'" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 50);
    try {
      const result = await getCustomersInBucket({
        bucket,
        startDate: range.startDate,
        endDate: range.endDate,
        page,
        limit,
      });
      return NextResponse.json(result);
    } catch (error) {
      console.error("Failed to fetch bucket customer drilldown:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Internal Server Error" },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
      );
    }
  }

  // Default: segment summary
  try {
    const report = await getNewVsReturningReport({
      startDate: range.startDate,
      endDate: range.endDate,
    });
    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to fetch new-vs-returning report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
