-- Hero images slider table
-- Supports up to 4 images that auto-animate on the landing page

create table if not exists public.hero_images (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  alt_text text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.hero_images enable row level security;

-- Select: public read
create policy "hero_images_select_public"
  on public.hero_images
  for select
  to anon, authenticated
  using (true);

-- Insert: staff/admin only
create policy "hero_images_insert_staff"
  on public.hero_images
  for insert
  to authenticated
  with check (public.is_staff());

-- Update: staff/admin only
create policy "hero_images_update_staff"
  on public.hero_images
  for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Delete: staff/admin only
create policy "hero_images_delete_staff"
  on public.hero_images
  for delete
  to authenticated
  using (public.is_staff());

-- Index for fast ordered reads
create index if not exists idx_hero_images_active_order
  on public.hero_images(is_active, display_order);
