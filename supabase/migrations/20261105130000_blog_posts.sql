-- Coffee journal: public readers see published articles; staff manage drafts.
-- Dedicated helper: the older storefront may not have public.is_admin().
create function public.blog_is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role::text in ('ADMIN', 'MANAGER')
  );
$$;
revoke all on function public.blog_is_staff() from public;
grant execute on function public.blog_is_staff() to authenticated;

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_ar text not null default '',
  title_en text not null default '',
  excerpt_ar text not null default '',
  excerpt_en text not null default '',
  content_ar text not null default '',
  content_en text not null default '',
  category text not null default 'species' check (category in ('guides', 'species', 'varieties', 'origins')),
  image_url text not null default '/blog/coffee-species.svg',
  image_alt_ar text not null default '',
  image_alt_en text not null default '',
  seo_title_ar text not null default '',
  seo_title_en text not null default '',
  seo_description_ar text not null default '',
  seo_description_en text not null default '',
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_publication_date check (status <> 'published' or published_at is not null)
);

create index blog_posts_published_date_idx on public.blog_posts (published_at desc, id)
  where status = 'published';

alter table public.blog_posts enable row level security;
revoke all on public.blog_posts from anon, authenticated;
grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;
grant all on public.blog_posts to service_role;

create policy blog_posts_public_read on public.blog_posts for select to anon, authenticated
  using (status = 'published' and published_at <= now());
create policy blog_posts_staff_manage on public.blog_posts for all to authenticated
  using ((select public.blog_is_staff())) with check ((select public.blog_is_staff()));

create function public.blog_posts_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function public.blog_posts_touch_updated_at() from public;
create trigger blog_posts_updated_at before update on public.blog_posts
  for each row execute function public.blog_posts_touch_updated_at();
