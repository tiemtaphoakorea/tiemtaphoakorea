import "dotenv/config";
import { eq, not, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createAdminClient } from "../packages/database/src/lib/supabase/admin";
import * as schema from "../packages/database/src/schema";
import {
  PRODUCT_IMAGE_BUCKET_NAME,
  PRODUCT_IMAGE_PATH_PREFIX,
  STORAGE_CACHE_CONTROL,
} from "../packages/shared/src/constants";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });
const supabase = createAdminClient();

const CONCURRENCY = 5;
const FETCH_TIMEOUT_MS = 30_000;

function extFromContentType(ct: string | null, url: string): string {
  if (ct) {
    if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
    if (ct.includes("png")) return "png";
    if (ct.includes("webp")) return "webp";
    if (ct.includes("gif")) return "gif";
  }
  const m = url.match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

function randomName(ext: string): string {
  return `${Math.random().toString(36).substring(2)}-${Date.now()}.${ext}`;
}

async function migrateOne(row: { id: string; imageUrl: string }): Promise<{
  ok: boolean;
  reason?: string;
}> {
  try {
    const ctrl = new AbortController();
    const tmo = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(row.imageUrl, { signal: ctrl.signal });
    clearTimeout(tmo);

    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };

    const contentType = res.headers.get("content-type");
    const buffer = new Uint8Array(await res.arrayBuffer());
    const ext = extFromContentType(contentType, row.imageUrl);
    const filePath = `${PRODUCT_IMAGE_PATH_PREFIX}/${randomName(ext)}`;

    const { error: uploadErr } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET_NAME)
      .upload(filePath, buffer, {
        cacheControl: STORAGE_CACHE_CONTROL,
        contentType: contentType ?? `image/${ext}`,
        upsert: false,
      });

    if (uploadErr) return { ok: false, reason: `upload: ${uploadErr.message}` };

    const {
      data: { publicUrl },
    } = supabase.storage.from(PRODUCT_IMAGE_BUCKET_NAME).getPublicUrl(filePath);

    await db
      .update(schema.variantImages)
      .set({ imageUrl: publicUrl })
      .where(eq(schema.variantImages.id, row.id));

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  const rows = await db
    .select({
      id: schema.variantImages.id,
      imageUrl: schema.variantImages.imageUrl,
    })
    .from(schema.variantImages)
    .where(not(like(schema.variantImages.imageUrl, "%supabase.co%")));

  const total = rows.length;
  console.log(`${total} images to migrate (concurrency=${CONCURRENCY})\n`);

  if (total === 0) {
    await client.end();
    return;
  }

  let okCount = 0;
  let skipCount = 0;
  const failures: Array<{ url: string; reason: string }> = [];
  let processed = 0;

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batch = rows.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(migrateOne));

    batch.forEach((row, idx) => {
      const r = results[idx];
      processed++;
      if (r.ok) {
        okCount++;
      } else {
        skipCount++;
        failures.push({ url: row.imageUrl, reason: r.reason ?? "unknown" });
      }
    });

    if (processed % 50 === 0 || processed === total) {
      console.log(`  [${processed}/${total}] ok=${okCount} skip=${skipCount}`);
    }
  }

  console.log(`\nDone. ok=${okCount} skip=${skipCount} / ${total}`);

  if (failures.length > 0) {
    const preview = failures.slice(0, 20);
    console.log(
      `\n${failures.length} failures${failures.length > 20 ? " (first 20)" : ""}:`,
    );
    preview.forEach((f) => console.log(`  - ${f.url.substring(0, 80)}... → ${f.reason}`));
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
