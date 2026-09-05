-- Deploy manually in Supabase SQL Editor.
-- Enables atomic poke slot capacity check + order insert.
--
-- Schema note: orders.id is bigint (serial), order_items.id is uuid.

CREATE OR REPLACE FUNCTION public.submit_poke_order(
  p_friendly_id text,
  p_customer_name text,
  p_customer_phone text,
  p_order_type text,
  p_status text DEFAULT 'RICEVUTO',
  p_total_price numeric DEFAULT 0,
  p_notes text DEFAULT '',
  p_delivery_address text DEFAULT NULL,
  p_poke_count integer DEFAULT 0,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id bigint;
  v_slot_time text;
  v_slot_day text;
  v_date_key date;
  v_booked integer;
  v_remaining integer;
  v_slot_end text;
  v_item jsonb;
  v_lock_key bigint;
BEGIN
  IF p_poke_count <= 0 THEN
    INSERT INTO orders (
      friendly_id, status, customer_name, customer_phone,
      order_type, delivery_address, total_amount, notes
    ) VALUES (
      p_friendly_id, p_status, p_customer_name, p_customer_phone,
      p_order_type, p_delivery_address, p_total_price, p_notes
    )
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO order_items (id, order_id, item_type, name, quantity, unit_price, details)
      VALUES (
        COALESCE((v_item->>'id')::uuid, gen_random_uuid()),
        v_order_id,
        v_item->>'item_type',
        v_item->>'name',
        COALESCE((v_item->>'quantity')::integer, 1),
        COALESCE((v_item->>'unit_price')::numeric, 0),
        COALESCE(v_item->'details', '{}'::jsonb)
      );
    END LOOP;

    RETURN jsonb_build_object('ok', true, 'order_id', v_order_id, 'friendly_id', p_friendly_id);
  END IF;

  -- Parse Orario: HH:MM (Oggi|Domani) from notes
  v_slot_time := substring(p_notes FROM 'Orario:\s*(\d{1,2}:\d{2})');
  IF v_slot_time IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TIME', 'message', 'Orario non valido.');
  END IF;
  v_slot_time := to_char(to_timestamp(v_slot_time, 'HH24:MI'), 'HH24:MI');

  v_slot_day := CASE WHEN p_notes ~* 'domani' THEN 'domani' ELSE 'oggi' END;
  v_date_key := CURRENT_DATE;
  IF v_slot_day = 'domani' THEN
    v_date_key := CURRENT_DATE + INTERVAL '1 day';
  END IF;

  -- Serialize concurrent submits for same slot
  v_lock_key := hashtext(v_date_key::text || '|' || v_slot_time);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  SELECT COALESCE(SUM(
    CASE WHEN oi.item_type = 'poke' THEN COALESCE(oi.quantity, 1) ELSE 0 END
  ), 0)::integer
  INTO v_booked
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status IN ('RICEVUTO', 'IN_PREPARAZIONE')
    AND o.notes ~ ('Orario:\s*' || v_slot_time)
    AND (
      (v_slot_day = 'oggi' AND o.notes ~* 'oggi')
      OR (v_slot_day = 'domani' AND o.notes ~* 'domani')
    );

  IF v_booked + p_poke_count > 10 THEN
    v_remaining := GREATEST(0, 10 - v_booked);
    v_slot_end := to_char(
      to_timestamp(v_slot_time, 'HH24:MI') + INTERVAL '20 minutes',
      'HH24:MI'
    );
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'SLOT_FULL',
      'slot', v_slot_time,
      'slot_end', v_slot_end,
      'requested', p_poke_count,
      'remaining', v_remaining
    );
  END IF;

  INSERT INTO orders (
    friendly_id, status, customer_name, customer_phone,
    order_type, delivery_address, total_amount, notes
  ) VALUES (
    p_friendly_id, p_status, p_customer_name, p_customer_phone,
    p_order_type, p_delivery_address, p_total_price, p_notes
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (id, order_id, item_type, name, quantity, unit_price, details)
    VALUES (
      COALESCE((v_item->>'id')::uuid, gen_random_uuid()),
      v_order_id,
      v_item->>'item_type',
      v_item->>'name',
      COALESCE((v_item->>'quantity')::integer, 1),
      COALESCE((v_item->>'unit_price')::numeric, 0),
      COALESCE(v_item->'details', '{}'::jsonb)
    );
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'order_id', v_order_id, 'friendly_id', p_friendly_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_poke_order TO anon, authenticated;
