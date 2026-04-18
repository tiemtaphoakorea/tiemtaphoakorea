-- Performance: partial index for product thumbnail subquery in banner/category-card services.
-- Only indexes active products, so the CASE-guarded subquery scans far fewer rows.
-- Note: CONCURRENTLY is omitted here to support pglite (used in unit tests).
-- In production (real Postgres), you may run this migration with CONCURRENTLY manually.
CREATE INDEX IF NOT EXISTS idx_products_category_active
  ON products (category_id)
  WHERE is_active = true;
