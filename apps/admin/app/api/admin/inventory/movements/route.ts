import { getInternalUser } from "@workspace/database/lib/auth";
import { getInventoryMovements } from "@workspace/database/services/inventory.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : undefined;
}

const VALID_MOVEMENT_TYPES = [
  "stock_out",
  "supplier_receipt",
  "manual_adjustment",
  "cancellation",
  "stock_count_balance",
  "cost_adjustment",
] as const;

export async function GET(req: NextRequest) {
  const user = await getInternalUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { searchParams } = req.nextUrl;
  const variantId = searchParams.get("variantId") ?? undefined;
  const rawType = searchParams.get("type");
  const type = VALID_MOVEMENT_TYPES.includes(rawType as any)
    ? (rawType as (typeof VALID_MOVEMENT_TYPES)[number])
    : undefined;
  const startDate = parseDate(searchParams.get("startDate"));
  const endDate = parseDate(searchParams.get("endDate"));
  const search = searchParams.get("search") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10) || 20);

  try {
    const result = await getInventoryMovements({
      variantId,
      type,
      search,
      startDate,
      endDate,
      page,
      limit,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to load inventory movements:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
