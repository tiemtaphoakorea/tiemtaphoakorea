import { db } from "@workspace/database/db";
import { signSession, verifyPassword } from "@workspace/database/lib/security";
import { profiles } from "@workspace/database/schema/profiles";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Determine input type: JSON or FormData
    const contentType = request.headers.get("content-type") || "";
    let username, password;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      username = body.username || body.email;
      password = body.password;
    } else {
      const formData = await request.formData();
      username = (formData.get("username") as string) || (formData.get("email") as string);
      password = formData.get("password") as string;
    }

    if (!username || !password) {
      return NextResponse.json(
        {
          error: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu",
          success: false,
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    // Fetch user from profiles table by username
    const userProfile = await db.query.profiles.findFirst({
      where: eq(profiles.username, username),
    });

    if (!userProfile || !userProfile.passwordHash) {
      return NextResponse.json(
        {
          error: "Tên đăng nhập hoặc mật khẩu không chính xác",
          success: false,
        },
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    const isPasswordCorrect = await verifyPassword(password, userProfile.passwordHash);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        {
          error: "Tên đăng nhập hoặc mật khẩu không chính xác",
          success: false,
        },
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    if (!userProfile.isActive) {
      return NextResponse.json(
        {
          error: "Tài khoản của bạn đã bị khóa",
          success: false,
        },
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    // Success response
    const token = await signSession({
      userId: userProfile.id,
      username: userProfile.username,
      role: userProfile.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        error: "",
        access_token: token,
        user: {
          id: userProfile.id,
          username: userProfile.username,
          role: userProfile.role,
          fullName: userProfile.fullName,
        },
      },
      { status: HTTP_STATUS.OK },
    );

    // Set cookie
    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Unexpected login error:", error);
    return NextResponse.json(
      {
        error: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
        success: false,
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
