-- =============================================================================
--  MIGRATION 09: Fix Storage Buckets + Remove Role Dependency
--  =============================================================================
--  Run this in your new Supabase project's SQL Editor (service-role / postgres).
--
--  Fixes:
--  1. Missing `site-assets` bucket (used for hero image uploads)
--  2. `is_staff()` / `is_admin()` now allow any authenticated user
--     (team/roles were removed from the app)
-- =============================================================================

-- =============================================================================
--  STEP 1: Update role-check functions
-- =============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- Team/roles removed: any authenticated user is an admin.
  select auth.role() = 'authenticated';
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- Team/roles removed: any authenticated user is staff.
  select auth.role() = 'authenticated';
$$;


-- =============================================================================
--  STEP 2: Create missing `site-assets` bucket
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'site-assets',
    'site-assets',
    true,
    10485760,   -- 10 MB per file
    array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  )
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- =============================================================================
--  STEP 3: site-assets storage policies
-- =============================================================================

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
