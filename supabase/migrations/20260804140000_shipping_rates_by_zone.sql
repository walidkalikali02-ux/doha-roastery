-- Use the selected delivery zone when calculating the server-side order total.
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
  v_shipping_zone text := coalesce(p_shipping_address->>'shipping_zone', 'qatar');
begin
  if p_guest_email is null or p_guest_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Invalid email';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Empty cart';
  end if;
  if v_shipping_zone not in ('doha', 'qatar', 'gcc') then
    raise exception 'Invalid shipping zone';
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
