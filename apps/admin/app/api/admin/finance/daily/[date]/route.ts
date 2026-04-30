import { getDayOrders } from "@workspace/database/services/finance.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  try {
    const orders = await getDayOrders(date);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Failed to fetch day orders:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
