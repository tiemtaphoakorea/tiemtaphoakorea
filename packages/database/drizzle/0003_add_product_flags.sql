-- Migration: Add isFeatured flag to products for "Bán chạy" admin-pinning

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_featured" boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "idx_products_featured" ON "products" ("is_featured");
