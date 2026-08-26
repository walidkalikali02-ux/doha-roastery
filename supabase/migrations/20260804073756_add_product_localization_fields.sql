-- Add customer-facing Arabic content and normalized weight metadata.
alter table public.ecommerce_products
  add column if not exists name_ar text,
  add column if not exists description_ar text,
  add column if not exists weight text;
