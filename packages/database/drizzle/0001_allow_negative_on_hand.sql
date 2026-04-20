-- Allow on_hand to go negative (stock-out before physical restock).
ALTER TABLE "product_variants" DROP CONSTRAINT IF EXISTS "on_hand_non_negative";
