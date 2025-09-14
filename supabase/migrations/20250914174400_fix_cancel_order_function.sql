CREATE OR REPLACE FUNCTION cancel_order(p_order_id uuid, p_user_id uuid)
RETURNS TEXT AS $$
DECLARE
  current_status TEXT;
BEGIN
  -- Check if the order exists and belongs to the user
  SELECT status INTO current_status FROM orders
  WHERE id = p_order_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN 'not found';
  END IF;

  -- Check if the order is still pending
  IF current_status != 'pending' THEN
    RETURN 'no longer be cancelled';
  END IF;

  -- Update the order status to 'cancelled'
  UPDATE orders
  SET status = 'cancelled'
  WHERE id = p_order_id;

  RETURN 'success';
END;
$$ LANGUAGE plpgsql;