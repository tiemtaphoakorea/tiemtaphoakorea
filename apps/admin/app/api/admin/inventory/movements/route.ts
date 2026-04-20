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
    ? (rawType as "stock_out" | "supplier_receipt" | "manual_adjustment" | "cancellation")
    : undefined;
  const startDate = parseDate(searchParams.get("startDate"));
  const endDate = parseDate(searchParams.get("endDate"));
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));

  const result = await getInventoryMovements({ variantId, type, startDate, endDate, page, limit });
  return NextResponse.json(result);
}
