import { type NextRequest, NextResponse } from "next/server";
import { getInternalUser } from "@/lib/auth.server";
import { ROLE } from "@/lib/constants";
import { HTTP_STATUS } from "@/lib/http-status";
import { deleteUser, getUserById, toggleUserStatus, updateUser } from "@/services/user.server";
import type { IdRouteParams } from "@/types/api";

export async function GET(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (user.profile.role !== ROLE.OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
  }

  try {
    const { id } = await params;
    const profile = await getUserById(id);

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: HTTP_STATUS.NOT_FOUND });
    }

    return NextResponse.json({ user: profile });
  } catch (error: any) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function PUT(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (user.profile.role !== ROLE.OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
  }

  try {
    const body = await request.json();
    const { fullName, phone, role, isActive } = body;
    let updatedProfile: any = null;
    const { id } = await params;

    if (fullName !== undefined || phone !== undefined || role !== undefined) {
      if (role !== undefined && role === ROLE.CUSTOMER) {
        return NextResponse.json(
          { error: "Invalid role for staff user" },
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }
      updatedProfile = await updateUser(id, {
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(role !== undefined && { role }),
      });
    }

    if (isActive !== undefined) {
      updatedProfile = await toggleUserStatus(id, Boolean(isActive));
    }

    if (!updatedProfile) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi cập nhật nhân viên." },
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
    const deleted = await deleteUser(id);
    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: HTTP_STATUS.NOT_FOUND });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi xóa nhân viên." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
