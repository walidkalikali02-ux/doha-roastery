-- Price Doha Signature Blend by weight.
-- Keep this idempotent so it is safe to run more than once.

do $$
declare
  v_one_kg public.ecommerce_products%rowtype;
begin
  -- Prefer an existing 1 kg product. If the legacy product has no weight,
  -- promote it to the 1 kg variant instead of creating a duplicate.
  update public.ecommerce_products
  set
    price = 90,
    weight = '1kg',
    updated_at = now()
  where id = (
    select id
    from public.ecommerce_products
    where lower(name) = lower('Doha Signature Blend')
      and (weight = '1kg' or weight is null or btrim(weight) = '')
    order by case when weight = '1kg' then 0 else 1 end, created_at
    limit 1
  )
  returning * into v_one_kg;

  if v_one_kg.id is null then
    raise notice 'Doha Signature Blend was not found; no prices were changed.';
    return;
  end if;

  -- Update the half-kilo variant when it already exists.
  update public.ecommerce_products
  set
    price = 50,
    weight = '500g',
    updated_at = now()
  where lower(name) = lower('Doha Signature Blend')
    and weight in ('500g', '0.5kg', '1/2kg');

  -- Otherwise clone the 1 kg listing so content and inventory presentation
  -- stay consistent while the SKU remains unique.
  if not exists (
    select 1
    from public.ecommerce_products
    where lower(name) = lower('Doha Signature Blend')
      and weight = '500g'
  ) then
    insert into public.ecommerce_products (
      name,
      name_ar,
      weight,
      sku,
      category,
      description,
      description_ar,
      seo_title,
      seo_description,
      seo_description_ar,
      price,
      compare_at_price,
      cost_per_item,
      quantity,
      low_stock_threshold,
      status,
      image_url,
      tags,
      in_stock
    ) values (
      v_one_kg.name,
      v_one_kg.name_ar,
      '500g',
      case
        when nullif(btrim(v_one_kg.sku), '') is null then 'DOHA-SIGNATURE-500G'
        else regexp_replace(v_one_kg.sku, '-?(1KG|1000G)$', '', 'i') || '-500G'
      end,
      v_one_kg.category,
      v_one_kg.description,
      v_one_kg.description_ar,
      v_one_kg.seo_title,
      v_one_kg.seo_description,
      v_one_kg.seo_description_ar,
      50,
      null,
      null,
      v_one_kg.quantity,
      v_one_kg.low_stock_threshold,
      v_one_kg.status,
      v_one_kg.image_url,
      v_one_kg.tags,
      v_one_kg.in_stock
    );
  end if;
end
$$;
