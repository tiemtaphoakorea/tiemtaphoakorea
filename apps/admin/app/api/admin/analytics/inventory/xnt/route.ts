import { getInternalUser } from "@workspace/database/lib/auth";
import { getXntReport } from "@workspace/database/services/inventory.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : undefined;
}

export async function GET(request: NextRequest) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { searchParams } = new URL(request.url);
  const startDate = parseDate(searchParams.get("startDate"));
  const endDate = parseDate(searchParams.get("endDate"));

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  // Include the full end day in UTC (avoid server-TZ drift)
  const endOfDay = new Date(
    Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "30", 10) || 30);

  try {
    const data = await getXntReport({
      startDate,
      endDate: endOfDay,
      search: searchParams.get("search") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      page,
      limit,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load XNT report:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
