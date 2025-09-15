-- Drop the existing update policy if it exists
DROP POLICY IF EXISTS "Allow users to update their own orders" ON public.orders;

-- Create a new policy that allows users to cancel their own pending orders
CREATE POLICY "Allow users to update their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);