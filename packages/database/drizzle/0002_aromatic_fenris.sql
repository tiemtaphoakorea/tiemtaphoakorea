CREATE TYPE "public"."movement_type" AS ENUM('stock_out', 'supplier_receipt', 'manual_adjustment', 'cancellation');--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"type" "movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"on_hand_before" integer NOT NULL,
	"on_hand_after" integer NOT NULL,
	"reference_id" uuid,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_inv_movements_variant" ON "inventory_movements" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_inv_movements_created_at" ON "inventory_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_inv_movements_type" ON "inventory_movements" USING btree ("type");