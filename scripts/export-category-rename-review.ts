/**
 * Export an Excel review file showing:
 *   Sheet 1 — All products with current + proposed category & name
 *   Sheet 2 — Category structure (current → proposed)
 *   Sheet 3 — Duplicate product names (need manual review)
 *
 * Usage:
 *   DATABASE_URL=<...> tsx scripts/export-category-rename-review.ts
 */

import "dotenv/config";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import * as XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

// ---------------------------------------------------------------------------
// Brand detection — returns brand name or empty string
// Priority: current DB category (for Rieti) > keyword match in name
// ---------------------------------------------------------------------------
function detectBrand(name: string, categoryName: string | null): string {
  // Products already in Rieti sub-categories
  const rietiCats = [
    "RT1 — Classic",
    "RT2 — Round",
    "RT3 — Premium TR-90",
    "RT4 — Acetate",
    "RT5 — Light",
    "RT6 — Metal",
    "RT7 — New Arrivals",
    "RT8 — New Arrivals",
    "Latest Collection",
    "Special",
  ];
  if (categoryName && rietiCats.includes(categoryName)) return "Rieti";

  // Eyewear brands (by keyword in name)
  if (/\brieti\b/i.test(name)) return "Rieti";
  if (/\breclow\b/i.test(name)) return "Reclow";
  if (/\bmccoin\b/i.test(name)) return "McCoin";
  if (/\bseion\b/i.test(name)) return "Seion";
  if (/\bcarin\b/i.test(name)) return "Carin";

  // K-beauty skincare / makeup
  if (/\bwhoo\b|bichup|gongjinhyang/i.test(name)) return "The History of Whoo";
  if (/\bohui\b/i.test(name)) return "OHUI";
  if (/su:m37|sum37|sum 37/i.test(name)) return "Su:m37";
  if (/d['']alba|dalba/i.test(name)) return "d'Alba";
  if (/cell fusion c/i.test(name)) return "Cell Fusion C";
  if (/\bmediheal\b/i.test(name)) return "Mediheal";
  if (/\bclio\b/i.test(name)) return "CLIO";
  if (/\binnisfree\b/i.test(name)) return "Innisfree";
  if (/\bcnp\b/i.test(name)) return "CNP Laboratory";
  if (/\bdinto\b/i.test(name)) return "Dinto";
  if (/\banua\b/i.test(name)) return "Anua";
  if (/dr\.?jart\+?/i.test(name)) return "Dr.Jart+";
  if (/the saem/i.test(name)) return "The Saem";
  if (/the face shop/i.test(name)) return "The Face Shop";
  if (/\bmissha\b/i.test(name)) return "Missha";
  if (/\bvt\b.*cosmetic|vt cosmetic/i.test(name)) return "VT Cosmetics";
  if (/\blindsay\b/i.test(name)) return "Lindsay";
  if (/\bwakemake\b/i.test(name)) return "Wakemake";
  if (/\bfreemo\b/i.test(name)) return "Freemo";
  if (/\bstiefel\b/i.test(name)) return "Stiefel";
  if (/\bforest story\b/i.test(name)) return "Forest Story";
  if (/\bpdrn\b|\bvt\b/i.test(name) && /toner|dưỡng/i.test(name)) return "VT Cosmetics";
  if (/modern peach/i.test(name)) return "Modern Peach";

  // Health / supplement
  if (/nutri d-?day/i.test(name)) return "NUTRI D-DAY";
  if (/lactofit/i.test(name)) return "Lactofit";
  if (/\bzelcom\b/i.test(name)) return "Zelcom";
  if (/samsung.*gum|an cung/i.test(name)) return "Samsung Pharmaceuticals";
  if (/hoa anh thảo|evening primrose/i.test(name)) return "Ever";

  // Fashion brands
  if (/\bspao\b/i.test(name)) return "SPAO";
  if (/\bmlb\b/i.test(name)) return "MLB";
  if (/\bhazzys\b/i.test(name)) return "Hazzys";
  if (/\bwhoau\b/i.test(name)) return "Whoau";
  if (/\bpuma\b/i.test(name)) return "Puma";
  if (/\badidas\b/i.test(name)) return "Adidas";
  if (/\bnike\b/i.test(name)) return "Nike";
  if (/onitsuka tiger/i.test(name)) return "Onitsuka Tiger";
  if (/\bcrocs\b/i.test(name)) return "Crocs";
  if (/\bhunter\b/i.test(name)) return "Hunter";
  if (/\broem\b/i.test(name)) return "Roem";
  if (/paige flynn/i.test(name)) return "Paige Flynn";
  if (/\bintashoe\b|\bintheshu\b/i.test(name)) return "Intheshu";
  if (/\betana\b/i.test(name)) return "Etana";
  if (/\bqda\b/i.test(name)) return "QDA";

  // Kids / baby
  if (/hikid/i.test(name)) return "HiKid";
  if (/\bopo\b/i.test(name)) return "OPO";

  // Lifestyle
  if (/starbucks/i.test(name)) return "Starbucks";
  if (/g-dragon|gdragon/i.test(name)) return "G-Dragon";

  return "";
}

