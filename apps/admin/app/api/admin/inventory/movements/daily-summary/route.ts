import { getInternalUser } from "@workspace/database/lib/auth";
import { getInventoryDailySummary } from "@workspace/database/services/inventory.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : undefined;
}

export async function GET(req: NextRequest) {
  const user = await getInternalUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { searchParams } = req.nextUrl;
  const variantId = searchParams.get("variantId") ?? undefined;
  const startDate = parseDate(searchParams.get("startDate"));
  const endDate = parseDate(searchParams.get("endDate"));

  const rows = await getInventoryDailySummary({ variantId, startDate, endDate });
  return NextResponse.json({ data: rows });
}
