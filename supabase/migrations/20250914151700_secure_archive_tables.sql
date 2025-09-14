-- Step 1: Enable Row Level Security (RLS) on the newly created archive tables.
-- This is a critical security measure to prevent unauthorized public access.

alter table public.archived_orders enable row level security;
alter table public.archived_order_items enable row level security;

-- Step 2: Create policies that deny all public access by default.
-- By creating a policy that is always false, we effectively block any external API requests
-- made with the anon key from reading, inserting, updating, or deleting data.
-- The service_role key (used by server-side functions like pg_cron) bypasses RLS,
-- so our archiving function will continue to work correctly.

create policy "Deny all public access to archived orders"
on public.archived_orders for all
using (false);

create policy "Deny all public access to archived order items"
on public.archived_order_items for all
using (false);