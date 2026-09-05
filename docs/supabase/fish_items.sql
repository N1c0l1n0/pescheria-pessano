-- Supabase setup for fish catalog management
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists public.fish_items (
  id text primary key,
  name text not null,
  origin text not null check (origin in ('Mar Ligure', 'Medit. Occ.')),
  location_detail text not null default '',
  price_per_kg numeric(10, 2) not null check (price_per_kg >= 0),
  image_url text not null,
  description text not null default '',
  cooking_tip text not null default '',
  wine_pairing text not null default '',
  is_popular boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists fish_items_active_sort_idx
  on public.fish_items (is_active, sort_order, name);

alter table public.fish_items enable row level security;

create policy "Public read active fish items"
  on public.fish_items
  for select
  using (is_active = true);

create policy "Public read all fish items for admin"
  on public.fish_items
  for select
  using (true);

create policy "Public insert fish items"
  on public.fish_items
  for insert
  with check (true);

create policy "Public update fish items"
  on public.fish_items
  for update
  using (true)
  with check (true);

create policy "Public delete fish items"
  on public.fish_items
  for delete
  using (true);

insert into storage.buckets (id, name, public)
values ('fish-images', 'fish-images', true)
on conflict (id) do update set public = true;

create policy "Public read fish images"
  on storage.objects
  for select
  using (bucket_id = 'fish-images');

create policy "Public upload fish images"
  on storage.objects
  for insert
  with check (bucket_id = 'fish-images');

create policy "Public update fish images"
  on storage.objects
  for update
  using (bucket_id = 'fish-images')
  with check (bucket_id = 'fish-images');

create policy "Public delete fish images"
  on storage.objects
  for delete
  using (bucket_id = 'fish-images');

-- Optional: seed default catalog (run once)
-- Copy values from src/data/fishCatalogDefaults.ts or use the admin panel button "Importa catalogo predefinito"
