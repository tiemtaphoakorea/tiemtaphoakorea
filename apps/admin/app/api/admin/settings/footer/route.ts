import { getInternalUser } from "@workspace/database/lib/auth";
import { getSetting, upsertSetting } from "@workspace/database/services/settings.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";
import { DEFAULT_FOOTER_CONFIG, FOOTER_SETTING_KEY, type FooterConfig } from "@/lib/footer-config";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  const stored = await getSetting<FooterConfig>(FOOTER_SETTING_KEY);
  return NextResponse.json(stored ?? DEFAULT_FOOTER_CONFIG);
}

export async function PUT(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  const body = await request.json();
  const config: FooterConfig = {
    tagline: String(body.tagline ?? "").trim(),
    hq: String(body.hq ?? "").trim(),
    office: String(body.office ?? "").trim(),
    officeDetail: String(body.officeDetail ?? "").trim(),
    copyright: String(body.copyright ?? "").trim(),
  };
  await upsertSetting(FOOTER_SETTING_KEY, config);
  return NextResponse.json(config);
}
