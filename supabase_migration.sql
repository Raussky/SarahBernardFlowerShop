-- First, create the function that will be called by the trigger.
create or replace function public.handle_order_cancellation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Check if the status was changed to 'cancelled'
  if new.status = 'cancelled' and old.status != 'cancelled' then
    -- Asynchronously invoke the Edge Function
    perform net.http_post(
      url:='https://<YOUR-PROJECT-REF>.supabase.co/functions/v1/order-cancellation-notifier',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer <YOUR-SUPABASE-ANON-KEY>"}'::jsonb,
      body:=jsonb_build_object('record', new)
    );
  end if;
  return new;
end;
$$;

-- Then, create the trigger on the 'orders' table.
create trigger on_order_cancelled
  after update on public.orders
  for each row
  execute function public.handle_order_cancellation();