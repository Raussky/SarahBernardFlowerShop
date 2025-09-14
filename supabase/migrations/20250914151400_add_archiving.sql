-- Step 1: Create the archived tables with the same structure as the original tables.
-- We use "like" to copy the structure including columns, types, and defaults.

create table public.archived_orders (like public.orders including all);
create table public.archived_order_items (like public.order_items including all);

-- Step 2: Create a function that will perform the archiving process.
-- This function moves completed or cancelled orders older than 7 days.

create or replace function public.archive_old_orders()
returns void
language plpgsql
as $$
begin
  -- Use a CTE (Common Table Expression) to select the orders to be archived.
  with orders_to_archive as (
    select id from public.orders
    where
      status in ('completed', 'cancelled') and
      created_at < now() - interval '7 days'
  )
  -- Insert the selected orders into the archived_orders table.
  insert into public.archived_orders
  select * from public.orders
  where id in (select id from orders_to_archive);

  -- Insert the corresponding order items into the archived_order_items table.
  insert into public.archived_order_items
  select oi.* from public.order_items oi
  join orders_to_archive ota on oi.order_id = ota.id;

  -- Delete the archived order items from the original table.
  -- We must delete from the child table (order_items) first to avoid foreign key constraint violations.
  delete from public.order_items
  where order_id in (select id from orders_to_archive);

  -- Finally, delete the archived orders from the original table.
  delete from public.orders
  where id in (select id from orders_to_archive);
end;
$$;

-- Step 3: Schedule the function to run once a day using pg_cron.
-- This will run at midnight UTC every day.
-- Note: You must enable the pg_cron extension in your Supabase project for this to work.

select
  cron.schedule(
    'daily-order-archiving',
    '0 0 * * *', -- This is a cron expression for "at midnight every day"
    $$
      select public.archive_old_orders();
    $$
  );
