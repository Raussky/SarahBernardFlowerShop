CREATE OR REPLACE FUNCTION get_products_by_category_sorted(
  p_category_id BIGINT,
  sort_column TEXT,
  sort_direction TEXT,
  min_price NUMERIC DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  -- columns from products table
  id BIGINT,
  created_at TIMESTAMPTZ,
  name TEXT,
  name_ru TEXT,
  description TEXT,
  description_ru TEXT,
  image TEXT,
  category_id BIGINT,
  purchase_count INT,
  -- nested product_variants
  product_variants JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.created_at,
    p.name,
    p.name_ru,
    p.description,
    p.description_ru,
    p.image,
    p.category_id,
    p.purchase_count,
    (
      SELECT jsonb_agg(pv)
      FROM product_variants pv
      WHERE pv.product_id = p.id
    ) AS product_variants
  FROM
    products p
  WHERE
    p.category_id = p_category_id
    AND (
      min_price IS NULL OR EXISTS (
        SELECT 1
        FROM product_variants pv
        WHERE pv.product_id = p.id AND pv.price >= min_price
      )
    )
    AND (
      max_price IS NULL OR EXISTS (
        SELECT 1
        FROM product_variants pv
        WHERE pv.product_id = p.id AND pv.price <= max_price
      )
    )
  ORDER BY
    CASE
      WHEN sort_column = 'created_at' AND sort_direction = 'DESC' THEN p.created_at END DESC,
      WHEN sort_column = 'created_at' AND sort_direction = 'ASC' THEN p.created_at END ASC,
      WHEN sort_column = 'name' AND sort_direction = 'DESC' THEN p.name END DESC,
      WHEN sort_column = 'name' AND sort_direction = 'ASC' THEN p.name END ASC,
      WHEN sort_column = 'purchase_count' AND sort_direction = 'DESC' THEN p.purchase_count END DESC,
      WHEN sort_column = 'purchase_count' AND sort_direction = 'ASC' THEN p.purchase_count END ASC
  ;
END;
$$ LANGUAGE plpgsql;