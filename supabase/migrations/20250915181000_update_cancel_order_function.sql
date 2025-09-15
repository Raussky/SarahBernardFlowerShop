DROP FUNCTION IF EXISTS cancel_order(uuid, uuid);
CREATE OR REPLACE FUNCTION cancel_order(p_order_id uuid, p_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  status order_status,
  total_price numeric,
  customer_name text,
  customer_phone text,
  customer_address text,
  delivery_method text,
  payment_method text,
  order_comment text,
  delivery_time text,
  created_at timestamptz
) AS $$
BEGIN
  -- Update the order status to 'cancelled' and return the updated row
  RETURN QUERY
  UPDATE orders
  SET status = 'cancelled'
  WHERE orders.id = p_order_id AND orders.user_id = p_user_id AND orders.status = 'pending'
  RETURNING
    orders.id,
    orders.user_id,
    orders.status,
    orders.total_price,
    orders.customer_name,
    orders.customer_phone,
    orders.customer_address,
    orders.delivery_method,
    orders.payment_method,
    orders.order_comment,
    orders.delivery_time,
    orders.created_at;
END;
$$ LANGUAGE plpgsql;