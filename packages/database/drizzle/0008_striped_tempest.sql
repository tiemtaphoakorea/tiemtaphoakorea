CREATE TYPE "public"."purchase_order_status" AS ENUM('draft', 'ordered', 'partial', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."receipt_status" AS ENUM('draft', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."stock_count_status" AS ENUM('draft', 'counting', 'balanced', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."movement_type" ADD VALUE 'stock_count_balance';--> statement-breakpoint
ALTER TYPE "public"."movement_type" ADD VALUE 'cost_adjustment';--> statement-breakpoint
CREATE TABLE "document_sequences" (
	"prefix" varchar(16) PRIMARY KEY NOT NULL,
	"last_seq" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"ordered_qty" integer NOT NULL,
	"received_qty" integer DEFAULT 0 NOT NULL,
	"unit_cost" numeric(15, 2) NOT NULL,
	"discount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"line_total" numeric(15, 2) NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"supplier_id" uuid,
	"branch_id" uuid,
	"status" "purchase_order_status" DEFAULT 'draft' NOT NULL,
	"ordered_at" timestamp,
	"expected_date" timestamp,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"total_qty" integer DEFAULT 0 NOT NULL,
	"total_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"note" text,
	"created_by" uuid,
	"confirmed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_orders_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "goods_receipt_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" uuid NOT NULL,
	"purchase_order_item_id" uuid,
	"variant_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(15, 2) NOT NULL,
	"discount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"line_total" numeric(15, 2) NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goods_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"purchase_order_id" uuid,
	"supplier_id" uuid,
	"branch_id" uuid,
	"status" "receipt_status" DEFAULT 'draft' NOT NULL,
	"received_at" timestamp,
	"invoice_date" timestamp,
	"invoice_ref" varchar(100),
	"total_qty" integer DEFAULT 0 NOT NULL,
	"total_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"extra_cost" numeric(15, 2) DEFAULT '0' NOT NULL,
	"payable_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"paid_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"debt_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"note" text,
	"created_by" uuid,
	"completed_by" uuid,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "goods_receipts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "supplier_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"supplier_id" uuid NOT NULL,
	"receipt_id" uuid,
	"amount" numeric(15, 2) NOT NULL,
	"method" "payment_method" DEFAULT 'cash' NOT NULL,
	"reference_code" varchar(100),
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_payments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_confirmed_by_profiles_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_receipt_id_goods_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."goods_receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_purchase_order_item_id_purchase_order_items_id_fk" FOREIGN KEY ("purchase_order_item_id") REFERENCES "public"."purchase_order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_completed_by_profiles_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_receipt_id_goods_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."goods_receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_purchase_order_items_po" ON "purchase_order_items" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_order_items_variant" ON "purchase_order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_supplier" ON "purchase_orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_status" ON "purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_created" ON "purchase_orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_items_receipt" ON "goods_receipt_items" USING btree ("receipt_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_items_variant" ON "goods_receipt_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_items_po_item" ON "goods_receipt_items" USING btree ("purchase_order_item_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_supplier" ON "goods_receipts" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_po" ON "goods_receipts" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_status" ON "goods_receipts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_payment_status" ON "goods_receipts" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_created" ON "goods_receipts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_supplier_payments_supplier" ON "supplier_payments" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_payments_receipt" ON "supplier_payments" USING btree ("receipt_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_payments_paid_at" ON "supplier_payments" USING btree ("paid_at");