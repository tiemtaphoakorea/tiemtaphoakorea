import { getInternalUser } from "@repo/database/lib/auth";
import { createUser, getUsersPaginated } from "@repo/database/services/user.server";
import { ROLE } from "@repo/shared/constants";
import { HTTP_STATUS } from "@repo/shared/http-status";
import { PAGINATION_DEFAULT } from "@repo/shared/pagination";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (user.profile.role !== ROLE.OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(
      1,
      parseInt(searchParams.get("limit") || String(PAGINATION_DEFAULT.LIMIT), 10),
    );
    const result = await getUsersPaginated({ search, page, limit });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (user.profile.role !== ROLE.OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
  }

  try {
    const body = await request.json();
    const { username, fullName, role, phone, password } = body;

    if (!username || !fullName || !role) {
      return NextResponse.json(
        { error: "Missing username, fullName, or role" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    if (role === ROLE.CUSTOMER) {
      return NextResponse.json(
        { error: "Invalid role for staff user" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const result = await createUser({
      username,
      fullName,
      role,
      phone,
      password,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tạo nhân viên." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
