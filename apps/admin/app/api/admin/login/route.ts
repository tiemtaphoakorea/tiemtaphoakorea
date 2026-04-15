import { db } from "@workspace/database/db";
import { signSession, verifyPassword } from "@workspace/database/lib/security";
import { profiles } from "@workspace/database/schema/profiles";
import { INTERNAL_ROLES } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Simple in-memory rate limiter: max 5 failed attempts per IP per 15 minutes.
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (entry && entry.resetAt > now && entry.count >= RATE_LIMIT_MAX) return false;
  return true;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    failedAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

function clearFailures(ip: string): void {
  failedAttempts.delete(ip);
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        error: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.",
        success: false,
      },
      { status: 429 },
    );
  }

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
      recordFailure(ip);
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
      recordFailure(ip);
      return NextResponse.json(
        {
          error: "Tên đăng nhập hoặc mật khẩu không chính xác",
          success: false,
        },
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    // Check role BEFORE isActive — never reveal which check failed to the caller.
    if (!INTERNAL_ROLES.includes(userProfile.role as (typeof INTERNAL_ROLES)[number])) {
      recordFailure(ip);
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
          error: "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
          success: false,
        },
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    clearFailures(ip);

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
        user: {
          id: userProfile.id,
          username: userProfile.username,
          role: userProfile.role,
          fullName: userProfile.fullName,
        },
      },
      { status: HTTP_STATUS.OK },
    );

    // Set httpOnly cookie — this is the sole auth mechanism
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
        error: "Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau hoặc liên hệ hỗ trợ kỹ thuật.",
        success: false,
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
