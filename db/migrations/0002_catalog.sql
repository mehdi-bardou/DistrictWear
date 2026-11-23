-- Catalogue. Product copy is stored in all three locales; variant.color is the
-- canonical French label used in the WhatsApp order message.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_fr text not null,
  name_ar text not null,
  name_en text not null,
  sort_order integer not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_fr text not null,
  name_ar text not null,
  name_en text not null,
  description_fr text,
  description_ar text,
  description_en text,
  cover_image text,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_fr text not null,
  name_ar text not null,
  name_en text not null,
  description_fr text,
  description_ar text,
  description_en text,
  category_id uuid references public.categories (id) on delete set null,
  collection_id uuid references public.collections (id) on delete set null,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  color text not null,
  color_en text,
  color_ar text,
  size text not null check (size in ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  price numeric(10, 2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text,
  external_url text,
  alt_fr text,
  alt_ar text,
  alt_en text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_images_has_one_source check (
    (storage_path is not null and external_url is null)
    or (storage_path is null and external_url is not null)
  )
);

create index products_public_order_idx on public.products (is_published, sort_order);
create index products_category_idx on public.products (category_id);
create index products_collection_idx on public.products (collection_id);
create index product_variants_product_idx on public.product_variants (product_id, sort_order);
create index product_images_product_idx on public.product_images (product_id, sort_order);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.handle_updated_at();
create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.handle_updated_at();
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();
create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.handle_updated_at();
