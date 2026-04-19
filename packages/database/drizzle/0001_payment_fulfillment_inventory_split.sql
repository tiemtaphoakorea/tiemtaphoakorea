CREATE TYPE "public"."fulfillment_status" AS ENUM('pending', 'stock_out', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'partial', 'paid');--> statement-breakpoint
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(20) DEFAULT 'custom' NOT NULL,
	"category_id" uuid,
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
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "idx_orders_status";--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "show_in_nav" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD COLUMN "payment_status" "payment_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD COLUMN "fulfillment_status" "fulfillment_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fulfillment_status" "fulfillment_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "stock_out_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "on_hand" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "reserved" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_orders_payment_status" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_orders_fulfillment_status" ON "orders" USING btree ("fulfillment_status");--> statement-breakpoint
CREATE INDEX "idx_orders_stock_out_at" ON "orders" USING btree ("stock_out_at");--> statement-breakpoint
CREATE INDEX "idx_products_featured" ON "products" USING btree ("is_featured");--> statement-breakpoint
ALTER TABLE "order_status_history" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "stock_quantity";