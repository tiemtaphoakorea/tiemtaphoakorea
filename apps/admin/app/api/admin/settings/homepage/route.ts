import { getInternalUser } from "@workspace/database/lib/auth";
import { getSetting, upsertSetting } from "@workspace/database/services/settings.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  HOMEPAGE_SETTING_KEY,
  type HomepageConfig,
} from "@/lib/homepage-config";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const stored = await getSetting<HomepageConfig>(HOMEPAGE_SETTING_KEY);
  return NextResponse.json(stored ?? DEFAULT_HOMEPAGE_CONFIG);
}

export async function PUT(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const body = await request.json();
  const config: HomepageConfig = {
    seo: {
      title: String(body.seo?.title ?? "").trim(),
      description: String(body.seo?.description ?? "").trim(),
    },
  };

  await upsertSetting(HOMEPAGE_SETTING_KEY, config);
  return NextResponse.json(config);
}
