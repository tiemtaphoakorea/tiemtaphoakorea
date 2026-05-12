import {
  getCategoryStockBreakdown,
  getCurrentStockReport,
  searchVariants,
} from "@workspace/database/services/report-inventory.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  try {
    // Sub-views: category breakdown for pie chart, variant search for picker
    if (view === "category") {
      const data = await getCategoryStockBreakdown();
      return NextResponse.json({ data });
    }

    if (view === "variants") {
      const search = searchParams.get("search") ?? "";
      const data = await searchVariants(search, 20);
      return NextResponse.json({ data });
    }

    const report = await getCurrentStockReport({
      search: searchParams.get("search") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      stockStatus:
        (searchParams.get("stockStatus") as "all" | "in-stock" | "out-of-stock" | "low") ?? "all",
      sortBy: (searchParams.get("sortBy") as "value" | "qty") ?? "value",
      sortDir: (searchParams.get("sortDir") as "asc" | "desc") ?? "desc",
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 50,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to fetch current stock report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
