-- Phase 1: create new enums
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'partial', 'paid');--> statement-breakpoint
CREATE TYPE "public"."fulfillment_status" AS ENUM('pending', 'stock_out', 'completed', 'cancelled');--> statement-breakpoint

-- Phase 2: add new columns (nullable/defaulted initially so existing rows don't break)
ALTER TABLE "orders" ADD COLUMN "payment_status" "payment_status";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fulfillment_status" "fulfillment_status";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "stock_out_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint

ALTER TABLE "product_variants" RENAME COLUMN "stock_quantity" TO "on_hand";--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "on_hand" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "on_hand" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "reserved" integer NOT NULL DEFAULT 0;--> statement-breakpoint

-- Phase 3: backfill orders
UPDATE "orders" SET
  "payment_status" = CASE
    WHEN COALESCE("paid_amount", '0')::numeric = 0 THEN 'unpaid'::payment_status
    WHEN COALESCE("paid_amount", '0')::numeric < "total"::numeric THEN 'partial'::payment_status
    ELSE 'paid'::payment_status
  END,
  "fulfillment_status" = CASE "status"
    WHEN 'pending'    THEN 'pending'::fulfillment_status
    WHEN 'paid'       THEN 'pending'::fulfillment_status
    WHEN 'preparing'  THEN 'pending'::fulfillment_status
    WHEN 'shipping'   THEN 'stock_out'::fulfillment_status
    WHEN 'delivered'  THEN (CASE WHEN COALESCE("paid_amount", '0')::numeric >= "total"::numeric THEN 'completed'::fulfillment_status ELSE 'stock_out'::fulfillment_status END)
    WHEN 'cancelled'  THEN 'cancelled'::fulfillment_status
  END,
  "stock_out_at" = CASE WHEN "status" IN ('shipping', 'delivered') THEN COALESCE("shipped_at", "updated_at") END,
  "completed_at" = CASE WHEN "status" = 'delivered' AND COALESCE("paid_amount", '0')::numeric >= "total"::numeric THEN COALESCE("delivered_at", "updated_at") END;
--> statement-breakpoint

-- Phase 4: stock correction — old logic deducted on_hand at order creation.
-- Undo that for orders now in fulfillment_status='pending': add qty back to on_hand, set reserved.
WITH pending_qty AS (
  SELECT oi.variant_id, SUM(oi.quantity)::int AS qty
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.fulfillment_status = 'pending'
  GROUP BY oi.variant_id
)
UPDATE product_variants pv
SET on_hand = pv.on_hand + pq.qty, reserved = pq.qty
FROM pending_qty pq
WHERE pv.id = pq.variant_id;
--> statement-breakpoint

-- Phase 5: backfill order_status_history.
ALTER TABLE "order_status_history" ADD COLUMN "payment_status" "payment_status";--> statement-breakpoint
ALTER TABLE "order_status_history" ADD COLUMN "fulfillment_status" "fulfillment_status";--> statement-breakpoint

-- Best-effort mapping of old single status → (payment_status, fulfillment_status) snapshot
UPDATE "order_status_history" SET
  "payment_status" = CASE "status"
    WHEN 'pending'   THEN 'unpaid'::payment_status
    WHEN 'paid'      THEN 'paid'::payment_status
    WHEN 'preparing' THEN 'unpaid'::payment_status
    WHEN 'shipping'  THEN 'unpaid'::payment_status
    WHEN 'delivered' THEN 'paid'::payment_status
    WHEN 'cancelled' THEN 'unpaid'::payment_status
  END,
  "fulfillment_status" = CASE "status"
    WHEN 'pending'   THEN 'pending'::fulfillment_status
    WHEN 'paid'      THEN 'pending'::fulfillment_status
    WHEN 'preparing' THEN 'pending'::fulfillment_status
    WHEN 'shipping'  THEN 'stock_out'::fulfillment_status
    WHEN 'delivered' THEN 'completed'::fulfillment_status
    WHEN 'cancelled' THEN 'cancelled'::fulfillment_status
  END;
--> statement-breakpoint
