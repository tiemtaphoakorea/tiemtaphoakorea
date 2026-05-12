import {
  getPurchasesStaffReceipts,
  getPurchasesUnknownStaffReceipts,
} from "@workspace/database/services/report-purchases.server";
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

  const staffId = searchParams.get("staffId");

  try {
    // staffId === "unknown" or absent → the "Chưa rõ NV" bucket
    const receipts =
      !staffId || staffId === "unknown"
        ? await getPurchasesUnknownStaffReceipts({
            startDate: range.startDate,
            endDate: range.endDate,
          })
        : await getPurchasesStaffReceipts({
            staffId,
            startDate: range.startDate,
            endDate: range.endDate,
          });

    return NextResponse.json({ data: receipts });
  } catch (error) {
    console.error("Failed to fetch staff receipts drilldown:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
