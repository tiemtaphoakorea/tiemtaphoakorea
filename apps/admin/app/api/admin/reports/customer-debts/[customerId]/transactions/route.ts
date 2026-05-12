import { getCustomerDebtTransactions } from "@workspace/database/services/report.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { parseDateRange } from "@/lib/date-range";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> },
) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { customerId } = await params;
  const { searchParams } = new URL(request.url);
  const range = parseDateRange(searchParams);
  if (!range.ok) return range.response;

  try {
    const data = await getCustomerDebtTransactions({
      customerId,
      startDate: range.startDate,
      endDate: range.endDate,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch customer debt transactions:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