// ---------------------------------------------------------------------------
// Category classification heuristics
// Returns a proposed category: flat string (no " > " nesting for eyewear)
// ---------------------------------------------------------------------------
function classifyCategory(name: string, categoryName: string | null): string {
  const n = name;

  // ── Kính mắt — check TRƯỚC (model code + category context) ───────────────
  const rietiCats = [
    "RT1 — Classic",
    "RT2 — Round",
    "RT3 — Premium TR-90",
    "RT4 — Acetate",
    "RT5 — Light",
    "RT6 — Metal",
    "RT7 — New Arrivals",
    "RT8 — New Arrivals",
    "Latest Collection",
    "Special",
    "Kính mắt",
  ];
  if (categoryName && rietiCats.includes(categoryName)) return "Kính mắt";
  if (/rieti/i.test(n)) return "Kính mắt";
  if (/reclow|mccoin|seion|carin/i.test(n)) return "Kính mắt";
  if (/kính mắt|kính râm|kính cận|kính gọng/i.test(n)) return "Kính mắt";
  if (/^kinh\s/i.test(n)) return "Kính mắt";
  // Rieti model codes: 3–6 uppercase ASCII letters only (e.g. ALI, ROMEO, BELLA)
  if (/^[A-Z]{3,6}$/.test(n.trim())) return "Kính mắt";

  // ── Mỹ phẩm: Chống nắng ──────────────────────────────────────────────────
  if (/kem chống nắng|sunscreen|suncream|\bkcn\b/i.test(n)) return "Mỹ phẩm > Chống nắng";

  // ── Mỹ phẩm: Trang điểm ─────────────────────────────────────────────────
  if (
    /phấn nước|cushion|kem nền|foundation|che khuyết điểm|concealer|má hồng|blush|mascara|eyeliner|kẻ mắt|lip rouge|trang điểm/i.test(
      n,
    )
  )
    return "Mỹ phẩm > Trang điểm";
  if (/\bson\b.*(?:lì|kem|matte|màu|lâu)/i.test(n) || /lipstick/i.test(n))
    return "Mỹ phẩm > Trang điểm";
  if (/\bson\b.*(?:dưỡng|balm)/i.test(n) || /lip balm/i.test(n)) return "Mỹ phẩm > Trang điểm";
  if (/\bson\b/i.test(n)) return "Mỹ phẩm > Trang điểm";
  if (/\bchì\b.*(?:môi|mắt|kẻ)/i.test(n) || /\bnail\b/i.test(n)) return "Mỹ phẩm > Trang điểm";

  // ── Mỹ phẩm: Skincare ────────────────────────────────────────────────────
  if (/tinh chất|essence|serum|concentrate|sữa dưỡng|sữa trắng|emulsion/i.test(n))
    return "Mỹ phẩm > Chăm sóc da";
  if (/kem dưỡng|kem mắt|eye cream|kem cổ|neck cream|moistur|night cream|gel dưỡng/i.test(n))
    return "Mỹ phẩm > Chăm sóc da";
  if (/mặt nạ|\bmask\b/i.test(n)) return "Mỹ phẩm > Chăm sóc da";
  if (/sữa rửa mặt|cleanser|cleansing|\bsrm\b|facial foam|foam cleanser/i.test(n))
    return "Mỹ phẩm > Chăm sóc da";
  if (/tẩy trang|makeup remover|micellar/i.test(n)) return "Mỹ phẩm > Chăm sóc da";
  if (/tẩy tế bào|peeling|scrub|exfolia/i.test(n)) return "Mỹ phẩm > Chăm sóc da";
  if (/toner|nước hoa hồng|lotion.*dưỡng|dưỡng ẩm/i.test(n)) return "Mỹ phẩm > Chăm sóc da";
  if (/xịt khoáng|mineral mist|facial mist/i.test(n)) return "Mỹ phẩm > Chăm sóc da";
  if (/\bcream\b|\bserum\b/i.test(n)) return "Mỹ phẩm > Chăm sóc da";
  if (/nước thần|nước tái sinh|nước cân bằng/i.test(n)) return "Mỹ phẩm > Chăm sóc da";

  // ── Mỹ phẩm: Nước hoa ───────────────────────────────────────────────────
  if (/nước hoa|perfume|eau de/i.test(n)) return "Mỹ phẩm > Nước hoa";

  // ── Chăm sóc cơ thể & tóc ──────────────────────────────────────────────
  if (/dầu gội|shampoo|xả tóc|conditioner|dưỡng tóc|xịt tóc|ủ tóc/i.test(n))
    return "Chăm sóc cơ thể > Tóc";
  if (/sữa tắm|body wash|tẩy lông|lăn khử mùi|deodor|gel tắm|body lotion/i.test(n))
    return "Chăm sóc cơ thể > Body";
  if (/kem đánh răng|toothpaste|bàn chải|nước súc miệng|tăm nước|dental/i.test(n))
    return "Chăm sóc cơ thể > Răng miệng";
  if (/\bbody\b/i.test(n)) return "Chăm sóc cơ thể > Body";
  if (/giấy thấm dầu/i.test(n)) return "Chăm sóc cơ thể > Phụ kiện làm đẹp";
  if (/băng dán.*nếp nhăn|wrinkle.*tape/i.test(n)) return "Chăm sóc cơ thể > Phụ kiện làm đẹp";

  // ── Sức khoẻ & TPCN ─────────────────────────────────────────────────────
  if (
    /viên uống|viên nang|tablet|bổ gan|bổ não|bổ khớp|hồng sâm|nhân sâm|hoa anh thảo|omega|collagen|milk thistle|tẩy giun|thuốc|lactofit/i.test(
      n,
    )
  )
    return "Sức khoẻ > Thực phẩm chức năng";
  if (/vitamin\b/i.test(n) && !/kem|serum|essence|lotion|toner|mask|cushion/i.test(n))
    return "Sức khoẻ > Thực phẩm chức năng";
  if (/sữa hikid|sữa opo|sữa bột trẻ|sữa công thức/i.test(n))
    return "Sức khoẻ > Sữa & Dinh dưỡng trẻ em";

  // ── Thời trang: Quần áo ─────────────────────────────────────────────────
  if (/áo khoác|áo phao|puffer|jacket|windbreaker|hoodie|cardigan|cadigan/i.test(n))
    return "Thời trang > Áo khoác";
  if (/áo thun|áo polo|t-shirt|polo.*shirt/i.test(n)) return "Thời trang > Áo thun";
  if (/quần jeans|quần bò|jeans/i.test(n)) return "Thời trang > Quần";
  if (/quần short|quần soc|quần ngắn/i.test(n)) return "Thời trang > Quần";
  if (/quần legging|legging|tất quần/i.test(n)) return "Thời trang > Quần & Legging";
  if (/quần giữ nhiệt|áo giữ nhiệt|đồ giữ nhiệt/i.test(n)) return "Thời trang > Đồ giữ nhiệt";
  if (/set nỉ|bộ nỉ|set.*quần áo|set.*bộ/i.test(n)) return "Thời trang > Set đồ";
  if (/váy|đầm|dress/i.test(n)) return "Thời trang > Váy & Đầm";
  if (/\báo\b/i.test(n)) return "Thời trang > Áo";
  if (/\bquần\b/i.test(n)) return "Thời trang > Quần";

  // ── Thời trang: Giày dép ────────────────────────────────────────────────
  if (/giày|giầy|sneaker|onitsuka|adidas|nike|puma|crocs/i.test(n)) return "Thời trang > Giày";
  if (/dép|sandal|guốc/i.test(n)) return "Thời trang > Dép";
  if (/boot|bốt/i.test(n)) return "Thời trang > Boot";
  if (/hài nữ|hài da/i.test(n)) return "Thời trang > Giày";

  // ── Thời trang: Phụ kiện ────────────────────────────────────────────────
  if (/balo|ba lô/i.test(n)) return "Thời trang > Túi & Balo";
  if (/\btúi\b/i.test(n)) return "Thời trang > Túi & Balo";
  if (/mũ|nón|\bcap\b/i.test(n)) return "Thời trang > Mũ";
  if (/tất vớ|tất cổ|tất ny|tất lưới|tất nhún|tất gấu|\bvớ\b|vớ cổ|\btất\b/i.test(n))
    return "Thời trang > Tất";
  if (/bông tai|dây chuyền|vòng cổ|vòng tay|nhẫn|lắc tay|trang sức/i.test(n))
    return "Thời trang > Trang sức";
  if (/thắt lưng|dây lưng|belt/i.test(n)) return "Thời trang > Phụ kiện thời trang";

  // ── Gia dụng & Phụ kiện ─────────────────────────────────────────────────
  if (/chăn|gối|đệm|chăn điện/i.test(n)) return "Gia dụng > Chăn ga gối";
  if (/tựa lưng|thìa|bát|đĩa|cốc|nồi|bình/i.test(n)) return "Gia dụng > Đồ dùng";
  if (/sạc dự phòng|miếng dán.*điện thoại|phone|sạc/i.test(n)) return "Gia dụng > Phụ kiện điện tử";
  if (/gel khử mốc|khử mùi.*phòng/i.test(n)) return "Gia dụng > Đồ dùng";
  if (/máy cạo lông/i.test(n)) return "Chăm sóc cơ thể > Phụ kiện làm đẹp";

  return "Chưa phân loại";
}

