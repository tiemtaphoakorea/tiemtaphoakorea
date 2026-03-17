import { NextResponse } from "next/server";
import { HTTP_STATUS } from "@/lib/http-status";

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
