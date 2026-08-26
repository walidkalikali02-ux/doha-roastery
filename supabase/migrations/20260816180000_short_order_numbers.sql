-- Short, sequential, human-readable order numbers (Shopify-style: 1001, 1002...).
--
-- Strategy:
--   * Keep orders.id (uuid) as internal primary key — never shown to customers.
--   * Keep orders.order_number as the customer-facing identifier — but now
--     populated from a PostgreSQL sequence starting at 1001 instead of a UUID.
--   * Existing rows keep their old "DR-<uuid>" order_number to preserve history,
--     MyFatoorah lookups, and any live payment callbacks in flight.
--   * MyFatoorah keeps receiving the internal uuid via UserDefinedField and the
--     short number via CustomerReference (no gateway logic changes needed).

-- 1) Sequence — concurrency-safe, guaranteed unique.
create sequence if not exists public.orders_serial_seq
  as bigint
  start with 1001
  increment by 1
  minvalue 1001
  no maxvalue
  cache 1;

-- If the sequence already existed (re-running the migration in dev), make sure
-- it is at least 1001 so we never issue a value below that floor.
select setval('public.orders_serial_seq',
              greatest(1001, nextval('public.orders_serial_seq')),
              true);

-- 2) Rewrite place_order to use the sequence instead of a UUID string.
-- Body is identical to the previous version (email_otp_customer_accounts.sql)
-- except for the single line that builds v_order_number.
create or replace function public.place_order(
  p_guest_email text,
  p_shipping_address jsonb,
  p_items jsonb
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
  v_product_name text;
  v_sku text;
  v_quantity integer;
  v_shipping_zone text := coalesce(p_shipping_address->>'shipping_zone', 'qatar');
begin
  if p_guest_email is null or p_guest_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Invalid email';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Empty cart';
  end if;
  if v_shipping_zone not in ('doha', 'qatar', 'gcc') then
    raise exception 'Invalid shipping zone';
  end if;

  -- Short sequential number, stored as text for schema compatibility with
  -- existing DR-<uuid> rows. UNIQUE constraint on order_number still applies.
  v_order_number := nextval('public.orders_serial_seq')::text;

  insert into public.orders (
    user_id, order_number, guest_email, status, subtotal, shipping_cost,
    discount_amount, total, shipping_address
  ) values (
    auth.uid(), v_order_number, p_guest_email, 'pending', 0, 0, 0, 0,
    p_shipping_address
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := greatest(1, coalesce((v_item->>'quantity')::int, 1));
    v_price := null;
    v_product_name := null;
    v_sku := null;

    select price, name, sku
      into v_price, v_product_name, v_sku
      from public.ecommerce_products
      where id = (v_item->>'product_id')::uuid
        and status = 'active'
        and in_stock = true;

    if v_price is null then
      select coalesce(p.selling_price, p.base_price, 0), p.name, p.sku
        into v_price, v_product_name, v_sku
        from public.product_definitions p
        where p.id = (v_item->>'product_id')::uuid
          and p.is_active = true
          and upper(coalesce(p.product_status, 'ACTIVE')) = 'ACTIVE'
          and exists (
            select 1 from public.inventory_items i
            where i.product_id = p.id and coalesce(i.stock, 0) > 0
          );
    end if;

    if v_price is null or v_price <= 0 then
      raise exception 'Product % not available', v_item->>'product_id';
    end if;

    insert into public.order_items (
      order_id, product_id, product_name, sku, quantity,
      unit_price, total_price, grind, variant_name
    ) values (
      v_order_id, (v_item->>'product_id')::uuid,
      coalesce(v_product_name, 'Product'), v_sku, v_quantity,
      v_price, v_price * v_quantity, v_item->>'grind', v_item->>'weight'
    );

    v_subtotal := v_subtotal + v_price * v_quantity;
  end loop;

  v_shipping := case v_shipping_zone
    when 'doha' then 10
    when 'qatar' then 15
    when 'gcc' then 50
  end;
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

-- Ask PostgREST to reload its schema cache so the new function signature is
-- picked up immediately by the client.
notify pgrst, 'reload schema';
