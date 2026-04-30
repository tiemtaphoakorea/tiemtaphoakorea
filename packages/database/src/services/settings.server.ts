import { eq } from "drizzle-orm";
import { db } from "../db";
import { systemSettings } from "../schema/settings";

export async function getSetting<T>(key: string): Promise<T | null> {
  const row = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, key),
  });
  return row ? (row.value as T) : null;
}

export async function upsertSetting<T>(key: string, value: T): Promise<void> {
  await db
    .insert(systemSettings)
    .values({ key, value: value as any })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: value as any, updatedAt: new Date() },
    });
}
