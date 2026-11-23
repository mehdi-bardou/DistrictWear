insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png', 'image/avif']
)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

grant usage on schema storage to anon, authenticated, service_role;
grant select on storage.objects to anon, authenticated;
grant insert, update, delete on storage.objects to authenticated;
grant all on storage.objects to service_role;

create policy "Public product images" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-images');

create policy "Admin manages product images" on storage.objects
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin() and bucket_id = 'product-images');
