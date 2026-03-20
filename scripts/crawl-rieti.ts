import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://en.rieti.co.kr";
const OUTPUT_PATH = path.join(__dirname, "rieti-products.csv");

// Category listing base URLs to crawl
const CATEGORY_BASES = [`${BASE_URL}/category/shop/25/`, `${BASE_URL}/category/lounge/26/`];

function csvEscape(value: string): string {
  if (/[,"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(fields: string[]): string {
  return fields.map(csvEscape).join(",");
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Step 1: Collect all product URLs by paginating category listing pages
  // Deduplicate by product_no (numeric ID in URL: /product/{slug}/{id}/)
  const productsByNo = new Map<string, string>(); // product_no -> canonical URL

  console.log("Collecting product URLs...");

  for (const categoryBase of CATEGORY_BASES) {
    let page = 1;
    while (true) {
      const listPage = await context.newPage();
      try {
        const url = `${categoryBase}?page=${page}`;
        await listPage.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        await listPage.waitForTimeout(1000);

        const hrefs: string[] = await listPage.evaluate(() => {
          return Array.from(document.querySelectorAll("a[href]"))
            .map((a) => (a as HTMLAnchorElement).href)
            .filter((h) => /\/product\/[^l]/.test(h) && h.includes("/category/"));
        });

        if (hrefs.length === 0) {
          console.log(`  ${categoryBase} page ${page}: no products, stopping.`);
          await listPage.close();
          break;
        }

        let newCount = 0;
        for (const href of hrefs) {
          // Extract product_no from URL: /product/{slug}/{id}/category/...
          const match = href.match(/\/product\/[^/]+\/(\d+)\//);
          if (match) {
            const productNo = match[1];
            if (!productsByNo.has(productNo)) {
              // Canonical URL: just the product path without category context
              const _url = new URL(href);
              productsByNo.set(productNo, href);
              newCount++;
            }
          }
        }

        console.log(
          `  ${categoryBase} page ${page}: ${hrefs.length} links, ${newCount} new (total: ${productsByNo.size})`,
        );

        if (newCount === 0) {
          console.log(`  No new products on page ${page}, stopping.`);
          await listPage.close();
          break;
        }

        page++;
      } catch (err) {
        console.warn(`Warning: failed to load ${categoryBase}?page=${page}:`, err);
        await listPage.close();
        break;
      }
      await listPage.close();
    }
  }

  console.log(`\nTotal unique products: ${productsByNo.size}`);

  // Step 2: Scrape each product page
  const rows: string[][] = [];
  const urlList = Array.from(productsByNo.values());

  for (let i = 0; i < urlList.length; i++) {
    const url = urlList[i];
    const productPage = await context.newPage();

    try {
      await productPage.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await productPage.waitForTimeout(1000);

      const data = await productPage.evaluate(() => {
        // variant_name — from product name table row
        const nameRow = document.querySelector("tr.item_list.product_name_css");
        const variant_name = nameRow?.textContent?.trim() ?? "";

        // slug — segment after /product/ in pathname
        const parts = window.location.pathname.split("/").filter(Boolean);
        const productIdx = parts.indexOf("product");
        const slug = productIdx >= 0 ? (parts[productIdx + 1] ?? "") : "";

        // sku — first valid option (not "*" / "**" / "Option" placeholder)
        let sku = "";
        const select = document.querySelector<HTMLSelectElement>("select[name='option1']");
        if (select) {
          for (const opt of Array.from(select.querySelectorAll("option"))) {
            const val = opt.value.trim();
            const text = opt.textContent?.trim() ?? "";
            if (
              !opt.disabled &&
              val !== "*" &&
              val !== "**" &&
              val !== "" &&
              !text.toLowerCase().includes("option") &&
              !text.startsWith("---")
            ) {
              sku = val;
              break;
            }
          }
        }

        // price — from meta tag (most reliable)
        const priceMeta = document.querySelector<HTMLMetaElement>(
          "meta[property='product:price:amount']",
        );
        const price = priceMeta?.content ?? "0";

        // description — from meta description
        const descMeta = document.querySelector<HTMLMetaElement>("meta[name='description']");
        const description = descMeta?.content ?? "";

        // image_urls — main product images (not thumbnails)
        const imgContainer =
          document.querySelector("#productImage") ||
          document.querySelector(".imgArea") ||
          document.querySelector(".product_image");
        const imgs = imgContainer ? Array.from(imgContainer.querySelectorAll("img")) : [];
        const image_urls = imgs
          .map((img) => (img as HTMLImageElement).src)
          .filter((src) => src && !src.includes("data:") && src.startsWith("http"))
          // Deduplicate
          .filter((src, idx, arr) => arr.indexOf(src) === idx)
          .join("|");

        return { variant_name, slug, sku, price, description, image_urls };
      });

      // product_name — strip trailing C\d+ suffix
      const product_name = data.variant_name.replace(/\s+C\d+$/i, "").trim();

      rows.push([
        product_name,
        data.variant_name,
        data.slug,
        data.sku,
        data.price,
        data.description,
        data.image_urls,
        "SHOP",
      ]);

      console.log(
        `[${i + 1}/${urlList.length}] ${data.variant_name} (sku: ${data.sku}, price: $${data.price})`,
      );
    } catch (err) {
      console.warn(`Warning: failed to scrape ${url}:`, err);
    }

    await productPage.close();
  }

  // Step 3: Write CSV
  const header = csvRow([
    "product_name",
    "variant_name",
    "slug",
    "sku",
    "price",
    "description",
    "image_urls",
    "category",
  ]);
  const lines = [header, ...rows.map(csvRow)];
  fs.writeFileSync(OUTPUT_PATH, lines.join("\n"), "utf-8");

  console.log(`\nCSV written to ${OUTPUT_PATH} (${rows.length} rows)`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
