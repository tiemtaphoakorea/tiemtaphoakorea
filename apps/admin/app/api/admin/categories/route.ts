import { getInternalUser } from "@workspace/database/lib/auth";
import {
  createCategory,
  generateCategorySlug,
  getCategories,
  getFlatCategories,
} from "@workspace/database/services/category.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { categorySchema } from "@workspace/shared/schemas";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const flatOnly = searchParams.get("flat") === "true";

  try {
    // When ?flat=true, skip building the full category tree (saves one DB query + JS tree-build)
    if (flatOnly) {
      const flatCategories = await getFlatCategories();
      return NextResponse.json({ flatCategories });
    }

    const [categories, flatCategories] = await Promise.all([
      getCategories(search),
      getFlatCategories(),
    ]);

    return NextResponse.json({ categories, flatCategories });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tải danh sách danh mục." },
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
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const { name, parentId, description, displayOrder, isActive } = parsed.data;
    const slug = await generateCategorySlug(name);

    const newCategory = await createCategory({
      name,
      parentId: parentId ?? null,
      description,
      slug,
      displayOrder: displayOrder ?? 0,
      isActive: isActive ?? true,
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
