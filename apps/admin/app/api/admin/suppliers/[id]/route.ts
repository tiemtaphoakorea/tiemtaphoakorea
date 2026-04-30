import {
  deleteSupplier,
  getSupplierById,
  updateSupplier,
} from "@workspace/database/services/supplier-management.server";
import type { IdRouteParams } from "@workspace/database/types/api";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";

export async function GET(request: NextRequest, { params }: IdRouteParams) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const supplier = await getSupplierById(id);

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: HTTP_STATUS.NOT_FOUND });
    }

    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    console.error("Failed to fetch supplier:", error);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra khi xóa nhà cung cấp." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function PUT(request: NextRequest, { params }: IdRouteParams) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return auth.response;

  try {
    const updates = await request.json();
    const { id } = await params;
    const updatedSupplier = await updateSupplier(id, {
      ...updates,
      isActive:
        updates.isActive === true || updates.isActive === "true" || updates.isActive === undefined
          ? updates.isActive
          : false,
    });

    return NextResponse.json({ success: true, supplier: updatedSupplier });
  } catch (error: any) {
    console.error("Failed to update supplier:", error);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra khi cập nhật nhà cung cấp." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: IdRouteParams) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await deleteSupplier(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete supplier:", error);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra khi xóa nhà cung cấp." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