// ---------------------------------------------------------------------------
// Name cleaning heuristics — returns proposed clean name
// ---------------------------------------------------------------------------
function cleanName(raw: string): string {
  let name = raw;

  // Strip channel prefix
  name = name.replace(/^shopee\s*[_\-:]\s*/i, "");
  name = name.replace(/shopee\s*[([]/i, "");

  // Strip opening packaging tags like "( Fullbox )", "( Unbox)", "( Tách set )"
  name = name.replace(
    /^\s*[([]\s*(fullbox|full box|unbox|tách set|lẻ \d+[^)]*|set \d+[^)]*)\s*[)\]]\s*/gi,
    "",
  );
  name = name.replace(/^\s*[([]/g, ""); // leftover opening bracket

  // Move packaging suffix indicators in parens to end note or drop
  name = name.replace(/[([]\s*(fullbox|full box|unbox|hộp giấy|hộp thiếc)\s*[)\]]/gi, "");

  // Replace underscore separators with em-dash
  name = name.replace(/\s*_\s*/g, " — ");

  // Collapse multiple spaces
  name = name.replace(/\s{2,}/g, " ");

  // Trim
  name = name.trim();

  // Remove trailing price like "780k", "- 370k"
  name = name.replace(/\s*[-—]\s*\d{2,4}k\s*$/i, "");

  // Remove leading [Nữ], [Nam] bracket tags → append more naturally if needed
  name = name.replace(/^\[(nữ|nam|unisex)\]\s*/i, "");

  // Remove trailing dash or em-dash
  name = name.replace(/\s*[-—]+\s*$/, "");

  // Collapse again
  name = name.replace(/\s{2,}/g, " ").trim();

  return name;
}

// ---------------------------------------------------------------------------
// Category name mappings (current DB → proposed)
// ---------------------------------------------------------------------------
// Tất cả sub-category kính mắt → gộp về "Kính mắt" (flat, phân biệt qua cột Thương hiệu)
const EYEWEAR_SUBCATS = new Set([
  "RT1 — Classic",
  "RT2 — Round",
  "RT3 — Premium TR-90",
  "RT4 — Acetate",
  "RT5 — Light",
  "RT6 — Metal",
  "RT7 — New Arrivals",
  "RT8 — New Arrivals",
  "Latest Collection",
  "Special",
  "Kính mắt",
]);

const CAT_RENAMES: Record<string, string> = Object.fromEntries(
  [...EYEWEAR_SUBCATS].map((name) => [name, "Kính mắt"]),
);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("Fetching products…");
  const rows = await sql<
    {
      id: string;
      name: string;
      slug: string;
      is_active: boolean;
      is_featured: boolean;
      base_price: string;
      category_id: string | null;
      category_name: string | null;
      category_parent: string | null;
      variant_count: string;
    }[]
  >`
    SELECT
      p.id,
      p.name,
      p.slug,
      p.is_active,
      p.is_featured,
      p.base_price,
      p.category_id,
      c.name  AS category_name,
      pc.name AS category_parent,
      (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id)::text AS variant_count
    FROM products p
    LEFT JOIN categories c  ON c.id  = p.category_id
    LEFT JOIN categories pc ON pc.id = c.parent_id
    ORDER BY COALESCE(c.name, 'zzz'), p.name
  `;

  console.log(`Fetched ${rows.length} products`);

  // ── Sheet 1: Product review ─────────────────────────────────────────────
  const productRows = rows.map((r) => {
    const currentCat = r.category_name
      ? r.category_parent
        ? `${r.category_parent} > ${r.category_name}`
        : r.category_name
      : "(Chưa có)";

    const proposedCat = r.category_name
      ? (CAT_RENAMES[r.category_name] ?? r.category_name)
      : classifyCategory(r.name, r.category_name);

    const brand = detectBrand(r.name, r.category_name);
    const proposedName = cleanName(r.name);
    const nameChanged = proposedName !== r.name;
    const catChanged =
      proposedCat !== currentCat &&
      !(currentCat === "(Chưa có)" && proposedCat === "Chưa phân loại");

    return {
      ID: r.id,
      "Tên hiện tại": r.name,
      "Tên đề xuất": proposedName,
      "Tên thay đổi?": nameChanged ? "Có" : "",
      "Thương hiệu": brand,
      "Danh mục hiện tại": currentCat,
      "Danh mục đề xuất": proposedCat,
      "Danh mục thay đổi?": catChanged ? "Có" : "",
      "Số variants": Number(r.variant_count),
      "Giá cơ bản": Number(r.base_price ?? 0),
      "Đang hoạt động": r.is_active ? "Có" : "Không",
      "Nổi bật": r.is_featured ? "Có" : "",
      Slug: r.slug,
      "Ghi chú admin": "",
    };
  });

  // ── Sheet 2: Category mapping ───────────────────────────────────────────
  console.log("Fetching categories…");
  const cats = await sql<
    {
      name: string;
      slug: string;
      parent_name: string | null;
      product_count: string;
      is_active: boolean;
      show_in_nav: boolean;
      display_order: number;
    }[]
  >`
    SELECT
      c.name,
      c.slug,
      p.name AS parent_name,
      (SELECT COUNT(*) FROM products WHERE category_id = c.id)::text AS product_count,
      c.is_active,
      c.show_in_nav,
      c.display_order
    FROM categories c
    LEFT JOIN categories p ON p.id = c.parent_id
    ORDER BY COALESCE(p.name, c.name), c.display_order
  `;

  const catRows = cats.map((c) => {
    const fullName = c.parent_name ? `${c.parent_name} > ${c.name}` : c.name;
    const proposed = CAT_RENAMES[c.name] ?? c.name;
    const isEyewearSub = EYEWEAR_SUBCATS.has(c.name) && c.name !== "Kính mắt";
    const action = isEyewearSub
      ? "GỘP vào 'Kính mắt'"
      : proposed !== c.name
        ? "RENAME"
        : "Giữ nguyên";

    return {
      "Danh mục hiện tại": fullName,
      Slug: c.slug,
      "Số sản phẩm": Number(c.product_count),
      "Hành động": action,
      "Danh mục đề xuất": proposed,
      "Hiển thị nav": c.show_in_nav ? "Có" : "Không",
      "Thứ tự hiển thị": c.display_order,
    };
  });

  // ── Fetch order data cho tất cả products ──────────────────────────────
  console.log("Fetching order data per product…");
  const orderData = await sql<
    {
      product_id: string;
      total_qty_sold: string;
      order_line_count: string;
      distinct_orders: string;
      first_order: string | null;
      last_order: string | null;
    }[]
  >`
    SELECT
      pv.product_id,
      COALESCE(SUM(oi.quantity), 0)::text       AS total_qty_sold,
      COUNT(oi.id)::text                         AS order_line_count,
      COUNT(DISTINCT o.id)::text                 AS distinct_orders,
      MIN(o.created_at)::date::text              AS first_order,
      MAX(o.created_at)::date::text              AS last_order
    FROM product_variants pv
    LEFT JOIN order_items oi ON oi.variant_id = pv.id
    LEFT JOIN orders o ON o.id = oi.order_id
    GROUP BY pv.product_id
  `;
  const orderMap = new Map(orderData.map((d) => [d.product_id, d]));

  // ── Sheet 3: Trùng exact ────────────────────────────────────────────────
  const nameCount: Record<string, number> = {};
  for (const r of rows) nameCount[r.name] = (nameCount[r.name] ?? 0) + 1;
  const dupRows = rows
    .filter((r) => (nameCount[r.name] ?? 0) > 1)
    .map((r) => {
      const ord = orderMap.get(r.id);
      const hasOrder = ord && Number(ord.distinct_orders) > 0;
      return {
        "Tên trùng": r.name,
        "Số lần trùng": nameCount[r.name],
        "Thương hiệu": detectBrand(r.name, r.category_name),
        "Danh mục hiện tại": r.category_name ?? "(Chưa có)",
        "Slug hiện tại": r.slug,
        "Có đơn?": hasOrder ? "⚠️ Có" : "Không",
        "Số đơn": ord ? Number(ord.distinct_orders) : 0,
        "Số lượng bán": ord ? Number(ord.total_qty_sold) : 0,
        "Đơn đầu tiên": ord?.first_order ?? "",
        "Đơn cuối cùng": ord?.last_order ?? "",
        "Khuyến nghị": hasOrder
          ? "⚠️ Đang có đơn — cẩn thận khi xoá"
          : "Xoá 1 bản — kiểm tra variant trước khi xoá",
      };
    });

  // ── Sheet 5: Nghi trùng (cùng SP, khác màu/size/đóng gói) ─────────────
  // Group theo 45 ký tự đầu của tên (uppercase, bỏ tag đầu)
  const suspectGroups: Record<
    string,
    { id: string; name: string; slug: string; category: string }[]
  > = {};

  for (const r of rows) {
    // Strip tag đầu () hoặc [] rồi lấy 45 ký tự đầu uppercase
    const stripped = r.name
      .replace(/^\s*[([]\s*[^)\]]+\s*[)\]]\s*/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim()
      .toUpperCase()
      .slice(0, 45);
    if (stripped.length < 8) continue;
    if (!suspectGroups[stripped]) suspectGroups[stripped] = [];
    suspectGroups[stripped].push({
      id: r.id,
      name: r.name,
      slug: r.slug,
      category: r.category_name ?? "(Chưa có)",
    });
  }

  // Chỉ giữ nhóm có >1 và ít nhất 1 tên khác nhau (loại exact dup đã có sheet 3)
  const suspectRows: {
    "Nhóm (tên cơ sở)": string;
    "Số bản": number;
    "Tên sản phẩm": string;
    "Thương hiệu": string;
    Slug: string;
    "Có đơn?": string;
    "Số đơn": number;
    "Số lượng bán": number;
    "Đơn đầu tiên": string;
    "Đơn cuối cùng": string;
    "Nguyên nhân nghi trùng": string;
    "Khuyến nghị": string;
  }[] = [];

  for (const [prefix, members] of Object.entries(suspectGroups)) {
    if (members.length < 2) continue;
    const uniqueNames = new Set(members.map((m) => m.name));
    if (uniqueNames.size < 2) continue; // exact dup → đã ở sheet 3

    // Phân loại nguyên nhân
    const allNames = members.map((m) => m.name).join(" ");
    let reason = "Tên gần giống";
    let advice = "Kiểm tra thủ công";
    if (/fullbox|unbox|mini/i.test(allNames)) {
      reason = "Khác đóng gói (Fullbox/Unbox/Mini)";
      advice = "Gộp thành 1 SP — tạo variant theo đóng gói";
    } else if (/\d+\s*ml|\d+ml/i.test(allNames)) {
      reason = "Khác dung tích (ml)";
      advice = "Gộp thành 1 SP — tạo variant theo dung tích";
    } else if (/màu|color|red|pink|orange|rose|wine|xanh|hồng|vàng|đen|trắng/i.test(allNames)) {
      reason = "Khác màu sắc";
      advice = "Gộp thành 1 SP — tạo variant theo màu";
    } else if (/\d{4,}[a-z]/i.test(allNames)) {
      reason = "Có thể khác model code";
      advice = "Xác nhận mã SP — nếu khác model thật thì giữ riêng";
    }

    for (const m of members) {
      const ord = orderMap.get(m.id);
      const hasOrder = ord && Number(ord.distinct_orders) > 0;
      suspectRows.push({
        "Nhóm (tên cơ sở)": `${prefix.slice(0, 40)}…`,
        "Số bản": members.length,
        "Tên sản phẩm": m.name,
        "Thương hiệu": detectBrand(m.name, null),
        Slug: m.slug,
        "Có đơn?": hasOrder ? "⚠️ Có" : "Không",
        "Số đơn": ord ? Number(ord.distinct_orders) : 0,
        "Số lượng bán": ord ? Number(ord.total_qty_sold) : 0,
        "Đơn đầu tiên": ord?.first_order ?? "",
        "Đơn cuối cùng": ord?.last_order ?? "",
        "Nguyên nhân nghi trùng": reason,
        "Khuyến nghị": hasOrder ? `⚠️ Đang có đơn — ${advice.toLowerCase()}` : advice,
      });
    }
  }

  // Sắp theo nhóm (số bản giảm dần) rồi theo tên
  suspectRows.sort(
    (a, b) =>
      b["Số bản"] - a["Số bản"] || a["Nhóm (tên cơ sở)"].localeCompare(b["Nhóm (tên cơ sở)"]),
  );

  // ── Sheet 4: Long names (> 60 chars) ───────────────────────────────────
  const longRows = rows
    .filter((r) => r.name.length > 60)
    .sort((a, b) => b.name.length - a.name.length)
    .map((r) => ({
      "Tên hiện tại": r.name,
      "Độ dài": r.name.length,
      "Tên đề xuất": cleanName(r.name),
      "Độ dài sau": cleanName(r.name).length,
      "Thương hiệu": detectBrand(r.name, r.category_name),
      "Danh mục hiện tại": r.category_name ?? "(Chưa có)",
      "Ghi chú admin": "",
    }));

  // ── Build workbook ──────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(productRows);
  styleSheet(ws1, productRows.length);
  XLSX.utils.book_append_sheet(wb, ws1, "Tất cả sản phẩm");

  const ws2 = XLSX.utils.json_to_sheet(catRows);
  styleSheet(ws2, catRows.length);
  XLSX.utils.book_append_sheet(wb, ws2, "Danh mục");

  const ws3 = XLSX.utils.json_to_sheet(
    dupRows.length > 0 ? dupRows : [{ Note: "Không có tên trùng" }],
  );
  styleSheet(ws3, dupRows.length);
  XLSX.utils.book_append_sheet(wb, ws3, "Trùng exact");

  const ws5 = XLSX.utils.json_to_sheet(
    suspectRows.length > 0 ? suspectRows : [{ Note: "Không có nghi trùng" }],
  );
  styleSheet(ws5, suspectRows.length);
  XLSX.utils.book_append_sheet(wb, ws5, "Nghi trùng (gộp variant)");

  const ws4 = XLSX.utils.json_to_sheet(
    longRows.length > 0 ? longRows : [{ Note: "Không có tên >60 ký tự" }],
  );
  styleSheet(ws4, longRows.length);
  XLSX.utils.book_append_sheet(wb, ws4, "Tên dài (>60 ký tự)");

  const outPath = path.join(__dirname, "../plans/reports/product-category-review.xlsx");
  XLSX.writeFile(wb, outPath);
  console.log(`\n✅ Excel saved → ${outPath}`);

  // Summary
  const changed = productRows.filter((r) => r["Tên thay đổi?"] || r["Danh mục thay đổi?"]);
  const catChanged = productRows.filter((r) => r["Danh mục thay đổi?"]);
  const nameChanged = productRows.filter((r) => r["Tên thay đổi?"]);
  const unclassified = productRows.filter((r) => r["Danh mục đề xuất"] === "Chưa phân loại");

  console.log(`\n📊 Tổng kết:`);
  console.log(`  Tổng sản phẩm:           ${rows.length}`);
  console.log(`  Cần đổi danh mục:         ${catChanged.length}`);
  console.log(`  Cần đổi tên:              ${nameChanged.length}`);
  console.log(`  Có ít nhất 1 thay đổi:    ${changed.length}`);
  console.log(`  Chưa phân loại được:      ${unclassified.length} (cần review tay)`);
  console.log(
    `  Trùng exact:              ${dupRows.length} dòng (${Object.values(nameCount).filter((v) => v > 1).length} nhóm)`,
  );
  console.log(
    `  Nghi trùng (near-dup):    ${suspectRows.length} dòng (${new Set(suspectRows.map((r) => r["Nhóm (tên cơ sở)"])).size} nhóm)`,
  );
  console.log(`  Tên dài (>60 ký tự):      ${longRows.length}`);

  await sql.end();
}

function styleSheet(ws: XLSX.WorkSheet, dataCount: number) {
  // Auto column widths (rough estimate)
  const cols: XLSX.ColInfo[] = [];
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  for (let c = range.s.c; c <= range.e.c; c++) {
    let maxLen = 10;
    for (let r = range.s.r; r <= Math.min(range.e.r, 1000); r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell?.v) maxLen = Math.max(maxLen, String(cell.v).length);
    }
    cols.push({ wch: Math.min(maxLen + 2, 60) });
  }
  ws["!cols"] = cols;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
