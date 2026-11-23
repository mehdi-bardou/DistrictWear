-- A single settings row is the admin-editable source of truth for the shop
-- number (the env var is only a build-time fallback for the footer link).

create table public.settings (
  id boolean primary key default true check (id),
  whatsapp_number text not null default '212600000000' check (whatsapp_number ~ '^[0-9]{8,15}$'),
  contact_email text,
  instagram_url text,
  inquiry_logging_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.settings (id) values (true) on conflict (id) do nothing;

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.handle_updated_at();

-- Optional, feature-flagged order logging. No customer PII beyond the phone
-- number they chose to send; no public read path.
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  locale text not null check (locale in ('fr', 'ar', 'en')),
  message text not null,
  items jsonb not null default '[]'::jsonb,
  total numeric(10, 2) not null default 0 check (total >= 0),
  customer_phone text,
  status text not null default 'logged' check (status in ('logged', 'followed_up', 'closed')),
  created_at timestamptz not null default now()
);

-- Fixed-window counter. Only reachable through try_log_inquiry().
create table public.inquiry_attempts (
  key text primary key,
  window_start timestamptz not null default now(),
  attempt_count integer not null default 1 check (attempt_count > 0)
);

create or replace function public.try_log_inquiry(
  p_reference text,
  p_locale text,
  p_message text,
  p_items jsonb,
  p_total numeric,
  p_customer_phone text,
  p_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enabled boolean;
  v_window timestamptz;
  v_count integer;
  v_id uuid;
begin
  select inquiry_logging_enabled into v_enabled from public.settings where id;
  if not coalesce(v_enabled, false) then
    return null;
  end if;

  -- Validate before touching the rate-limit counter so junk cannot burn quota.
  if p_reference is null or p_reference !~ '^[A-Za-z0-9-]{1,40}$'
     or p_locale is null or p_locale not in ('fr', 'ar', 'en')
     or p_message is null or length(p_message) = 0 or length(p_message) > 4000
     or p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 20
     or p_total is null or p_total < 0 or p_total > 1000000
     or p_customer_phone is null or length(p_customer_phone) > 20
     or p_key is null or length(p_key) = 0 or length(p_key) > 200 then
    return null;
  end if;

  select window_start, attempt_count into v_window, v_count
  from public.inquiry_attempts
  where key = p_key
  for update;

  if v_window is null or v_window < now() - interval '10 minutes' then
    insert into public.inquiry_attempts (key, window_start, attempt_count)
    values (p_key, now(), 1)
    on conflict (key) do update set window_start = now(), attempt_count = 1;
  else
    if v_count >= 5 then
      return null;
    end if;
    update public.inquiry_attempts set attempt_count = attempt_count + 1 where key = p_key;
  end if;

  insert into public.inquiries (reference, locale, message, items, total, customer_phone)
  values (p_reference, p_locale, p_message, p_items, p_total, p_customer_phone)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.try_log_inquiry(text, text, text, jsonb, numeric, text, text) from public;
grant execute on function public.try_log_inquiry(text, text, text, jsonb, numeric, text, text) to anon;
