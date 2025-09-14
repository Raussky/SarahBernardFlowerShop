CREATE OR REPLACE FUNCTION delete_product_safely(p_product_id uuid)
RETURNS TEXT AS $$
DECLARE
  order_count INTEGER;
BEGIN
  -- Check if the product is in any existing orders
  SELECT COUNT(*) INTO order_count
  FROM order_items oi
  JOIN product_variants pv ON oi.product_variant_id = pv.id
  WHERE pv.product_id = p_product_id;

  IF order_count > 0 THEN
    RETURN 'in-use'; -- Product is in use and cannot be deleted
  END IF;

  -- Delete references from combo_items first
  DELETE FROM combo_items ci
  WHERE ci.product_variant_id IN (
    SELECT pv.id FROM product_variants pv WHERE pv.product_id = p_product_id
  );

  -- If not in use, proceed with deletion
  -- The deletion will cascade to product_variants and product_images
  DELETE FROM products WHERE id = p_product_id;

  RETURN 'success';
END;
$$ LANGUAGE plpgsql;