-- =============================================================================
-- Security hardening migration
-- Apply in Supabase SQL editor (or `supabase db push`).
-- Fixes:
--   #1 Admin authz enforced only client-side (RLS on writes)
--   #2 Client-trusted order totals (place_order RPC)
--   #4 Guest orders readable by anon (tighter RLS on orders)
--   #8 Self role escalation (profile role protection)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: is the current auth user an admin/manager?
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('ADMIN', 'MANAGER')
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles: users may read/update their own row, but NEVER change their role.
-- Only admins can change roles.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update_self_no_role on public.profiles;
create policy profiles_update_self_no_role on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- Trigger prevents self role escalation. Only admins may change role.
create or replace function public.profiles_guard_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- Force default role on signup; admins can promote later.
    new.role := 'CASHIER';
    return new;
  end if;

  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Not allowed to change role';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
before insert or update on public.profiles
for each row execute function public.profiles_guard_role();

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- ecommerce_products: public read, admin-only write
-- ---------------------------------------------------------------------------
alter table public.ecommerce_products enable row level security;

drop policy if exists products_public_read on public.ecommerce_products;
create policy products_public_read on public.ecommerce_products
  for select using (true);

drop policy if exists products_admin_write on public.ecommerce_products;
create policy products_admin_write on public.ecommerce_products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- orders / order_items: no direct client writes. Reads only for admins or
-- (optional) via a signed lookup. We block anon reads entirely — the success
-- page uses a security-definer RPC below.
-- ---------------------------------------------------------------------------
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists orders_admin_all on public.orders;
create policy orders_admin_all on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_items_admin_all on public.order_items;
create policy order_items_admin_all on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- Revoke direct table grants for anon; RPCs below are the only public surface.
revoke insert, update, delete on public.orders from anon, authenticated;
revoke insert, update, delete on public.order_items from anon, authenticated;
revoke select on public.orders from anon;
revoke select on public.order_items from anon;

-- ---------------------------------------------------------------------------
-- place_order: server-computed order creation.
-- Recomputes subtotal/shipping/total from ecommerce_products.price.
-- Generates a UUID order_number (unpredictable).
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_guest_email text,
  p_shipping_address jsonb,
  p_items jsonb  -- [{product_id: uuid, quantity: int, weight?: text, grind?: text}, ...]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric := 0;
  v_shipping numeric := 0;
  v_total numeric := 0;
  v_item jsonb;
  v_price numeric;
begin
  if p_guest_email is null or p_guest_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Invalid email';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Empty cart';
  end if;

  v_order_number := 'DR-' || replace(gen_random_uuid()::text, '-', '');

  insert into public.orders (
    order_number, guest_email, status, subtotal, shipping_cost,
    discount_amount, total, shipping_address
  ) values (
    v_order_number, p_guest_email, 'pending', 0, 0, 0, 0, p_shipping_address
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select price into v_price
      from public.ecommerce_products
      where id = (v_item->>'product_id')::uuid
        and status = 'active'
        and in_stock = true;

    if v_price is null then
      raise exception 'Product % not available', v_item->>'product_id';
    end if;

    insert into public.order_items (order_id, product_id, quantity, price)
    values (
      v_order_id,
      (v_item->>'product_id')::uuid,
      greatest(1, (v_item->>'quantity')::int),
      v_price
    );

    v_subtotal := v_subtotal + v_price * greatest(1, (v_item->>'quantity')::int);
  end loop;

  v_shipping := case when v_subtotal >= 200 then 0 else 15 end;
  v_total := v_subtotal + v_shipping;

  update public.orders
     set subtotal = v_subtotal,
         shipping_cost = v_shipping,
         total = v_total
   where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total', v_total
  );
end;
$$;

revoke all on function public.place_order(text, jsonb, jsonb) from public;
grant execute on function public.place_order(text, jsonb, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_order_summary: minimal read for the success page (no address / phone).
-- ---------------------------------------------------------------------------
create or replace function public.get_order_summary(p_order_number text)
returns table(order_number text, total numeric, guest_email text)
language sql
security definer
set search_path = public
as $$
  select order_number, total, guest_email
  from public.orders
  where order_number = p_order_number
    and created_at > now() - interval '1 hour';  -- short lookup window
$$;

grant execute on function public.get_order_summary(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Unique constraint on order_number (defensive; UUID already unique)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_indexes
     where schemaname = 'public' and indexname = 'orders_order_number_key'
  ) then
    alter table public.orders add constraint orders_order_number_key unique (order_number);
  end if;
end $$;
