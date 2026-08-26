-- Add missing MyFatoorah columns that the code expects but the original migration omitted.
alter table public.orders
  add column if not exists mf_invoice_id  text,
  add column if not exists mf_payment_url text;
