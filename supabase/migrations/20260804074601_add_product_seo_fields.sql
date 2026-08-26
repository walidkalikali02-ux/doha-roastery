-- Keep detailed product copy separate from short search snippets.
alter table public.ecommerce_products
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_description_ar text;
