-- Split email notifications into customer and admin independently.
--
-- The previous single `email_notified_at` column meant that if the customer
-- email succeeded but the admin email failed, retrying would resend the
-- customer email. With two independent columns, each recipient can be
-- retried without affecting the other.

alter table public.orders
  add column if not exists customer_email_notified_at timestamptz,
  add column if not exists admin_email_notified_at timestamptz;

comment on column public.orders.customer_email_notified_at is
  'When the customer confirmation email was successfully sent. Atomic dedup flag — only the first caller to flip NULL → now() wins.';

comment on column public.orders.admin_email_notified_at is
  'When the admin/store-owner notification email was successfully sent. Independent of customer_email_notified_at.';

-- Atomic RPC: claim customer email send. Returns true only for the first caller.
create or replace function public.claim_customer_email(p_order_id uuid)
returns boolean
language sql
security definer
as $$
  UPDATE public.orders
  SET customer_email_notified_at = now()
  WHERE id = p_order_id
    AND customer_email_notified_at IS NULL
  RETURNING true;
$$;

-- Atomic RPC: claim admin email send. Returns true only for the first caller.
create or replace function public.claim_admin_email(p_order_id uuid)
returns boolean
language sql
security definer
as $$
  UPDATE public.orders
  SET admin_email_notified_at = now()
  WHERE id = p_order_id
    AND admin_email_notified_at IS NULL
  RETURNING true;
$$;

-- Release functions for retry after failure
create or replace function public.release_customer_email(p_order_id uuid)
returns void
language sql
security definer
as $$
  UPDATE public.orders
  SET customer_email_notified_at = NULL
  WHERE id = p_order_id;
$$;

create or replace function public.release_admin_email(p_order_id uuid)
returns void
language sql
security definer
as $$
  UPDATE public.orders
  SET admin_email_notified_at = NULL
  WHERE id = p_order_id;
$$;

notify pgrst, 'reload schema';
