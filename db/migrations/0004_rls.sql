-- Every table is locked down by default. Public reads are limited to published
-- catalogue rows; all writes require an admin profile. The service role bypasses
-- RLS by design and is never sent to the browser.

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.settings enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_attempts enable row level security;

-- Supabase can grant ALL (including TRUNCATE, which RLS does not cover) to the
-- client roles automatically. Remove that blanket grant before granting back
-- only what each role actually needs.
revoke all on all tables in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;

grant select on public.categories, public.collections, public.products,
  public.product_variants, public.product_images, public.settings to anon, authenticated;

grant select, insert, update, delete on public.profiles, public.categories,
  public.collections, public.products, public.product_variants,
  public.product_images, public.settings, public.inquiries to authenticated;

grant all on all tables in schema public to service_role;

-- Public catalogue ---------------------------------------------------------

create policy "Public active categories" on public.categories
  for select to anon, authenticated using (is_active);

create policy "Public published collections" on public.collections
  for select to anon, authenticated using (is_published);

create policy "Public published products" on public.products
  for select to anon, authenticated using (is_published);

create policy "Public active variants of published products" on public.product_variants
  for select to anon, authenticated
  using (
    is_active
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.is_published
    )
  );

create policy "Public images of published products" on public.product_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_published
    )
  );

create policy "Public settings" on public.settings
  for select to anon, authenticated using (id);

-- Profiles -----------------------------------------------------------------

create policy "Read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

-- Admin-only ----------------------------------------------------------------

create policy "Admin manages profiles" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin manages categories" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin manages collections" on public.collections
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin manages products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin manages variants" on public.product_variants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin manages images" on public.product_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin manages settings" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin reads inquiries" on public.inquiries
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- inquiry_attempts deliberately has no policy and no anon/authenticated grants:
-- it is only ever touched by the SECURITY DEFINER rate-limit function.
