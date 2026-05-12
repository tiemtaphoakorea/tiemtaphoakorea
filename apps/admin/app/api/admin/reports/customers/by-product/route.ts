import {
  getCustomersByProduct,
  getCustomersForVariant,
} from "@workspace/database/services/report-customers.server";
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

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 50);

  // Drilldown mode: ?mode=customers&variantId=<uuid>
  const mode = searchParams.get("mode");
  if (mode === "customers") {
    const variantId = searchParams.get("variantId");
    if (!variantId) {
      return NextResponse.json(
        { error: "variantId is required in customers mode" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }
    try {
      const result = await getCustomersForVariant({
        variantId,
        startDate: range.startDate,
        endDate: range.endDate,
        page,
        limit,
      });
      return NextResponse.json(result);
    } catch (error) {
      console.error("Failed to fetch variant customer drilldown:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Internal Server Error" },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
      );
    }
  }

  // Default: product list mode
  const search = searchParams.get("search") ?? undefined;
  const sortBy = (searchParams.get("sortBy") ?? "customer_count") as
    | "customer_count"
    | "revenue"
    | "qty";

  try {
    const report = await getCustomersByProduct({
      startDate: range.startDate,
      endDate: range.endDate,
      search,
      sortBy,
      page,
      limit,
    });
    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to fetch customers-by-product report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
