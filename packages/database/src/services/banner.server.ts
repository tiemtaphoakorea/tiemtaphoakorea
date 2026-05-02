import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { banners } from "../schema/banners";
import { categories } from "../schema/categories";
import { products, productVariants, variantImages } from "../schema/products";

export type { Banner, NewBanner } from "../schema/banners";

export type BannerSlide = {
  id: string;
  type: string;
  categoryId: string | null;
  categorySlug: string | null;
  imageUrl: string;
  title: string;
  subtitle: string | null;
  badgeText: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  ctaSecondaryLabel: string | null;
  discountTag: string | null;
  discountTagSub: string | null;
  accentColor: string | null;
  isActive: boolean;
  sortOrder: number;
  startsAt: Date | null;
  endsAt: Date | null;
};

export type CreateBannerData = {
  type: "category" | "custom";
  categoryId?: string | null;
  imageUrl?: string | null;
  title?: string | null;
  subtitle?: string | null;
  badgeText?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  ctaSecondaryLabel?: string | null;
  discountTag?: string | null;
  discountTagSub?: string | null;
  accentColor?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

export type UpdateBannerData = Partial<CreateBannerData>;

/**
 * Get active banner slides for the storefront.
 * Uses a LATERAL join for the thumbnail — only executes for category-type banners
 * where imageUrl is not already set, avoiding unnecessary work on custom banners.
 */
export async function getBanners(): Promise<BannerSlide[]> {
  const now = new Date().toISOString();

  type BannerRow = {
    id: string;
    type: string;
    category_id: string | null;
    category_name: string | null;
    category_slug: string | null;
    image_url: string | null;
    category_image_url: string | null;
    title: string | null;
    subtitle: string | null;
    badge_text: string | null;
    cta_label: string | null;
    cta_url: string | null;
    cta_secondary_label: string | null;
    discount_tag: string | null;
    discount_tag_sub: string | null;
    accent_color: string | null;
    is_active: boolean;
    sort_order: number;
    starts_at: Date | null;
    ends_at: Date | null;
  };

  // LATERAL subquery: only fires for rows where type='category' AND imageUrl IS NULL
  // This avoids scanning product_variants for every row unconditionally.
  const rows = (await db.execute(sql`
    SELECT
      b.id, b.type, b.category_id,
      c.name  AS category_name,
      c.slug  AS category_slug,
      b.image_url,
      -- Only fetch thumbnail when type='category' and no manual imageUrl is set
      CASE
        WHEN b.type = 'category' AND b.image_url IS NULL AND c.id IS NOT NULL
        THEN (
          SELECT vi.image_url
          FROM ${products} p
          JOIN ${productVariants} pv ON pv.product_id = p.id
          JOIN ${variantImages} vi ON vi.variant_id = pv.id
          WHERE (p.category_id = c.id OR p.category_id IN (
            SELECT id FROM ${categories} WHERE parent_id = c.id
          ))
            AND p.is_active = true
          ORDER BY vi.is_primary DESC, vi.display_order ASC
          LIMIT 1
        )
        ELSE NULL
      END AS category_image_url,
      b.title, b.subtitle, b.badge_text,
      b.cta_label, b.cta_url, b.cta_secondary_label,
      b.discount_tag, b.discount_tag_sub, b.accent_color,
      b.is_active, b.sort_order, b.starts_at, b.ends_at
    FROM ${banners} b
    LEFT JOIN ${categories} c ON b.category_id = c.id
    WHERE b.is_active = true
      AND (b.starts_at IS NULL OR b.starts_at <= ${now})
      AND (b.ends_at   IS NULL OR b.ends_at   >= ${now})
    ORDER BY b.sort_order ASC
  `)) as BannerRow[];

  // Strip legacy Unsplash URLs so the storefront never tries to fetch them (they 404).
  const stripUnsplash = (url: string | null | undefined): string =>
    !url || url.includes("images.unsplash.com") ? "" : url;

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    categoryId: row.category_id,
    categorySlug: row.category_slug,
    isActive: row.is_active,
    sortOrder: Number(row.sort_order),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    imageUrl:
      stripUnsplash(row.image_url) ||
      (row.type === "category" ? stripUnsplash(row.category_image_url) : "") ||
      "",
    title: row.title || (row.type === "category" ? (row.category_name ?? "") : "") || "",
    subtitle: row.subtitle,
    badgeText: row.badge_text || (row.type === "category" ? "Danh mục hot" : null),
    ctaLabel: row.cta_label || (row.type === "category" ? "Xem tất cả" : null),
    ctaUrl:
      row.cta_url ||
      (row.type === "category" && row.category_slug
        ? `/products?category=${encodeURIComponent(row.category_slug)}`
        : null),
    ctaSecondaryLabel: row.cta_secondary_label,
    discountTag: row.discount_tag,
    discountTagSub: row.discount_tag_sub,
    accentColor: row.accent_color,
  }));
}

