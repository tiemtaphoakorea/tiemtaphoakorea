import { getInternalUser } from "@repo/database/lib/auth";
import {
  createCategory,
  generateCategorySlug,
  getCategories,
  getFlatCategories,
} from "@repo/database/services/category.server";
import { HTTP_STATUS } from "@repo/shared/http-status";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;

  try {
    const [categories, flatCategories] = await Promise.all([
      getCategories(search),
      getFlatCategories(),
    ]);

    return NextResponse.json({ categories, flatCategories });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function POST(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const data = await request.json();
    const slug = await generateCategorySlug(data.name);

    const newCategory = await createCategory({
      ...data,
      slug,
      displayOrder: Number(data.displayOrder) || 0,
      isActive: data.isActive === true || data.isActive === "true",
    });

    return NextResponse.json({ success: true, category: newCategory });
  } catch (error: any) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra khi tạo danh mục." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
