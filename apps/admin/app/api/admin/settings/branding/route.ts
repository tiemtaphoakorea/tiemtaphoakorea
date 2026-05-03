import { getInternalUser } from "@workspace/database/lib/auth";
import { getSetting, upsertSetting } from "@workspace/database/services/settings.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export type BrandingConfig = {
  logoMainUrl: string;
  logoSquareUrl: string;
  logoAccent: string;
  brandColor: string;
  accentColor: string;
  faviconUrl: string;
  appleIconUrl: string;
  ogImageUrl: string;
};

const DEFAULT_CONFIG: BrandingConfig = {
  logoMainUrl: "",
  logoSquareUrl: "",
  logoAccent: "",
  brandColor: "#6366F1",
  accentColor: "#F59E0B",
  faviconUrl: "",
  appleIconUrl: "",
  ogImageUrl: "",
};

const SETTING_KEY = "branding";

const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function normalizeHex(value: unknown, fallback: string): string {
  const s = String(value ?? "").trim();
  return HEX_PATTERN.test(s) ? s : fallback;
}

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const stored = await getSetting<BrandingConfig>(SETTING_KEY);
  return NextResponse.json(stored ?? DEFAULT_CONFIG);
}

export async function PUT(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const body = await request.json();
  const config: BrandingConfig = {
    logoMainUrl: String(body.logoMainUrl ?? "").trim(),
    logoSquareUrl: String(body.logoSquareUrl ?? "").trim(),
    logoAccent: String(body.logoAccent ?? "").trim(),
    brandColor: normalizeHex(body.brandColor, DEFAULT_CONFIG.brandColor),
    accentColor: normalizeHex(body.accentColor, DEFAULT_CONFIG.accentColor),
    faviconUrl: String(body.faviconUrl ?? "").trim(),
    appleIconUrl: String(body.appleIconUrl ?? "").trim(),
    ogImageUrl: String(body.ogImageUrl ?? "").trim(),
  };

  await upsertSetting(SETTING_KEY, config);
  return NextResponse.json(config);
}
