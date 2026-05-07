-- Seed document_sequences for monotonic code generation.
-- Idempotent: ON CONFLICT DO NOTHING preserves existing counters on re-runs.
INSERT INTO "document_sequences" ("prefix", "last_seq") VALUES
  ('OSN', 0),
  ('PON', 0),
  ('PCH', 0),
  ('IAN', 0),
  ('CDC', 0)
ON CONFLICT ("prefix") DO NOTHING;

-- Backfill: convert legacy supplier_orders rows into the Sapo-faithful model.
-- Each legacy row (1 supplier + 1 variant + qty + status) becomes:
--   1 purchase_orders header + 1 purchase_order_items line
--   + (if status='received') 1 goods_receipts header + 1 goods_receipt_items line
--
-- Inventory side-effects already applied historically (variant.onHand reflects
-- past supplier_orders). Inventory_movements with movement_type='supplier_receipt'
-- still reference legacy supplier_orders.id; we leave those untouched (legacy
-- table is kept for one transition release).

DO $$
DECLARE
  legacy_row RECORD;
  new_po_id uuid;
  new_po_item_id uuid;
  new_receipt_id uuid;
  po_seq integer;
  pon_seq integer;
  resolved_supplier_id uuid;
  unit_cost numeric(15, 2);
  line_total numeric(15, 2);
BEGIN
  -- Backfill in chronological order so generated codes are monotonic with creation.
  FOR legacy_row IN
    SELECT
      so.id,
      so.supplier_id,
      so.variant_id,
      so.status,
      so.quantity,
      so.actual_cost_price,
      so.note,
      so.ordered_at,
      so.expected_date,
      so.received_at,
      so.created_by,
      so.created_at,
      so.updated_at,
      pv.cost_price AS variant_cost_price
    FROM "supplier_orders" so
    LEFT JOIN "product_variants" pv ON pv.id = so.variant_id
    ORDER BY so.created_at ASC, so.id ASC
  LOOP
    -- Skip rows missing required references; cannot synthesize a PO without them.
    IF legacy_row.variant_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Resolve supplier: legacy rows may have null supplier_id; use a placeholder lookup.
    resolved_supplier_id := legacy_row.supplier_id;

    -- Determine cost: prefer explicit actual_cost_price, fall back to variant master cost, else 0.
    unit_cost := COALESCE(legacy_row.actual_cost_price, legacy_row.variant_cost_price, 0);
    line_total := unit_cost * legacy_row.quantity;

    -- Allocate PO code.
    UPDATE "document_sequences" SET "last_seq" = "last_seq" + 1
      WHERE "prefix" = 'OSN' RETURNING "last_seq" INTO po_seq;

    INSERT INTO "purchase_orders" (
      "id", "code", "supplier_id", "branch_id",
      "status", "ordered_at", "expected_date", "completed_at", "cancelled_at",
      "total_qty", "total_amount", "discount_amount",
      "note", "created_by", "confirmed_by", "created_at", "updated_at"
    ) VALUES (
      gen_random_uuid(),
      'OSN' || LPAD(po_seq::text, 5, '0'),
      resolved_supplier_id,
      NULL,
      CASE legacy_row.status
        WHEN 'pending' THEN 'draft'::purchase_order_status
        WHEN 'ordered' THEN 'ordered'::purchase_order_status
        WHEN 'received' THEN 'received'::purchase_order_status
        WHEN 'cancelled' THEN 'cancelled'::purchase_order_status
        ELSE 'draft'::purchase_order_status
      END,
      legacy_row.ordered_at,
      legacy_row.expected_date,
      CASE WHEN legacy_row.status = 'received' THEN legacy_row.received_at ELSE NULL END,
      CASE WHEN legacy_row.status = 'cancelled' THEN legacy_row.updated_at ELSE NULL END,
      legacy_row.quantity,
      line_total,
      0,
      legacy_row.note,
      legacy_row.created_by,
      CASE WHEN legacy_row.status IN ('ordered', 'received') THEN legacy_row.created_by ELSE NULL END,
      legacy_row.created_at,
      legacy_row.updated_at
    ) RETURNING "id" INTO new_po_id;

    INSERT INTO "purchase_order_items" (
      "id", "purchase_order_id", "variant_id",
      "ordered_qty", "received_qty", "unit_cost", "discount", "line_total",
      "note", "created_at"
    ) VALUES (
      gen_random_uuid(),
      new_po_id,
      legacy_row.variant_id,
      legacy_row.quantity,
      CASE WHEN legacy_row.status = 'received' THEN legacy_row.quantity ELSE 0 END,
      unit_cost,
      0,
      line_total,
      legacy_row.note,
      legacy_row.created_at
    ) RETURNING "id" INTO new_po_item_id;

    -- Create matching receipt only for received legacy rows.
    IF legacy_row.status = 'received' THEN
      UPDATE "document_sequences" SET "last_seq" = "last_seq" + 1
        WHERE "prefix" = 'PON' RETURNING "last_seq" INTO pon_seq;

      INSERT INTO "goods_receipts" (
        "id", "code", "purchase_order_id", "supplier_id", "branch_id",
        "status", "received_at", "invoice_date", "invoice_ref",
        "total_qty", "total_amount", "discount_amount", "extra_cost",
        "payable_amount", "paid_amount", "debt_amount", "payment_status",
        "note", "created_by", "completed_by", "cancelled_at",
        "created_at", "updated_at"
      ) VALUES (
        gen_random_uuid(),
        'PON' || LPAD(pon_seq::text, 5, '0'),
        new_po_id,
        resolved_supplier_id,
        NULL,
        'completed'::receipt_status,
        legacy_row.received_at,
        NULL,
        NULL,
        -- Historical 'received' rows are assumed already paid for. Mark them
        -- paid so the supplier-debt report is correct on first view; an
        -- accountant can manually adjust after audit if any prove unpaid.
        legacy_row.quantity,
        line_total,
        0,
        0,
        line_total,
        line_total,
        0,
        'paid'::payment_status,
        legacy_row.note,
        legacy_row.created_by,
        legacy_row.created_by,
        NULL,
        COALESCE(legacy_row.received_at, legacy_row.updated_at, legacy_row.created_at),
        COALESCE(legacy_row.received_at, legacy_row.updated_at, legacy_row.created_at)
      ) RETURNING "id" INTO new_receipt_id;

      INSERT INTO "goods_receipt_items" (
        "id", "receipt_id", "purchase_order_item_id", "variant_id",
        "quantity", "unit_cost", "discount", "line_total",
        "note", "created_at"
      ) VALUES (
        gen_random_uuid(),
        new_receipt_id,
        new_po_item_id,
        legacy_row.variant_id,
        legacy_row.quantity,
        unit_cost,
        0,
        line_total,
        legacy_row.note,
        COALESCE(legacy_row.received_at, legacy_row.created_at)
      );
    END IF;
  END LOOP;
END $$;
