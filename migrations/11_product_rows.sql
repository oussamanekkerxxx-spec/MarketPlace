-- Product rows (homepage sections)
-- Admin-controlled horizontal product strips on the landing page

create table if not exists public.product_rows (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_fr text not null,
  title_en text,
  title_ar text,
  subtitle_fr text,
  subtitle_en text,
  subtitle_ar text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.product_rows enable row level security;

-- Select: public read
create policy "product_rows_select_public"
  on public.product_rows
  for select
  to anon, authenticated
  using (true);

-- Insert: staff/admin only
create policy "product_rows_insert_staff"
  on public.product_rows
  for insert
  to authenticated
  with check (public.is_staff());

-- Update: staff/admin only
create policy "product_rows_update_staff"
  on public.product_rows
  for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Delete: staff/admin only
create policy "product_rows_delete_staff"
  on public.product_rows
  for delete
  to authenticated
  using (public.is_staff());

-- Index for fast ordered reads
create index if not exists idx_product_rows_active_order
  on public.product_rows(is_active, display_order);

-- Add product_row_id to products table
alter table public.products
  add column if not exists product_row_id uuid null references public.product_rows(id) on delete set null;

-- Index for row-based product queries
create index if not exists idx_products_active_row
  on public.products(is_active, product_row_id);

-- Recreate indexes that may benefit from the new column
-- (existing indexes on products are kept)
