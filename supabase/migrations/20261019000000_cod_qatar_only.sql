-- Cash on delivery is available only for addresses inside Qatar.
-- NOT VALID preserves any historical GCC COD orders while still enforcing the
-- rule for all new inserts and future updates.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_cod_qatar_only'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_cod_qatar_only
      check (
        coalesce(shipping_address->>'payment_method', 'cod') <> 'cod'
        or coalesce(shipping_address->>'shipping_zone', 'qatar') in ('doha', 'qatar')
      ) not valid;
  end if;
end
$$;
