-- Functions used by triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

CREATE OR REPLACE FUNCTION calculate_order_profit()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders
    SET 
        subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM order_items WHERE order_id = NEW.order_id),
        total_cost = (SELECT COALESCE(SUM(line_cost), 0) FROM order_items WHERE order_id = NEW.order_id),
        profit = (SELECT COALESCE(SUM(line_profit), 0) FROM order_items WHERE order_id = NEW.order_id),
        total = (SELECT COALESCE(SUM(line_total), 0) FROM order_items WHERE order_id = NEW.order_id) - COALESCE(discount, 0)
    WHERE id = NEW.order_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

CREATE OR REPLACE FUNCTION log_cost_price_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.cost_price IS DISTINCT FROM NEW.cost_price THEN
        INSERT INTO cost_price_history (variant_id, cost_price, note)
        VALUES (NEW.id, NEW.cost_price, 'Auto-logged from variant update');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint


DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();--> statement-breakpoint

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();--> statement-breakpoint

DROP TRIGGER IF EXISTS update_variants_updated_at ON product_variants;
CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();--> statement-breakpoint

DROP TRIGGER IF EXISTS log_cost_price_trigger ON product_variants;
CREATE TRIGGER log_cost_price_trigger AFTER UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION log_cost_price_change();--> statement-breakpoint

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();--> statement-breakpoint

DROP TRIGGER IF EXISTS calculate_order_profit_trigger ON order_items;
CREATE TRIGGER calculate_order_profit_trigger AFTER INSERT OR UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION calculate_order_profit();--> statement-breakpoint