/**
 * Get all banners for admin (no active/date filtering).
 */
export async function getAllBannersForAdmin() {
  type AdminBannerRow = {
    id: string;
    type: string;
    category_id: string | null;
    category_name: string | null;
    category_slug: string | null;
    image_url: string | null;
    category_image_url: string | null;
    title: string | null;
    subtitle: string | null;
    badge_text: string | null;
    cta_label: string | null;
    cta_url: string | null;
    cta_secondary_label: string | null;
    discount_tag: string | null;
    discount_tag_sub: string | null;
    accent_color: string | null;
    is_active: boolean;
    sort_order: number;
    starts_at: Date | null;
    ends_at: Date | null;
    created_at: Date | null;
    updated_at: Date | null;
  };

  const rows = (await db.execute(sql`
    SELECT
      b.id, b.type, b.category_id,
      c.name  AS category_name,
      c.slug  AS category_slug,
      b.image_url,
      CASE
        WHEN b.type = 'category' AND b.image_url IS NULL AND c.id IS NOT NULL
        THEN (
          SELECT vi.image_url
          FROM ${products} p
          JOIN ${productVariants} pv ON pv.product_id = p.id
          JOIN ${variantImages} vi ON vi.variant_id = pv.id
          WHERE (p.category_id = c.id OR p.category_id IN (
            SELECT id FROM ${categories} WHERE parent_id = c.id
          ))
            AND p.is_active = true
          ORDER BY vi.is_primary DESC, vi.display_order ASC
          LIMIT 1
        )
        ELSE NULL
      END AS category_image_url,
      b.title, b.subtitle, b.badge_text,
      b.cta_label, b.cta_url, b.cta_secondary_label,
      b.discount_tag, b.discount_tag_sub, b.accent_color,
      b.is_active, b.sort_order, b.starts_at, b.ends_at,
      b.created_at, b.updated_at
    FROM ${banners} b
    LEFT JOIN ${categories} c ON b.category_id = c.id
    ORDER BY b.sort_order ASC
  `)) as AdminBannerRow[];

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    imageUrl: row.image_url,
    categoryImageUrl: row.category_image_url,
    title: row.title,
    subtitle: row.subtitle,
    badgeText: row.badge_text,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    ctaSecondaryLabel: row.cta_secondary_label,
    discountTag: row.discount_tag,
    discountTagSub: row.discount_tag_sub,
    accentColor: row.accent_color,
    isActive: row.is_active,
    sortOrder: Number(row.sort_order),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createBanner(data: CreateBannerData) {
  const [banner] = await db
    .insert(banners)
    .values({
      type: data.type,
      categoryId: data.categoryId ?? null,
      imageUrl: data.imageUrl ?? null,
      title: data.title ?? null,
      subtitle: data.subtitle ?? null,
      badgeText: data.badgeText ?? null,
      ctaLabel: data.ctaLabel ?? null,
      ctaUrl: data.ctaUrl ?? null,
      ctaSecondaryLabel: data.ctaSecondaryLabel ?? null,
      discountTag: data.discountTag ?? null,
      discountTagSub: data.discountTagSub ?? null,
      accentColor: data.accentColor ?? null,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
    })
    .returning();
  return banner;
}

export async function updateBanner(id: string, data: UpdateBannerData) {
  const [banner] = await db
    .update(banners)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(banners.id, id))
    .returning();
  return banner;
}

export async function deleteBanner(id: string) {
  await db.delete(banners).where(eq(banners.id, id));
}

export async function reorderBanners(orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, index) =>
      db.update(banners).set({ sortOrder: index, updatedAt: new Date() }).where(eq(banners.id, id)),
    ),
  );
}
