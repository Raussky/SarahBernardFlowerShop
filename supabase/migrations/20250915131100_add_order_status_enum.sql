-- First, update existing Russian and English text values to the new English keys.
UPDATE public.orders
SET status =
  CASE
    WHEN status = 'новый' THEN 'pending'
    WHEN status = 'в работе' THEN 'processing'
    WHEN status = 'доставляется' THEN 'out_for_delivery'
    WHEN status = 'выполнен' THEN 'delivered'
    WHEN status = 'completed' THEN 'delivered' -- Added this line to handle the 'completed' status
    WHEN status = 'отменен' THEN 'cancelled'
    ELSE status
  END;

-- Create the new ENUM type for order statuses.
CREATE TYPE order_status AS ENUM (
    'pending',
    'processing',
    'out_for_delivery',
    'delivered',
    'cancelled'
);

-- Drop the old default value for the column.
ALTER TABLE public.orders
ALTER COLUMN status DROP DEFAULT;

-- Alter the column type to the new ENUM, using a direct cast.
ALTER TABLE public.orders
ALTER COLUMN status TYPE order_status USING status::text::order_status;

-- Set the new default value for the column using the ENUM type.
ALTER TABLE public.orders
ALTER COLUMN status SET DEFAULT 'pending';