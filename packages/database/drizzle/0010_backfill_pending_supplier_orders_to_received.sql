-- Backfill: all purchase_orders migrated from legacy supplier_orders with
-- status='pending' arrived as 'draft'. In reality those goods were already
-- received — the old system simply had no receipt-recording step.
--
-- This migration:
--   1. Creates a completed goods_receipt + goods_receipt_items for every draft PO.
--   2. Sets purchase_order_items.received_qty = ordered_qty.
--   3. Marks the purchase_order as 'received'.
--
-- Inventory side-effects intentionally omitted: current on_hand already
-- reflects these historical receipts. Creating inventory_movements would
-- double-count stock.

DO $$
DECLARE
  po RECORD;
  item RECORD;
  new_receipt_id uuid;
  pon_seq integer;
  v_total_qty integer;
  v_total_amount numeric(15,2);
BEGIN
  FOR po IN
    SELECT id, supplier_id, branch_id, total_qty, total_amount, discount_amount,
           note, created_by, created_at
    FROM purchase_orders
    WHERE status = 'draft'
    ORDER BY created_at ASC, id ASC
  LOOP
    -- Allocate receipt code from sequence.
    UPDATE document_sequences SET last_seq = last_seq + 1
      WHERE prefix = 'PON' RETURNING last_seq INTO pon_seq;

    -- Aggregate from items (handles edge case where header totals differ).
    SELECT COALESCE(SUM(ordered_qty), 0), COALESCE(SUM(line_total), 0)
      INTO v_total_qty, v_total_amount
      FROM purchase_order_items
      WHERE purchase_order_id = po.id;

    INSERT INTO goods_receipts (
      id, code, purchase_order_id, supplier_id, branch_id,
      status, received_at,
      total_qty, total_amount, discount_amount, extra_cost,
      payable_amount, paid_amount, debt_amount, payment_status,
      note, created_by, completed_by,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      'PON' || LPAD(pon_seq::text, 5, '0'),
      po.id,
      po.supplier_id,
      po.branch_id,
      'completed'::receipt_status,
      po.created_at,        -- best estimate; actual received_at not recorded
      v_total_qty,
      v_total_amount,
      po.discount_amount,
      0,
      v_total_amount,
      v_total_amount,       -- assumed paid (legacy data)
      0,
      'paid'::payment_status,
      po.note,
      po.created_by,
      po.created_by,
      po.created_at,
      po.created_at
    ) RETURNING id INTO new_receipt_id;

    -- Create receipt line items and mark PO items as fully received.
    FOR item IN
      SELECT id, variant_id, ordered_qty, unit_cost, discount, line_total, note, created_at
      FROM purchase_order_items
      WHERE purchase_order_id = po.id
    LOOP
      INSERT INTO goods_receipt_items (
        id, receipt_id, purchase_order_item_id, variant_id,
        quantity, unit_cost, discount, line_total,
        note, created_at
      ) VALUES (
        gen_random_uuid(),
        new_receipt_id,
        item.id,
        item.variant_id,
        item.ordered_qty,
        item.unit_cost,
        item.discount,
        item.line_total,
        item.note,
        item.created_at
      );

      UPDATE purchase_order_items
        SET received_qty = ordered_qty
        WHERE id = item.id;
    END LOOP;

    -- Mark PO as received.
    UPDATE purchase_orders
      SET status       = 'received'::purchase_order_status,
          completed_at = created_at,
          updated_at   = now()
      WHERE id = po.id;
  END LOOP;
END $$;
