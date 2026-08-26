-- Resets a payment_failed order back to pending and returns its items
-- so the client can restore the cart and retry payment without creating a new order.

drop function if exists public.get_order_for_retry(text);
create function public.get_order_for_retry(p_order_number text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_items    jsonb;
begin
  select o.id into v_order_id
    from public.orders o
   where o.order_number = p_order_number
     and o.status = 'payment_failed'
     and o.created_at > now() - interval '7 days';

  if v_order_id is null then
    raise exception 'Order not found or not retryable';
  end if;

  -- Reset to pending and clear the stale payment session so /api/payments/create
  -- will generate a fresh MyFatoorah URL.
  update public.orders
     set status         = 'pending',
         mf_invoice_id  = null,
         mf_payment_url = null,
         mf_payment_id = null,
         mf_transaction_id = null,
         payment_verified_at = null
   where id = v_order_id;

  -- Return items joined with products so the client can rebuild the cart.
  select jsonb_agg(
    jsonb_build_object(
      'id',        oi.product_id,
      'name',      oi.product_name,
      'nameAr',    ep.name_ar,
      'weight',    oi.variant_name,
      'grind',     coalesce(oi.grind, ''),
      'notes',     '',
      'price',     oi.unit_price,
      'image_url', ep.image_url,
      'quantity',  oi.quantity
    )
  )
  into v_items
  from public.order_items oi
  left join public.ecommerce_products ep on ep.id = oi.product_id
  where oi.order_id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'items',    coalesce(v_items, '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_order_for_retry(text) from public;
grant execute on function public.get_order_for_retry(text) to anon, authenticated;
