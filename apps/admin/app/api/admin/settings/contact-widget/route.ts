import { getInternalUser } from "@workspace/database/lib/auth";
import { getSetting, upsertSetting } from "@workspace/database/services/settings.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export type ContactWidgetConfig = {
  messengerUrl: string;
};

const DEFAULT_CONFIG: ContactWidgetConfig = {
  messengerUrl: "",
};

const SETTING_KEY = "contact_widget_config";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const stored = await getSetting<ContactWidgetConfig>(SETTING_KEY);
  return NextResponse.json(stored ?? DEFAULT_CONFIG);
}

export async function PUT(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const body = await request.json();
  const config: ContactWidgetConfig = {
    messengerUrl: String(body.messengerUrl ?? "").trim(),
  };

  await upsertSetting(SETTING_KEY, config);
  return NextResponse.json(config);
}
