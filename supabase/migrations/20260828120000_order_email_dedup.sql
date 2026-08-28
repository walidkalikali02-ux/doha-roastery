-- Idempotency flag for order confirmation emails.
--
-- Previously the callback route decided whether to send an email based on
-- `order.status != 'paid'`. When the MyFatoorah webhook (server-to-server) beat
-- the browser callback to the DB and set status = 'paid', the callback then
-- skipped the email and no notification was ever sent.
--
-- With this column, both callback and webhook can atomically claim the send
-- with a conditional UPDATE. Whoever flips it from NULL to now() first is the
-- one who actually sends the email; the other request sees it non-null and
-- exits early. Result: exactly one email per order, no matter which handler
-- runs first.

alter table public.orders
  add column if not exists email_notified_at timestamptz;

comment on column public.orders.email_notified_at is
  'When the customer/owner confirmation email was successfully sent. Used as an atomic dedup flag between the payment callback and the webhook.';

notify pgrst, 'reload schema';
