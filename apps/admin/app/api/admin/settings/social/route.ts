import { getInternalUser } from "@workspace/database/lib/auth";
import { getSetting, upsertSetting } from "@workspace/database/services/settings.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";
import { DEFAULT_SOCIAL_CONFIG, SOCIAL_SETTING_KEY, type SocialConfig } from "@/lib/social-config";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  const stored = await getSetting<SocialConfig>(SOCIAL_SETTING_KEY);
  return NextResponse.json(stored ?? DEFAULT_SOCIAL_CONFIG);
}

export async function PUT(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  const body = await request.json();
  const config: SocialConfig = {
    instagram: String(body.instagram ?? "").trim(),
    facebook: String(body.facebook ?? "").trim(),
    youtube: String(body.youtube ?? "").trim(),
    tiktok: String(body.tiktok ?? "").trim(),
    zalo: String(body.zalo ?? "").trim(),
  };
  await upsertSetting(SOCIAL_SETTING_KEY, config);
  return NextResponse.json(config);
}
