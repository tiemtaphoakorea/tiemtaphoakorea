-- Legacy → current schema: split `order_status` into `payment_status` + `fulfillment_status`.
-- Safe for future runs: no-op if `orders.fulfillment_status` already exists (fresh DB from 0000).
-- Backup DB before applying in production.
-- If your shop never deducted `stock_quantity` at order creation, review inventory after migrate
-- (the pending-order correction assumes the model described in docs/superpowers/plans/2026-04-20-invoice-management-foundation.md).

--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'partial', 'paid');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."fulfillment_status" AS ENUM('pending', 'stock_out', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'status'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'fulfillment_status'
  ) THEN
    ALTER TABLE "orders" ADD COLUMN "payment_status" "payment_status";
    ALTER TABLE "orders" ADD COLUMN "fulfillment_status" "fulfillment_status";
    ALTER TABLE "orders" ADD COLUMN "stock_out_at" timestamp;
    ALTER TABLE "orders" ADD COLUMN "completed_at" timestamp;

    UPDATE "orders" SET
      "payment_status" = CASE
        WHEN COALESCE("paid_amount", '0')::numeric = 0 THEN 'unpaid'::"payment_status"
        WHEN COALESCE("paid_amount", '0')::numeric < COALESCE("total", '0')::numeric THEN 'partial'::"payment_status"
        ELSE 'paid'::"payment_status"
      END,
      "fulfillment_status" = CASE "status"::text
        WHEN 'pending' THEN 'pending'::"fulfillment_status"
        WHEN 'paid' THEN 'pending'::"fulfillment_status"
        WHEN 'preparing' THEN 'pending'::"fulfillment_status"
        WHEN 'shipping' THEN 'stock_out'::"fulfillment_status"
        WHEN 'delivered' THEN (
          CASE
            WHEN COALESCE("paid_amount", '0')::numeric >= COALESCE("total", '0')::numeric
            THEN 'completed'::"fulfillment_status"
            ELSE 'stock_out'::"fulfillment_status"
          END
        )
        WHEN 'cancelled' THEN 'cancelled'::"fulfillment_status"
      END,
      "stock_out_at" = CASE
        WHEN ("status"::text) IN ('shipping', 'delivered') THEN COALESCE("shipped_at", "updated_at")
        ELSE NULL
      END,
      "completed_at" = CASE
        WHEN ("status"::text) = 'delivered'
          AND COALESCE("paid_amount", '0')::numeric >= COALESCE("total", '0')::numeric
        THEN COALESCE("delivered_at", "updated_at")
        ELSE NULL
      END;

    ALTER TABLE "orders" ALTER COLUMN "payment_status" SET NOT NULL;
    ALTER TABLE "orders" ALTER COLUMN "fulfillment_status" SET NOT NULL;

    DROP INDEX IF EXISTS "idx_orders_status";
    ALTER TABLE "orders" DROP COLUMN "status";

    CREATE INDEX IF NOT EXISTS "idx_orders_payment_status" ON "orders" USING btree ("payment_status");
    CREATE INDEX IF NOT EXISTS "idx_orders_fulfillment_status" ON "orders" USING btree ("fulfillment_status");
    CREATE INDEX IF NOT EXISTS "idx_orders_stock_out_at" ON "orders" USING btree ("stock_out_at");
  END IF;
END
$migration$;

--> statement-breakpoint
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_status_history' AND column_name = 'status'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_status_history' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE "order_status_history" ADD COLUMN "payment_status" "payment_status";
    ALTER TABLE "order_status_history" ADD COLUMN "fulfillment_status" "fulfillment_status";

    UPDATE "order_status_history" SET
      "payment_status" = CASE "status"::text
        WHEN 'pending' THEN 'unpaid'::"payment_status"
        WHEN 'paid' THEN 'paid'::"payment_status"
        WHEN 'preparing' THEN 'unpaid'::"payment_status"
        WHEN 'shipping' THEN 'unpaid'::"payment_status"
        WHEN 'delivered' THEN 'paid'::"payment_status"
        WHEN 'cancelled' THEN 'unpaid'::"payment_status"
      END,
      "fulfillment_status" = CASE "status"::text
        WHEN 'pending' THEN 'pending'::"fulfillment_status"
        WHEN 'paid' THEN 'pending'::"fulfillment_status"
        WHEN 'preparing' THEN 'pending'::"fulfillment_status"
        WHEN 'shipping' THEN 'stock_out'::"fulfillment_status"
        WHEN 'delivered' THEN 'completed'::"fulfillment_status"
        WHEN 'cancelled' THEN 'cancelled'::"fulfillment_status"
      END;

    ALTER TABLE "order_status_history" ALTER COLUMN "payment_status" SET NOT NULL;
    ALTER TABLE "order_status_history" ALTER COLUMN "fulfillment_status" SET NOT NULL;
    ALTER TABLE "order_status_history" DROP COLUMN "status";
  END IF;
END
$migration$;

--> statement-breakpoint
DO $migration$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND udt_name = 'order_status'
     ) THEN
    DROP TYPE "public"."order_status";
  END IF;
END
$migration$;

--> statement-breakpoint
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'stock_quantity'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'on_hand'
  ) THEN
    ALTER TABLE "product_variants" RENAME COLUMN "stock_quantity" TO "on_hand";
    ALTER TABLE "product_variants" ALTER COLUMN "on_hand" SET NOT NULL;
    ALTER TABLE "product_variants" ALTER COLUMN "on_hand" SET DEFAULT 0;
    ALTER TABLE "product_variants" ADD COLUMN "reserved" integer NOT NULL DEFAULT 0;

    -- Legacy model: stock was deducted at order creation; restore physical on_hand and set reserved for pending orders.
    WITH pending_qty AS (
      SELECT oi.variant_id, SUM(oi.quantity)::integer AS qty
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE o.fulfillment_status = 'pending'
      GROUP BY oi.variant_id
    )
    UPDATE product_variants pv
    SET
      on_hand = pv.on_hand + pq.qty,
      reserved = pq.qty
    FROM pending_qty pq
    WHERE pv.id = pq.variant_id;
  END IF;
END
$migration$;

--> statement-breakpoint
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'fulfillment_status'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'completed_requires_paid'
    ) THEN
      ALTER TABLE "orders" ADD CONSTRAINT "completed_requires_paid" CHECK (
        "fulfillment_status"::text != 'completed' OR "payment_status"::text = 'paid'
      );
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'stock_out_at_consistency'
    ) THEN
      ALTER TABLE "orders" ADD CONSTRAINT "stock_out_at_consistency" CHECK (
        ("fulfillment_status"::text IN ('stock_out', 'completed')) = ("stock_out_at" IS NOT NULL)
      );
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'completed_at_consistency'
    ) THEN
      ALTER TABLE "orders" ADD CONSTRAINT "completed_at_consistency" CHECK (
        ("fulfillment_status"::text = 'completed') = ("completed_at" IS NOT NULL)
      );
    END IF;
  END IF;
END
$migration$;
