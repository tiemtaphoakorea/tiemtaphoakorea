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

const CSV_PATH = path.join(__dirname, "rieti-products.csv");

// Series definitions — keyed by SKU prefix, ordered by display
const SERIES: Array<{
  prefix: RegExp;
  slug: string;
  name: string;
  description: string;
  order: number;
}> = [
  {
    prefix: /^RT1/,
    slug: "rieti-rt1-classic",
    name: "RT1 — Classic",
    description: "Iconic everyday eyewear with clean lines.",
    order: 1,
  },
  {
    prefix: /^RT2/,
    slug: "rieti-rt2-round",
    name: "RT2 — Round",
    description: "Soft round frames for a timeless aesthetic.",
    order: 2,
  },
  {
    prefix: /^RT3/,
    slug: "rieti-rt3-premium-tr90",
    name: "RT3 — Premium TR-90",
    description: "Ultra-lightweight TR-90 frames built for comfort.",
    order: 3,
  },
  {
    prefix: /^RT4/,
    slug: "rieti-rt4-acetate",
    name: "RT4 — Acetate",
    description: "Rich acetate frames in an extensive color palette.",
    order: 4,
  },
  {
    prefix: /^RT5/,
    slug: "rieti-rt5-light",
    name: "RT5 — Light",
    description: "Featherlight frames for all-day wear.",
    order: 5,
  },
  {
    prefix: /^RT6/,
    slug: "rieti-rt6-metal",
    name: "RT6 — Metal",
    description: "Refined metal frames with precision engineering.",
    order: 6,
  },
  {
    prefix: /^RT7/,
    slug: "rieti-rt7-new-arrivals",
    name: "RT7 — New Arrivals",
    description: "Latest designs from the RT7 collection.",
    order: 7,
  },
  {
    prefix: /^RT8/,
    slug: "rieti-rt8-new-arrivals",
    name: "RT8 — New Arrivals",
    description: "Latest designs from the RT8 collection.",
    order: 8,
  },
  {
    prefix: /^P0000/,
    slug: "rieti-latest-collection",
    name: "Latest Collection",
    description: "Newest styles added to the Rieti lineup.",
    order: 9,
  },
];

const SERIES_OTHER = {
  slug: "rieti-special",
  name: "Special",
  description: "Bundles, accessories, and limited items.",
  order: 10,
};

function getSeriesSlug(sku: string): string {
  for (const s of SERIES) {
    if (s.prefix.test(sku) || (s.slug === "rieti-rt4-acetate" && /^Colder/i.test(sku))) {
      return s.slug;
    }
  }
  return SERIES_OTHER.slug;
}

interface CsvRow {
  product_name: string;
  variant_name: string;
  slug: string;
  sku: string;
  price: number;
  description: string;
  image_urls: string[];
  category: string;
  series_slug: string;
}

// --- CSV parser ---
function parseCsv(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = parseFields(lines[0]);
  const results: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = parseFields(line);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) row[headers[j]] = fields[j] ?? "";
    results.push(row);
  }
  return results;
}

function parseFields(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let value = "";
      i++;
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          value += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++;
          break;
        } else {
          value += line[i++];
        }
      }
      fields.push(value);
      if (line[i] === ",") i++;
    } else {
      const end = line.indexOf(",", i);
      if (end === -1) {
        fields.push(line.slice(i));
        break;
      } else {
        fields.push(line.slice(i, end));
        i = end + 1;
      }
    }
  }
  return fields;
}

