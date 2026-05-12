CREATE TABLE "opening_stock_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(15, 2) DEFAULT '0' NOT NULL,
	"effective_date" timestamp NOT NULL,
	"note" text,
	"status" varchar(32) DEFAULT 'applied' NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "opening_stock_entries" ADD CONSTRAINT "opening_stock_entries_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "opening_stock_entries" ADD CONSTRAINT "opening_stock_entries_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "opening_stock_entries" ADD CONSTRAINT "opening_stock_entries_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_opening_stock_entries_variant" ON "opening_stock_entries" USING btree ("variant_id");
--> statement-breakpoint
CREATE INDEX "idx_opening_stock_entries_effective_date" ON "opening_stock_entries" USING btree ("effective_date");
--> statement-breakpoint
CREATE INDEX "idx_opening_stock_entries_status" ON "opening_stock_entries" USING btree ("status");
