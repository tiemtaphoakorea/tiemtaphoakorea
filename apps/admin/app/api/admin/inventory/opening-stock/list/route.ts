import { listOpeningStockEntries } from "@workspace/database/services/inventory.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req, "owner");
  if (!auth.ok) return auth.response;

  const page = Math.max(1, Number.parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    500,
    Math.max(1, Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "100", 10) || 100),
  );
  const search = req.nextUrl.searchParams.get("search") ?? undefined;

  try {
    const result = await listOpeningStockEntries({ search, page, limit });
    return NextResponse.json(result, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error("Failed to list opening stock entries:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
