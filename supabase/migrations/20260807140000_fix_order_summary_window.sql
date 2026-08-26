-- Extend get_order_summary lookup window from 1 hour to 30 days.
-- The 1-hour limit caused the success page to show "—" for any order
-- that took longer than an hour to complete payment.
create or replace function public.get_order_summary(p_order_number text)
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
