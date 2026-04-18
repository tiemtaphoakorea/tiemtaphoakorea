-- Migration: Add homepage content tables (banners + category_cards)

CREATE TABLE IF NOT EXISTS "banners" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "type" varchar(20) NOT NULL DEFAULT 'custom',
  "category_id" uuid REFERENCES "categories"("id") ON DELETE SET NULL,
  "image_url" text,
  "title" varchar(200),
  "subtitle" text,
  "badge_text" varchar(100),
  "cta_label" varchar(100),
  "cta_url" text,
  "cta_secondary_label" varchar(100),
  "discount_tag" varchar(50),
  "discount_tag_sub" varchar(100),
  "accent_color" varchar(50),
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "starts_at" timestamp,
  "ends_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "category_cards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "type" varchar(20) NOT NULL DEFAULT 'category',
  "category_id" uuid REFERENCES "categories"("id") ON DELETE SET NULL,
  "image_url" text,
  "title" varchar(200),
  "count_text" varchar(100),
  "link_url" text,
  "accent_color" varchar(50),
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_banners_active" ON "banners" ("is_active", "sort_order");
CREATE INDEX IF NOT EXISTS "idx_banners_category" ON "banners" ("category_id");
CREATE INDEX IF NOT EXISTS "idx_category_cards_active" ON "category_cards" ("is_active", "sort_order");
CREATE INDEX IF NOT EXISTS "idx_category_cards_category" ON "category_cards" ("category_id");
