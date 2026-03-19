import { getInternalUser } from "@repo/database/lib/auth";
import {
  deleteSupplier,
  getSupplierById,
  updateSupplier,
} from "@repo/database/services/supplier-management.server";
import type { IdRouteParams } from "@repo/database/types/api";
import { ROLE } from "@repo/shared/constants";
import { HTTP_STATUS } from "@repo/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

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
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

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
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (user.profile.role !== ROLE.OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
  }

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
