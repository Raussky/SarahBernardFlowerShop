-- Admin helper to gate dashboard RPCs
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return false;
  end if;

  return exists (
    select 1
    from public.profiles p
    where p.id = v_uid
      and coalesce(p.is_admin, false)
  );
end;
$$;

comment on function public.is_admin is
  'Returns true when the current authenticated user is marked as admin in profiles.';

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

-- Aggregated metrics for the admin dashboard
create or replace function public.get_dashboard_analytics(
  start_date timestamptz,
  end_date timestamptz
)
returns table (
  total_revenue numeric,
  total_orders bigint,
  pending_orders bigint,
  best_selling_product_name text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_start timestamptz := coalesce(start_date, timezone('utc', now()) - interval '30 days');
  v_end timestamptz := coalesce(end_date, timezone('utc', now()));
begin
  if not public.is_admin() then
    raise exception
      using errcode = '42501',
            message = 'Admin privileges required to access dashboard analytics.';
  end if;

  return query
  with filtered_orders as (
    select *
    from public.orders o
    where o.created_at >= v_start
      and o.created_at <= v_end
  ),
  best_seller as (
    select
      oi.product_name,
      sum(oi.quantity) as total_quantity
    from public.order_items oi
    join filtered_orders fo on fo.id = oi.order_id
    group by oi.product_name
    order by total_quantity desc, oi.product_name asc
    limit 1
  )
  select
    coalesce(sum(fo.total_price), 0)::numeric as total_revenue,
    count(*)::bigint as total_orders,
    count(*) filter (where fo.status = 'pending')::bigint as pending_orders,
    (select product_name from best_seller) as best_selling_product_name
  from filtered_orders fo;
end;
$$;

comment on function public.get_dashboard_analytics(timestamptz, timestamptz) is
  'Returns revenue, order counts, and best seller within the requested period (admin only).';

revoke all on function public.get_dashboard_analytics(timestamptz, timestamptz) from public;
grant execute on function public.get_dashboard_analytics(timestamptz, timestamptz) to authenticated, service_role;

-- Time series data for the sales chart
create or replace function public.get_sales_chart_data(
  start_date timestamptz,
  end_date timestamptz
)
returns table (
  sale_day date,
  total_revenue numeric
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_start timestamptz := coalesce(start_date, timezone('utc', now()) - interval '30 days');
  v_end timestamptz := coalesce(end_date, timezone('utc', now()));
begin
  if not public.is_admin() then
    raise exception
      using errcode = '42501',
            message = 'Admin privileges required to access sales chart data.';
  end if;

  return query
  select
    date_trunc('day', o.created_at)::date as sale_day,
    coalesce(sum(o.total_price), 0)::numeric as total_revenue
  from public.orders o
  where o.created_at >= v_start
    and o.created_at <= v_end
    and o.status <> 'cancelled'
  group by sale_day
  order by sale_day;
end;
$$;

comment on function public.get_sales_chart_data(timestamptz, timestamptz) is
  'Returns per-day revenue totals for the admin sales chart (admin only).';

revoke all on function public.get_sales_chart_data(timestamptz, timestamptz) from public;
grant execute on function public.get_sales_chart_data(timestamptz, timestamptz) to authenticated, service_role;

-- Harden the cancellation trigger so missing webhook config never blocks updates
create or replace function public.handle_order_cancellation()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_webhook_url text := current_setting('app.settings.order_cancellation_webhook_url', true);
  v_webhook_auth text := current_setting('app.settings.order_cancellation_webhook_auth', true);
  v_headers jsonb := jsonb_build_object('Content-Type', 'application/json');
begin
  if new.status = 'cancelled' and coalesce(old.status, '') <> 'cancelled' then
    if v_webhook_url is null or length(trim(v_webhook_url)) = 0 then
      return new;
    end if;

    if v_webhook_auth is not null and length(trim(v_webhook_auth)) > 0 then
      v_headers := v_headers || jsonb_build_object('Authorization', v_webhook_auth);
    end if;

    begin
      perform net.http_post(
        url := v_webhook_url,
        headers := v_headers,
        body := jsonb_build_object('record', to_jsonb(new))
      );
    exception
      when others then
        raise notice 'Order cancellation webhook failed: %', sqlerrm;
        -- Swallow errors so user-facing updates never fail
    end;
  end if;

  return new;
end;
$$;

comment on function public.handle_order_cancellation() is
  'Trigger that calls the configurable cancellation webhook when a user cancels an order.';
