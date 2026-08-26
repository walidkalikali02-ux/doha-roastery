-- Keep the order summary available long enough for payment redirects and retries.
drop function if exists public.get_order_summary(text);
create function public.get_order_summary(p_order_number text)
returns table(order_number text, total numeric, guest_email text, status text)
language sql
security definer
set search_path = public
as $$
  select o.order_number, o.total, o.guest_email, o.status
  from public.orders o
  where o.order_number = p_order_number
    and o.created_at > now() - interval '30 days';
$$;

revoke all on function public.get_order_summary(text) from public;
grant execute on function public.get_order_summary(text) to anon, authenticated;
