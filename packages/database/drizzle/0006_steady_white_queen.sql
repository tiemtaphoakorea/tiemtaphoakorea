CREATE TYPE "public"."homepage_collection_type" AS ENUM('manual', 'best_sellers', 'new_arrivals', 'by_category');--> statement-breakpoint
CREATE TABLE "homepage_collection_products" (
	"collection_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "homepage_collection_products_collection_id_product_id_pk" PRIMARY KEY("collection_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "homepage_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "homepage_collection_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"subtitle" text,
	"icon_key" varchar(50),
	"view_all_url" text,
	"item_limit" integer DEFAULT 8 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"category_id" uuid,
	"days_window" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "homepage_collection_products" ADD CONSTRAINT "homepage_collection_products_collection_id_homepage_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."homepage_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homepage_collection_products" ADD CONSTRAINT "homepage_collection_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homepage_collections" ADD CONSTRAINT "homepage_collections_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_homepage_collection_products_sort" ON "homepage_collection_products" USING btree ("collection_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_homepage_collections_active_sort" ON "homepage_collections" USING btree ("is_active","sort_order");