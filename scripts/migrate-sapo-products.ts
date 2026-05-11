import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../packages/database/src/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

const JSON_PATH = path.join(__dirname, "../../../Downloads/sapo_products.json");

// --- Types matching the downloaded sapo_products.json ---
interface SapoImage {
  id: number;
  file_name: string;
  full_path: string;
  size: number;
  position: number;
}

interface SapoInventory {
  location_id: number;
  on_hand: number;
  available?: number;
  committed?: number;
}

interface SapoPriceListMeta {
  is_cost?: boolean;
  code?: string;
  name?: string;
}

interface SapoVariantPrice {
  name?: string;
  value: number;
  included_tax_price?: number;
  price_list?: SapoPriceListMeta;
}

interface SapoVariant {
  id: number;
  sku: string;
  barcode: string | null;
  name: string;
  opt1: string | null;
  opt2: string | null;
  opt3: string | null;
  // Admin endpoint shape (preferred)
  variant_retail_price?: number;
  variant_whole_price?: number;
  variant_import_price?: number;
  variant_prices?: SapoVariantPrice[];
  cost_price?: number | null;
  // Legacy OpenAPI shape (fallback for older exports)
  retail_price?: number;
  whole_price?: number;
  import_price?: number;
  status: string;
  sellable?: boolean;
  unit: string | null;
  weight_value: number;
  weight_unit: string;
  inventories: SapoInventory[];
}

// --- Price extraction (admin endpoint first, OpenAPI fallback) ---
function getRetailPrice(v: SapoVariant): number {
  return Number(v.variant_retail_price ?? v.retail_price ?? 0);
}

function getCostPrice(v: SapoVariant): number {
  const fromPriceList = (v.variant_prices ?? []).find((p) => p.price_list?.is_cost)?.value;
  return Number(fromPriceList ?? v.variant_import_price ?? v.cost_price ?? v.import_price ?? 0);
}

interface SapoProduct {
  id: number;
  name: string;
  status: string;
  product_type: string;
  category: string | null;
  brand: string | null;
  tags: string;
  description: string | null;
  created_on: string;
  modified_on: string;
  images: SapoImage[];
  variants: SapoVariant[];
}

// --- Slug generator (handles Vietnamese and special chars) ---
function slugify(text: string, suffix?: string | number): string {
  const base = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
  return suffix !== undefined ? `${base}-${suffix}` : base;
}

// --- Sum on_hand across all locations ---
function totalOnHand(inventories: SapoInventory[]): number {
  return inventories.reduce((sum, inv) => sum + (inv.on_hand ?? 0), 0);
}

// --- Main ---
async function main() {
  if (!fs.existsSync(JSON_PATH)) {
    throw new Error(`JSON not found: ${JSON_PATH}\nRun the browser fetch step first.`);
  }

  const raw = fs.readFileSync(JSON_PATH, "utf-8");
  const products: SapoProduct[] = JSON.parse(raw);
  console.log(`Loaded ${products.length} products from JSON\n`);

  // --- Step 1: Upsert products + variants + images ---
  const total = products.length;
  let processed = 0;
  let variantCount = 0;
  let imageCount = 0;
  let zeroCostCount = 0;

  console.log(`\nMigrating ${total} products...\n`);

  for (const sapoProduct of products) {
    processed++;

    const isProductActive = sapoProduct.status === "active";
    const activeVariants = sapoProduct.variants.filter((v) => v.status === "active");
    // Use all variants if none are active
    const variantsToMigrate = activeVariants.length > 0 ? activeVariants : sapoProduct.variants;

    try {
      await db.transaction(async (tx) => {
        const categoryId = null;

        // Use first variant's retail price as base price
        const basePrice = getRetailPrice(variantsToMigrate[0]);

        // Generate a unique slug: name + sapo id
        const slug = slugify(sapoProduct.name, sapoProduct.id);

        const [product] = await tx
          .insert(schema.products)
          .values({
            name: sapoProduct.name,
            slug,
            description: sapoProduct.description ?? null,
            basePrice: basePrice.toFixed(2),
            categoryId,
            isActive: isProductActive,
          })
          .onConflictDoUpdate({
            target: schema.products.slug,
            set: {
              name: sapoProduct.name,
              description: sapoProduct.description ?? null,
              basePrice: basePrice.toFixed(2),
              categoryId,
              isActive: isProductActive,
            },
          })
          .returning({ id: schema.products.id });

        // Determine which images belong to which variant.
        // Sapo stores images at the product level; assign all product images
        // to the first variant (primary), and only the first image to others.
        const productImages = sapoProduct.images ?? [];

        for (let vi = 0; vi < variantsToMigrate.length; vi++) {
          const v = variantsToMigrate[vi];
          const onHand = totalOnHand(v.inventories ?? []);

          // Ensure SKU uniqueness: append sapo variant id if sku is blank
          const sku = v.sku?.trim() || `sapo-${v.id}`;

          const retail = getRetailPrice(v);
          const cost = getCostPrice(v);
          if (cost === 0) zeroCostCount++;

          const [variant] = await tx
            .insert(schema.productVariants)
            .values({
              productId: product.id,
              sku,
              name: v.name,
              price: retail.toFixed(2),
              costPrice: cost.toFixed(2),
              onHand,
              isActive: v.status === "active",
            })
            .onConflictDoUpdate({
              target: schema.productVariants.sku,
              set: {
                name: v.name,
                price: retail.toFixed(2),
                costPrice: cost.toFixed(2),
                onHand,
                isActive: v.status === "active",
              },
            })
            .returning({ id: schema.productVariants.id });

          variantCount++;

          // Assign images: first variant gets all product images; others get only the primary
          const imagesToAssign =
            vi === 0
              ? productImages
              : productImages.filter((img) => img.position === 1).slice(0, 1);

          if (imagesToAssign.length > 0) {
            // Skip if any image for this variant is already hosted on Supabase Storage —
            // that means migrate-images-to-supabase.ts has already moved them and we don't
            // want to overwrite the durable URLs with ephemeral Sapo CDN links.
            const existingImages = await tx
              .select({ imageUrl: schema.variantImages.imageUrl })
              .from(schema.variantImages)
              .where(eq(schema.variantImages.variantId, variant.id));

            const alreadyOnSupabase = existingImages.some((img) =>
              img.imageUrl?.includes("supabase"),
            );

            if (!alreadyOnSupabase) {
              await tx
                .delete(schema.variantImages)
                .where(eq(schema.variantImages.variantId, variant.id));

              await tx.insert(schema.variantImages).values(
                imagesToAssign.map((img, i) => ({
                  variantId: variant.id,
                  imageUrl: img.full_path,
                  displayOrder: i,
                  isPrimary: i === 0,
                })),
              );

              imageCount += imagesToAssign.length;
            }
          }
        }

        console.log(
          `  [${processed}/${total}] ${sapoProduct.name.padEnd(35)} ` +
            `${variantsToMigrate.length} variant(s)  ${productImages.length} image(s)`,
        );
      });
    } catch (err) {
      console.error(`  [${processed}/${total}] ERROR: ${sapoProduct.name}:`, err);
    }
  }

  console.log(`
Done.
  Products processed : ${processed}/${total}
  Variants inserted  : ${variantCount}
  Variants cost = 0  : ${zeroCostCount} (${((100 * zeroCostCount) / Math.max(1, variantCount)).toFixed(1)}%) ← need manual fix in Sapo
  Images inserted    : ${imageCount}
`);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
