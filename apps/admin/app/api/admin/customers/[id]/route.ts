import {
  deleteCustomer,
  getCustomerDetails,
  updateCustomer,
} from "@workspace/database/services/customer.server";
import type { IdRouteParams } from "@workspace/database/types/api";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";

export async function GET(request: NextRequest, { params }: IdRouteParams) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const customer = await getCustomerDetails(id);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    return NextResponse.json({ customer });
  } catch (error: any) {
    console.error("Failed to fetch customer:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
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
    const updatedProfile = await updateCustomer(id, updates);
    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    console.error("Failed to update customer:", error);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra khi cập nhật khách hàng." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: IdRouteParams) {
  const auth = await requireApiUser(request, "owner");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const deleted = await deleteCustomer(id);
    if (!deleted) {
      return NextResponse.json({ error: "Customer not found" }, { status: HTTP_STATUS.NOT_FOUND });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete customer:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi xóa khách hàng." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
