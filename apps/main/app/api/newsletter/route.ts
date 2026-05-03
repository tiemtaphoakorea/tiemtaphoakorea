import { subscribeToNewsletter } from "@workspace/database/services/newsletter.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

const ALLOWED_SOURCES = new Set(["footer", "newsletter-cta", "popup", "homepage"]);

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Yêu cầu không hợp lệ" },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const email = (body as { email?: unknown })?.email;
  const sourceRaw = (body as { source?: unknown })?.source;
  const source =
    typeof sourceRaw === "string" && ALLOWED_SOURCES.has(sourceRaw) ? sourceRaw : undefined;

  if (typeof email !== "string") {
    return NextResponse.json({ error: "Thiếu địa chỉ email" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const result = await subscribeToNewsletter(email, source);

  if (!result.ok) {
    if (result.reason === "invalid_email") {
      return NextResponse.json(
        { error: "Email không hợp lệ" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }
    return NextResponse.json(
      { error: "Không thể đăng ký lúc này" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }

  return NextResponse.json({
    success: true,
    alreadySubscribed: result.alreadySubscribed,
  });
}
