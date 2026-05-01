import { getInternalUser } from "@workspace/database/lib/auth";
import {
  deleteCategory,
  generateCategorySlug,
  updateCategory,
} from "@workspace/database/services/category.server";
import type { IdRouteParams } from "@workspace/database/types/api";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { categorySchema } from "@workspace/shared/schemas";
import { type NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: IdRouteParams) {
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

    const { id } = await params;
    const { name, parentId, description, imageUrl, displayOrder, isActive } = parsed.data;
    const slug = await generateCategorySlug(name, id);

    const updatedCategory = await updateCategory(id, {
      name,
      parentId: parentId ?? null,
      description,
      imageUrl: imageUrl ?? null,
      slug,
      displayOrder: displayOrder ?? 0,
      isActive: isActive ?? true,
    });

    return NextResponse.json({ success: true, category: updatedCategory });
  } catch (error: any) {
    console.error("Failed to update category:", error);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra khi cập nhật danh mục." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

/** PATCH: partial update — used by Settings page to toggle showInNav without touching slug */
export async function PATCH(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const body = await request.json();
    const { id } = await params;

    const updatedCategory = await updateCategory(id, {
      showInNav: body.showInNav === true,
    });

    return NextResponse.json({ success: true, category: updatedCategory });
  } catch (error: any) {
    console.error("Failed to patch category:", error);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra khi cập nhật danh mục." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { id } = await params;
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete category:", error);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra khi xóa danh mục." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
