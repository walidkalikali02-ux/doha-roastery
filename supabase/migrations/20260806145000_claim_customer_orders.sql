-- Attach older guest orders to the authenticated customer when the email is
-- verified by Supabase Auth. This keeps order history in the customer's account.
create or replace function public.claim_guest_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt()->>'email', ''));
  v_claimed integer;
begin
  if auth.uid() is null or v_email = '' then
    return 0;
  end if;

  update public.orders
     set user_id = auth.uid()
   where user_id is null
     and lower(coalesce(guest_email, '')) = v_email;

  get diagnostics v_claimed = row_count;
  return v_claimed;
end;
$$;

revoke all on function public.claim_guest_orders() from public;
grant execute on function public.claim_guest_orders() to authenticated;
