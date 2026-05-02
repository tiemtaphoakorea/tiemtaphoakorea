import { getProductsForListing } from "@workspace/database/services/product.server";
import { PRODUCT_SORT } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import type { ProductSort } from "@workspace/shared/types/product";
import { type NextRequest, NextResponse } from "next/server";

const PRODUCT_SORT_SET = new Set<string>(Object.values(PRODUCT_SORT));

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("q") || searchParams.get("search") || undefined;
  const categorySlugs = searchParams.getAll("category").filter(Boolean);

  const sortParam = searchParams.get("sort") || PRODUCT_SORT.LATEST;
  const sort: ProductSort = PRODUCT_SORT_SET.has(sortParam)
    ? (sortParam as ProductSort)
    : PRODUCT_SORT.LATEST;

  const parsedPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const parsedLimit = Number.parseInt(searchParams.get("limit") || "4", 10);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 48) : 4;

  try {
    const listing = await getProductsForListing({
      search,
      categorySlugs,
      sort,
      page,
      limit,
    });

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Failed to fetch public products listing:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tải sản phẩm." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
