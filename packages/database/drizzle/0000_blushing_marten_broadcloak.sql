CREATE TYPE "public"."customer_type" AS ENUM('wholesale', 'retail');--> statement-breakpoint
CREATE TYPE "public"."delivery_preference" AS ENUM('ship_together', 'ship_available_first');--> statement-breakpoint
CREATE TYPE "public"."expense_type" AS ENUM('fixed', 'variable');--> statement-breakpoint
CREATE TYPE "public"."fulfillment_status" AS ENUM('pending', 'stock_out', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'image', 'system');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'bank_transfer', 'card');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'partial', 'paid');--> statement-breakpoint
CREATE TYPE "public"."supplier_order_status" AS ENUM('pending', 'ordered', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin', 'manager', 'staff', 'customer');--> statement-breakpoint
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
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"parent_id" uuid,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"show_in_nav" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text,
	"message_type" "message_type" DEFAULT 'text',
	"image_url" text,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"last_message_at" timestamp,
	"unread_count_admin" integer DEFAULT 0,
	"unread_count_customer" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "chat_rooms_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" varchar(255) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"type" "expense_type" NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(255) NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" uuid,
	"request_payload" text NOT NULL,
	"response_payload" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "idempotency_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "admin_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"order_id" uuid,
	"supplier_order_id" uuid,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"variant_name" varchar(255) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"cost_price_at_order_time" numeric(15, 2) DEFAULT '0',
	"line_total" numeric(15, 2) NOT NULL,
	"line_cost" numeric(15, 2) DEFAULT '0',
	"line_profit" numeric(15, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"payment_status" "payment_status" NOT NULL,
	"fulfillment_status" "fulfillment_status" NOT NULL,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"fulfillment_status" "fulfillment_status" DEFAULT 'pending' NOT NULL,
	"stock_out_at" timestamp,
	"completed_at" timestamp,
	"parent_order_id" uuid,
	"split_type" varchar(20),
	"delivery_preference" "delivery_preference" DEFAULT 'ship_together',
	"subtotal" numeric(15, 2) DEFAULT '0',
	"discount" numeric(15, 2) DEFAULT '0',
	"total" numeric(15, 2) DEFAULT '0',
	"total_cost" numeric(15, 2) DEFAULT '0',
	"profit" numeric(15, 2) DEFAULT '0',
	"shipping_name" varchar(255),
	"shipping_phone" varchar(20),
	"shipping_address" text,
	"customer_note" text,
	"admin_note" text,
	"paid_amount" numeric(15, 2) DEFAULT '0',
	"paid_at" timestamp,
	"shipped_at" timestamp,
	"delivered_at" timestamp,
	"cancelled_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"method" "payment_method" DEFAULT 'cash' NOT NULL,
	"reference_code" varchar(100),
	"note" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "supplier_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid,
	"variant_id" uuid,
	"status" "supplier_order_status" DEFAULT 'pending',
	"quantity" integer NOT NULL,
	"actual_cost_price" numeric(15, 2),
	"note" text,
	"ordered_at" timestamp,
	"expected_date" timestamp,
	"received_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cost_price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"cost_price" numeric(15, 2) NOT NULL,
	"effective_date" timestamp DEFAULT now(),
	"note" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" numeric(15, 2) DEFAULT '0' NOT NULL,
	"cost_price" numeric(15, 2) DEFAULT '0',
	"on_hand" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 5,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"category_id" uuid,
	"base_price" numeric(15, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "variant_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"display_order" integer DEFAULT 0,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"address" text,
	"customer_type" "customer_type",
	"customer_code" varchar(20),
	"avatar_url" text,
	"password_hash" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "profiles_username_unique" UNIQUE("username"),
	CONSTRAINT "profiles_customer_code_unique" UNIQUE("customer_code")
);
--> statement-breakpoint
CREATE TABLE "daily_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_date" date NOT NULL,
	"total_orders" integer DEFAULT 0,
	"completed_orders" integer DEFAULT 0,
	"cancelled_orders" integer DEFAULT 0,
	"total_revenue" numeric(15, 2) DEFAULT '0',
	"total_cost" numeric(15, 2) DEFAULT '0',
	"total_profit" numeric(15, 2) DEFAULT '0',
	"top_products" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "daily_reports_report_date_unique" UNIQUE("report_date")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"email" varchar(255),
	"address" text,
	"payment_terms" text,
	"note" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "suppliers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_customer_id_profiles_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_supplier_order_id_supplier_orders_id_fk" FOREIGN KEY ("supplier_order_id") REFERENCES "public"."supplier_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_profiles_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_price_history" ADD CONSTRAINT "cost_price_history_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_price_history" ADD CONSTRAINT "cost_price_history_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_images" ADD CONSTRAINT "variant_images_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_categories_parent" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_categories_slug" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_room" ON "chat_messages" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_created" ON "chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_chat_rooms_customer" ON "chat_rooms" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_chat_rooms_last_message" ON "chat_rooms" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "idx_expenses_type" ON "expenses" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_expenses_date" ON "expenses" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idempotency_key_idx" ON "idempotency_keys" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idempotency_expires_at_idx" ON "idempotency_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_order_items_order" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_variant" ON "order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_status_history_order" ON "order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_customer" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_orders_number" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "idx_orders_created" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_parent" ON "orders" USING btree ("parent_order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_payment_status" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_orders_fulfillment_status" ON "orders" USING btree ("fulfillment_status");--> statement-breakpoint
CREATE INDEX "idx_orders_stock_out_at" ON "orders" USING btree ("stock_out_at");--> statement-breakpoint
CREATE INDEX "idx_payments_order" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_payments_method" ON "payments" USING btree ("method");--> statement-breakpoint
CREATE INDEX "idx_supplier_orders_supplier" ON "supplier_orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_orders_variant" ON "supplier_orders" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_orders_status" ON "supplier_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cost_history_variant" ON "cost_price_history" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_cost_history_date" ON "cost_price_history" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "idx_variants_product" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_variants_sku" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_products_slug" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_products_featured" ON "products" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "idx_variant_images_variant" ON "variant_images" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_profiles_customer_code" ON "profiles" USING btree ("customer_code");--> statement-breakpoint
CREATE INDEX "idx_profiles_role" ON "profiles" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_profiles_role_phone_unique" ON "profiles" USING btree ("role","phone") WHERE "profiles"."phone" is not null;--> statement-breakpoint
CREATE INDEX "idx_daily_reports_date" ON "daily_reports" USING btree ("report_date");--> statement-breakpoint
CREATE INDEX "idx_suppliers_code" ON "suppliers" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_suppliers_name" ON "suppliers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_suppliers_is_active" ON "suppliers" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "on_hand_non_negative" CHECK ("on_hand" >= 0);--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "reserved_non_negative" CHECK ("reserved" >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "completed_requires_paid" CHECK ("fulfillment_status" != 'completed' OR "payment_status" = 'paid');--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "stock_out_at_consistency" CHECK (("fulfillment_status" IN ('stock_out', 'completed')) = ("stock_out_at" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "completed_at_consistency" CHECK (("fulfillment_status" = 'completed') = ("completed_at" IS NOT NULL));