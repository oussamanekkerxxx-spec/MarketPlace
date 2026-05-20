-- =============================================================================
--  MIGRATION 08: Storage buckets + RLS policies
--  =============================================================================
--  Versions the manual dashboard steps described (but left commented-out) in
--  migration 01, Section 15.  Safe to run on an existing project — all
--  statements are idempotent.
--
--  Buckets
--  -------
--  product-images   public read | staff write
--  category-images  public read | staff write
--  brand-assets     public read | admin write
--
--  Run this in the Supabase SQL editor (service-role / postgres user).
-- =============================================================================


-- =============================================================================
--  SECTION 1: Buckets
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'product-images',
    'product-images',
    true,
    10485760,   -- 10 MB per file
    array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  ),
  (
    'category-images',
    'category-images',
    true,
    10485760,
    array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  ),
  (
    'brand-assets',
    'brand-assets',
    true,
    5242880,    -- 5 MB per file (logos / favicons are small)
    array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml', 'image/x-icon']
  ),
  (
    'site-assets',
    'site-assets',
    true,
    10485760,   -- 10 MB per file
    array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  ),
  (
    'qr-codes',
    'qr-codes',
    true,
    5242880,    -- 5 MB per file (QR codes are tiny)
    array['image/png']
  )
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- =============================================================================
--  SECTION 2: product-images policies
-- =============================================================================

drop policy if exists "product-images: public read"  on storage.objects;
drop policy if exists "product-images: staff write"  on storage.objects;
drop policy if exists "product-images: staff update" on storage.objects;
drop policy if exists "product-images: staff delete" on storage.objects;

-- Anyone (including anonymous customers) can view product images.
create policy "product-images: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

-- Authenticated staff can upload new images.
create policy "product-images: staff write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_staff());

-- Authenticated staff can replace / update image metadata.
create policy "product-images: staff update"
  on storage.objects for update
  to authenticated
  using  (bucket_id = 'product-images' and public.is_staff())
  with check (bucket_id = 'product-images' and public.is_staff());

-- Authenticated staff can delete images (e.g. when removing from a product).
create policy "product-images: staff delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_staff());


-- =============================================================================
--  SECTION 3: category-images policies
-- =============================================================================

drop policy if exists "category-images: public read"  on storage.objects;
drop policy if exists "category-images: staff write"  on storage.objects;
drop policy if exists "category-images: staff update" on storage.objects;
drop policy if exists "category-images: staff delete" on storage.objects;

create policy "category-images: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'category-images');

create policy "category-images: staff write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'category-images' and public.is_staff());

create policy "category-images: staff update"
  on storage.objects for update
  to authenticated
  using  (bucket_id = 'category-images' and public.is_staff())
  with check (bucket_id = 'category-images' and public.is_staff());

create policy "category-images: staff delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'category-images' and public.is_staff());


-- =============================================================================
--  SECTION 4: brand-assets policies
-- =============================================================================
--  Logo, favicon, OG images are higher-trust assets — only admins can change
--  them, not managers.

drop policy if exists "brand-assets: public read"  on storage.objects;
drop policy if exists "brand-assets: admin write"  on storage.objects;
drop policy if exists "brand-assets: admin update" on storage.objects;
drop policy if exists "brand-assets: admin delete" on storage.objects;

create policy "brand-assets: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'brand-assets');

create policy "brand-assets: admin write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'brand-assets' and public.is_admin());

create policy "brand-assets: admin update"
  on storage.objects for update
  to authenticated
  using  (bucket_id = 'brand-assets' and public.is_admin())
  with check (bucket_id = 'brand-assets' and public.is_admin());

create policy "brand-assets: admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'brand-assets' and public.is_admin());


-- =============================================================================
--  SECTION 5: site-assets policies
-- =============================================================================
--  Hero images and other site-wide assets.

drop policy if exists "site-assets: public read"  on storage.objects;
drop policy if exists "site-assets: staff write"  on storage.objects;
drop policy if exists "site-assets: staff update" on storage.objects;
drop policy if exists "site-assets: staff delete" on storage.objects;

create policy "site-assets: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'site-assets');

create policy "site-assets: staff write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-assets' and public.is_staff());

create policy "site-assets: staff update"
  on storage.objects for update
  to authenticated
  using  (bucket_id = 'site-assets' and public.is_staff())
  with check (bucket_id = 'site-assets' and public.is_staff());

create policy "site-assets: staff delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-assets' and public.is_staff());


-- =============================================================================
--  SECTION 6: qr-codes policies
-- =============================================================================
--  QR codes uploaded for email notifications. Public read so email clients
--  can load the image. Staff write/update/delete for cleanup.

drop policy if exists "qr-codes: public read"  on storage.objects;
drop policy if exists "qr-codes: staff write"  on storage.objects;
drop policy if exists "qr-codes: staff update" on storage.objects;
drop policy if exists "qr-codes: staff delete" on storage.objects;

create policy "qr-codes: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'qr-codes');

create policy "qr-codes: staff write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'qr-codes' and public.is_staff());

create policy "qr-codes: staff update"
  on storage.objects for update
  to authenticated
  using  (bucket_id = 'qr-codes' and public.is_staff())
  with check (bucket_id = 'qr-codes' and public.is_staff());

create policy "qr-codes: staff delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'qr-codes' and public.is_staff());
