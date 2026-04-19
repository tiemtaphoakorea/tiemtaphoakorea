import { getInternalUser } from "@workspace/database/lib/auth";
import { getDebtSummary } from "@workspace/database/services/debt.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const rawMinAgeDays = searchParams.get("minAgeDays");
  let minAgeDays: number | undefined;
  if (rawMinAgeDays != null && rawMinAgeDays !== "") {
    const parsed = Number(rawMinAgeDays);
    if (Number.isFinite(parsed) && parsed >= 0) {
      minAgeDays = Math.floor(parsed);
    }
  }

  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const page = Math.max(1, Number.isNaN(rawPage) ? 1 : rawPage);
  const rawLimit = parseInt(searchParams.get("limit") || "20", 10);
  const limit = Math.min(100, Math.max(1, Number.isNaN(rawLimit) ? 20 : rawLimit));

  try {
    const result = await getDebtSummary({ search, minAgeDays, page, limit });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch debts:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