// --- Main ---
async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV not found: ${CSV_PATH}. Run crawl-rieti.ts first.`);
  }

  const rawRows = parseCsv(fs.readFileSync(CSV_PATH, "utf-8"));
  console.log(`Parsed ${rawRows.length} rows from CSV`);

  // Validate rows
  const validRows: CsvRow[] = [];
  for (const raw of rawRows) {
    const { variant_name, sku, price: priceStr } = raw;
    if (!variant_name?.trim()) {
      console.warn(`Skip: empty variant_name`);
      continue;
    }
    if (!sku?.trim()) {
      console.warn(`Skip: no sku (${variant_name})`);
      continue;
    }
    const price = parseFloat(priceStr);
    if (Number.isNaN(price)) {
      console.warn(`Skip: invalid price "${priceStr}" (${variant_name})`);
      continue;
    }

    validRows.push({
      product_name: raw.product_name?.trim() || variant_name.trim(),
      variant_name: variant_name.trim(),
      slug: raw.slug?.trim() || "",
      sku: sku.trim(),
      price,
      description: raw.description?.trim() || "",
      image_urls: raw.image_urls ? raw.image_urls.split("|").filter(Boolean) : [],
      category: raw.category?.trim() || "SHOP",
      series_slug: getSeriesSlug(sku.trim()),
    });
  }
  console.log(`${validRows.length} valid rows after filtering\n`);

  // --- Step 1: Upsert parent "Kính mắt" category and series subcategories ---
  const allSeriesDefs = [
    ...SERIES.map((s) => ({
      slug: s.slug,
      name: s.name,
      description: s.description,
      order: s.order,
    })),
    SERIES_OTHER,
  ];
  const categoryIdBySlug = new Map<string, string>();

  console.log("Upserting parent category 'Kính mắt'...");
  const [parentCat] = await db
    .insert(schema.categories)
    .values({
      name: "Kính mắt",
      slug: "kinh-mat",
      description: "Kính mắt thời trang Rieti",
      displayOrder: 0,
    })
    .onConflictDoUpdate({
      target: schema.categories.slug,
      set: { name: "Kính mắt", description: "Kính mắt thời trang Rieti" },
    })
    .returning({ id: schema.categories.id });
  const parentCatId = parentCat.id;
  console.log(`  [cat] Kính mắt (id: ${parentCatId})`);

  console.log("Upserting series subcategories...");
  for (const s of allSeriesDefs) {
    const [cat] = await db
      .insert(schema.categories)
      .values({
        name: s.name,
        slug: s.slug,
        description: s.description,
        displayOrder: s.order,
        parentId: parentCatId,
      })
      .onConflictDoUpdate({
        target: schema.categories.slug,
        set: {
          name: s.name,
          description: s.description,
          displayOrder: s.order,
          parentId: parentCatId,
        },
      })
      .returning({ id: schema.categories.id });
    categoryIdBySlug.set(s.slug, cat.id);
    console.log(`  [cat] ${s.name}`);
  }

  // --- Step 2: Group rows by product_name, upsert one product per group ---
  const productGroups = new Map<string, CsvRow[]>();
  for (const row of validRows) {
    const key = row.product_name;
    if (!productGroups.has(key)) productGroups.set(key, []);
    productGroups.get(key)!.push(row);
  }

  const total = productGroups.size;
  let processed = 0;

  console.log(`\nSeeding ${total} products (${validRows.length} variants total)...\n`);

  for (const [productName, variants] of productGroups) {
    processed++;
    const first = variants[0];
    try {
      await db.transaction(async (tx) => {
        const categoryId = categoryIdBySlug.get(first.series_slug) ?? null;

        const [product] = await tx
          .insert(schema.products)
          .values({
            name: productName,
            slug: first.slug,
            description: first.description || null,
            basePrice: first.price.toFixed(2),
            categoryId,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: schema.products.slug,
            set: {
              name: productName,
              description: first.description || null,
              basePrice: first.price.toFixed(2),
              categoryId,
              isActive: true,
            },
          })
          .returning({ id: schema.products.id });

        for (const row of variants) {
          const [variant] = await tx
            .insert(schema.productVariants)
            .values({
              productId: product.id,
              sku: row.sku,
              name: row.variant_name,
              price: row.price.toFixed(2),
              costPrice: "0",
              stockQuantity: 0,
              isActive: true,
            })
            .onConflictDoUpdate({
              target: schema.productVariants.sku,
              set: { name: row.variant_name, price: row.price.toFixed(2) },
            })
            .returning({ id: schema.productVariants.id });

          if (row.image_urls.length > 0) {
            await tx
              .delete(schema.variantImages)
              .where(eq(schema.variantImages.variantId, variant.id));
            await tx.insert(schema.variantImages).values(
              row.image_urls.map((url, i) => ({
                variantId: variant.id,
                imageUrl: url,
                displayOrder: i,
                isPrimary: i === 0,
              })),
            );
          }
        }

        const seriesName =
          allSeriesDefs.find((s) => s.slug === first.series_slug)?.name ?? first.series_slug;
        console.log(
          `  [${processed}/${total}] ${productName.padEnd(20)} ${variants.length} variant(s)  ${seriesName}`,
        );
      });
    } catch (err) {
      console.error(`Error processing "${productName}":`, err);
    }
  }

  console.log(`\nDone. ${processed}/${total} products seeded.`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
