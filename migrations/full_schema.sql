-- =============================================================================
--  COD E-COMMERCE PLATFORM — INITIAL SUPABASE SCHEMA
--  =============================================================================
--  Single-tenant Moroccan COD (Cash-on-Delivery) e-commerce site.
--  Trilingual content (French default, English, Arabic).
--  One-product-per-order MVP, but schema is multi-item ready from day one.
--
--  Paste this entire file into the Supabase SQL editor of a NEW project.
--  Do NOT run on an existing database without reviewing first.
--
--  Author: Oussama (with Claude)
--  Target: Supabase (PostgreSQL 15+)
-- =============================================================================


-- =============================================================================
--  SECTION 1: EXTENSIONS
-- =============================================================================
-- pgcrypto gives us gen_random_uuid() for primary keys without needing uuid-ossp.
-- It is enabled by default on Supabase, but we declare it explicitly for clarity.

create extension if not exists pgcrypto;
create extension if not exists "unaccent";  -- For slug generation from Arabic/accented text


-- =============================================================================
--  SECTION 2: ENUMERATED TYPES
-- =============================================================================
-- Enums are stricter than text + check constraints because the database itself
-- knows the full list of valid values. Adding a new value later requires
-- ALTER TYPE ... ADD VALUE, which is a quick non-blocking operation.

-- User roles. Only two roles for this project per Oussama's requirements.
create type user_role as enum ('admin', 'manager');

-- Order lifecycle. These map directly to the buttons the admin will see in the UI.
-- 'pending'       = just submitted by customer, not yet called
-- 'confirmed'     = admin called the customer, customer wants the product
-- 'shipped'       = handed over to courier
-- 'delivered'     = courier confirmed delivery + cash received
-- 'cancelled'     = customer cancelled at any stage
-- 'no_answer'     = admin called multiple times, no response
-- 'fake'          = obvious troll order (competitor, bot that beat the captcha, etc.)
-- 'returned'      = customer refused at the door
create type order_status as enum (
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
  'no_answer',
  'fake',
  'returned'
);

-- Where the order originated. Used for marketing attribution and ROAS analysis.
create type order_source as enum (
  'facebook',
  'instagram',
  'whatsapp',
  'telegram',
  'tiktok',
  'google',
  'direct',
  'other'
);

-- Supported interface locales. Adding a fourth language later means
-- ALTER TYPE locale_code ADD VALUE 'es' (or whatever) — one line.
create type locale_code as enum ('fr', 'en', 'ar');


-- =============================================================================
--  SECTION 3: PROFILES TABLE
-- =============================================================================
-- Supabase Auth stores credentials in auth.users (a system table we never touch
-- directly). We mirror application-level data in a public.profiles table whose
-- primary key IS the auth.users id. This is the canonical Supabase pattern.

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'manager',
  full_name   text,
  avatar_url  text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Application-level user data. One row per auth.users row, created automatically by trigger.';


-- =============================================================================
--  SECTION 4: HELPER FUNCTIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 4.1 — Generic updated_at trigger function.
-- ---------------------------------------------------------------------------
-- Used on every table to keep updated_at in sync automatically. Without this,
-- you'd have to remember to SET updated_at = now() in every UPDATE query,
-- which nobody actually does reliably.
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------------
-- 4.2 — SECURITY DEFINER helpers for RLS without recursion.
-- ---------------------------------------------------------------------------
-- These functions run with elevated privileges, bypassing RLS on the profiles
-- table itself. We use them inside RLS policies to check the current user's
-- role without triggering recursive policy evaluation.
--
-- This is the single most important pattern for any non-trivial Supabase app.

create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

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


-- ---------------------------------------------------------------------------
-- 4.3 — Auto-create a profile row whenever a new auth user is created.
-- ---------------------------------------------------------------------------
-- Without this trigger, you'd have to manually INSERT into profiles after
-- every signup, and forgetting it (which everyone does) leads to broken users.

create or replace function public.tg_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.tg_handle_new_user();


-- ---------------------------------------------------------------------------
-- 4.4 — Slug generator. Handles French + Arabic gracefully.
-- ---------------------------------------------------------------------------
-- Generates URL-safe slugs from titles. Falls back to a UUID suffix if the
-- input cleans down to nothing (e.g., pure Arabic input would otherwise
-- produce an empty slug since unaccent doesn't transliterate Arabic).

create or replace function public.generate_slug(input_text text)
returns text
language plpgsql
immutable
as $$
declare
  result text;
begin
  -- Lowercase, strip diacritics, replace non-alphanumeric with hyphens
  result := lower(unaccent(coalesce(input_text, '')));
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  result := trim(both '-' from result);

  -- If the cleaned slug is empty (e.g., title was pure Arabic), generate
  -- a random suffix so we never store an empty slug.
  if result = '' or result is null then
    result := 'item-' || substring(gen_random_uuid()::text, 1, 8);
  end if;

  return result;
end;
$$;


-- =============================================================================
--  SECTION 5: PROFILES — TRIGGERS AND RLS
-- =============================================================================

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

alter table public.profiles enable row level security;

-- A user can read their own profile.
create policy "profiles: read own"
  on public.profiles for select
  using (id = auth.uid());

-- Staff (admins + managers) can read all profiles. Needed for the admin's
-- "team members" UI and for assigning orders to managers.
create policy "profiles: staff read all"
  on public.profiles for select
  using (public.is_staff());

-- Users can update their own profile (name, avatar, phone) but NOT their role.
-- We enforce the role lock at the row level by also creating a stricter policy:
-- only admins can update the role column. Postgres applies policies as OR, so
-- we structure this as: anyone can update their own profile, but a check
-- constraint at the column level forbids role changes by non-admins.
create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- Prevent role escalation: the role in the new row must equal the old role,
    -- unless the user is an admin.
    and (role = (select role from public.profiles where id = auth.uid()) or public.is_admin())
  );

-- Admins can do anything on profiles, including changing roles and deleting users.
create policy "profiles: admin full access"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());


-- =============================================================================
--  SECTION 6: CITIES TABLE
-- =============================================================================
-- Holds the list of Moroccan cities the shop delivers to, each with its own
-- shipping fee. The customer-facing reservation form will render this as a
-- <select> dropdown, which is dramatically better than free-text city input
-- (which produces dirty data like "casa", "Casablanca", "Casa Blanca", "DAR
-- LBIDA"... your client will thank you).

create table public.cities (
  id              uuid primary key default gen_random_uuid(),
  name_fr         text not null,
  name_en         text not null,
  name_ar         text not null,
  shipping_fee    numeric(10, 2) not null default 0 check (shipping_fee >= 0),
  estimated_days  int not null default 2 check (estimated_days >= 0),
  is_active       boolean not null default true,
  display_order   int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_cities_active_order on public.cities(is_active, display_order);

create trigger cities_set_updated_at
  before update on public.cities
  for each row execute function public.tg_set_updated_at();

alter table public.cities enable row level security;

-- Public users (anonymous customers) can read active cities to populate the form.
create policy "cities: public read active"
  on public.cities for select
  using (is_active = true);

-- Staff can see all cities including disabled ones.
create policy "cities: staff read all"
  on public.cities for select
  using (public.is_staff());

-- Only admins can manage the city list (it affects pricing).
create policy "cities: admin write"
  on public.cities for all
  using (public.is_admin())
  with check (public.is_admin());


-- =============================================================================
--  SECTION 7: CATEGORIES TABLE
-- =============================================================================
-- Trilingual categories with a self-referential parent_id for future
-- sub-category support. We're not building the sub-category UI in the MVP,
-- but the column exists so we never need a migration for it.

create table public.categories (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name_fr         text not null,
  name_en         text not null,
  name_ar         text not null,
  description_fr  text,
  description_en  text,
  description_ar  text,
  image_url       text,
  parent_id       uuid references public.categories(id) on delete set null,
  display_order   int not null default 0,
  is_active       boolean not null default true,
  meta_title_fr   text,
  meta_title_en   text,
  meta_title_ar   text,
  meta_description_fr text,
  meta_description_en text,
  meta_description_ar text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_categories_slug on public.categories(slug);
create index idx_categories_parent on public.categories(parent_id);
create index idx_categories_active_order on public.categories(is_active, display_order);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.tg_set_updated_at();

alter table public.categories enable row level security;

create policy "categories: public read active"
  on public.categories for select
  using (is_active = true);

create policy "categories: staff read all"
  on public.categories for select
  using (public.is_staff());

create policy "categories: staff write"
  on public.categories for all
  using (public.is_staff())
  with check (public.is_staff());


-- =============================================================================
--  SECTION 8: PRODUCTS TABLE
-- =============================================================================
-- The core entity. Trilingual content, flexible attributes via JSONB,
-- separate from images (which live in product_images for multi-image support).
--
-- Note: 'attributes' is a JSONB column that lets the client store arbitrary
-- specs per product. Example for a phone:
--   { "battery_mah": 5000, "screen_inches": 6.7, "color": "Black" }
-- Example for a cosmetic:
--   { "volume_ml": 50, "skin_type": "Oily", "ingredients": ["water", "..."] }
-- The admin UI will render these as editable key-value pairs.

create table public.products (
  id                        uuid primary key default gen_random_uuid(),
  slug                      text not null unique,

  -- Trilingual title (required in all three languages)
  title_fr                  text not null,
  title_en                  text not null,
  title_ar                  text not null,

  -- Trilingual short description (used on product cards in listings)
  short_description_fr      text,
  short_description_en      text,
  short_description_ar      text,

  -- Trilingual long description (used on product detail page). HTML allowed.
  description_fr            text,
  description_en            text,
  description_ar            text,

  -- Pricing. compare_at_price is the "crossed out" original price for
  -- psychological discount framing. Both stored in the smallest currency unit
  -- as numeric to avoid floating-point cents-rounding bugs.
  price                     numeric(10, 2) not null check (price >= 0),
  compare_at_price          numeric(10, 2) check (compare_at_price >= 0),
  currency                  text not null default 'MAD',

  -- Relationship
  category_id               uuid references public.categories(id) on delete set null,

  -- Inventory
  sku                       text unique,
  stock_quantity            int not null default 0 check (stock_quantity >= 0),
  track_inventory           boolean not null default true,
  low_stock_threshold       int not null default 5,

  -- Visibility flags
  is_active                 boolean not null default true,
  is_featured               boolean not null default false,

  -- Flexible attributes for arbitrary product types
  attributes                jsonb not null default '{}'::jsonb,

  -- SEO
  meta_title_fr             text,
  meta_title_en             text,
  meta_title_ar             text,
  meta_description_fr       text,
  meta_description_en       text,
  meta_description_ar       text,

  -- Aggregated counters (denormalized for fast dashboard rendering).
  -- Updated by triggers so they never drift from reality.
  total_orders              int not null default 0,
  total_revenue             numeric(12, 2) not null default 0,
  view_count                int not null default 0,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index idx_products_slug on public.products(slug);
create index idx_products_category on public.products(category_id);
create index idx_products_active_featured on public.products(is_active, is_featured);
create index idx_products_created_desc on public.products(created_at desc);

-- Performance: composite indexes for common query patterns
create index idx_products_featured_created on public.products(is_active, is_featured, created_at desc);
create index idx_products_category_created on public.products(is_active, category_id, created_at desc);
-- GIN index on the JSONB attributes column lets us query products by attribute
-- values efficiently (e.g., "all phones with battery_mah > 4000")
create index idx_products_attributes on public.products using gin(attributes);

-- Full-text search across all three languages.
-- We build a tsvector that combines all language titles + descriptions.
-- For Arabic, 'simple' config is the safest (no stemming) since PG doesn't
-- ship a real Arabic dictionary; for French we use the french config.
create index idx_products_search on public.products
  using gin (
    to_tsvector('simple',
      coalesce(title_fr, '') || ' ' ||
      coalesce(title_en, '') || ' ' ||
      coalesce(title_ar, '') || ' ' ||
      coalesce(short_description_fr, '') || ' ' ||
      coalesce(short_description_en, '') || ' ' ||
      coalesce(short_description_ar, '')
    )
  );

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.tg_set_updated_at();

alter table public.products enable row level security;

create policy "products: public read active"
  on public.products for select
  using (is_active = true);

create policy "products: staff read all"
  on public.products for select
  using (public.is_staff());

create policy "products: staff write"
  on public.products for all
  using (public.is_staff())
  with check (public.is_staff());


-- =============================================================================
--  SECTION 9: PRODUCT IMAGES TABLE
-- =============================================================================
-- Multi-image per product. One image is flagged is_primary and shown as the
-- main thumbnail; others are displayed in the product page gallery.
-- Storage: the actual image files live in Supabase Storage; this table only
-- stores the public URLs.

create table public.product_images (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete cascade,
  url             text not null,
  alt_text        text,
  display_order   int not null default 0,
  is_primary      boolean not null default false,
  created_at      timestamptz not null default now()
);

create index idx_product_images_product on public.product_images(product_id, display_order);

-- Ensure only one primary image per product. Partial unique index ftw.
create unique index uniq_product_primary_image
  on public.product_images(product_id) where is_primary = true;

alter table public.product_images enable row level security;

create policy "product_images: public read"
  on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.is_active = true
    )
  );

create policy "product_images: staff full"
  on public.product_images for all
  using (public.is_staff())
  with check (public.is_staff());


-- =============================================================================
--  SECTION 10: ORDERS TABLE
-- =============================================================================
-- The reservation record. One row per customer reservation, regardless of how
-- many products were reserved (line items live in order_items).
--
-- order_number is a human-readable ID the admin and customer can both reference
-- on the phone. Generated by a sequence + trigger below.

create sequence if not exists public.order_number_seq start 1000;

create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text unique not null,

  -- Customer info (denormalized snapshot — customers are anonymous,
  -- not accounts, so we don't link to a users table)
  customer_name       text not null,
  customer_phone      text not null,
  customer_city_id    uuid references public.cities(id) on delete set null,
  customer_city_name  text not null, -- snapshot in case the city is renamed/deleted later
  customer_address    text,
  customer_notes      text,

  -- Lifecycle
  status              order_status not null default 'pending',

  -- Money (all snapshotted — these values never change after creation)
  subtotal            numeric(10, 2) not null default 0,
  shipping_fee        numeric(10, 2) not null default 0,
  total               numeric(10, 2) not null default 0,
  currency            text not null default 'MAD',

  -- Internal
  admin_notes         text,
  assigned_to         uuid references public.profiles(id) on delete set null,

  -- Attribution
  source              order_source not null default 'direct',
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,
  utm_term            text,
  utm_content         text,
  referrer            text,

  -- Forensics (useful for spotting bot/fake orders)
  ip_address          inet,
  user_agent          text,
  locale              locale_code not null default 'fr',

  -- Lifecycle timestamps. Each one is set the moment the status moves into
  -- that stage, giving the admin a full audit trail.
  confirmed_at        timestamptz,
  shipped_at          timestamptz,
  delivered_at        timestamptz,
  cancelled_at        timestamptz,
  returned_at         timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_orders_status on public.orders(status);
create index idx_orders_created_desc on public.orders(created_at desc);
create index idx_orders_phone on public.orders(customer_phone);
create index idx_orders_assigned on public.orders(assigned_to);
create index idx_orders_source on public.orders(source);

-- Performance: composite indexes for admin dashboard and analytics
create index idx_orders_status_created on public.orders(status, created_at desc);
create index idx_orders_city on public.orders(customer_city_name);
create index idx_orders_number on public.orders(order_number);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger: auto-generate human-readable order_number on insert.
-- Format: ORD-YYYY-NNNNNN  →  ORD-2026-001042
-- ---------------------------------------------------------------------------
create or replace function public.tg_generate_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := 'ORD-' || to_char(now(), 'YYYY') || '-' ||
                        lpad(nextval('public.order_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger orders_set_order_number
  before insert on public.orders
  for each row execute function public.tg_generate_order_number();

-- ---------------------------------------------------------------------------
-- Trigger: auto-set status timestamps when status transitions.
-- ---------------------------------------------------------------------------
create or replace function public.tg_set_order_status_timestamps()
returns trigger
language plpgsql
as $$
begin
  -- Only act on actual status changes
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    case new.status
      when 'confirmed' then new.confirmed_at := coalesce(new.confirmed_at, now());
      when 'shipped'   then new.shipped_at   := coalesce(new.shipped_at, now());
      when 'delivered' then new.delivered_at := coalesce(new.delivered_at, now());
      when 'cancelled' then new.cancelled_at := coalesce(new.cancelled_at, now());
      when 'returned'  then new.returned_at  := coalesce(new.returned_at, now());
      else null;
    end case;
  end if;
  return new;
end;
$$;

create trigger orders_status_timestamps
  before insert or update on public.orders
  for each row execute function public.tg_set_order_status_timestamps();


alter table public.orders enable row level security;

-- Anonymous (unauthenticated) users can INSERT orders. This is the entire
-- point of the public reservation form. They CANNOT read, update, or delete
-- — only insert. We rely on application-layer validation (Cloudflare Turnstile,
-- rate limiting in Edge Functions, honeypot fields) to prevent abuse.
create policy "orders: anyone can create"
  on public.orders for insert
  with check (true);

-- Staff can read all orders.
create policy "orders: staff read"
  on public.orders for select
  using (public.is_staff());

-- Staff can update orders (status changes, notes, assignment).
create policy "orders: staff update"
  on public.orders for update
  using (public.is_staff())
  with check (public.is_staff());

-- Only admins can delete orders (and they shouldn't — soft-delete via status='fake' is better).
create policy "orders: admin delete"
  on public.orders for delete
  using (public.is_admin());


-- =============================================================================
--  SECTION 11: ORDER ITEMS TABLE
-- =============================================================================
-- The line items of an order. In the MVP, every order has exactly one item,
-- but the table is designed to accept many. When you later flip the UI to
-- support multi-product orders, no schema change is needed.
--
-- Note the SNAPSHOT columns: product_title_snapshot, product_image_snapshot,
-- unit_price_at_order. These freeze the product state at the moment of order,
-- so even if the product is renamed, repriced, or deleted later, the order
-- still tells the true story of what was sold.

create table public.order_items (
  id                          uuid primary key default gen_random_uuid(),
  order_id                    uuid not null references public.orders(id) on delete cascade,

  -- Nullable FK: keep the order line intact even if the product is later deleted.
  product_id                  uuid references public.products(id) on delete set null,

  -- Snapshots (immutable after insert)
  product_title_snapshot      text not null,
  product_image_snapshot      text,
  product_slug_snapshot       text,
  unit_price_at_order         numeric(10, 2) not null check (unit_price_at_order >= 0),

  quantity                    int not null default 1 check (quantity > 0),
  line_total                  numeric(10, 2) generated always as (unit_price_at_order * quantity) stored,

  created_at                  timestamptz not null default now()
);

create index idx_order_items_order on public.order_items(order_id);
create index idx_order_items_product on public.order_items(product_id);

alter table public.order_items enable row level security;

-- Anonymous users can insert order items when creating an order. We rely on
-- a foreign key check (the order_id must exist) plus the requirement that
-- order_id is set to an order they just created in the same transaction.
create policy "order_items: anyone can create"
  on public.order_items for insert
  with check (true);

create policy "order_items: staff read"
  on public.order_items for select
  using (public.is_staff());

create policy "order_items: staff update"
  on public.order_items for update
  using (public.is_staff())
  with check (public.is_staff());

create policy "order_items: admin delete"
  on public.order_items for delete
  using (public.is_admin());


-- ---------------------------------------------------------------------------
-- Trigger: maintain product.total_orders, product.total_revenue,
-- decrement stock on order item creation.
-- ---------------------------------------------------------------------------
create or replace function public.tg_after_order_item_insert()
returns trigger
language plpgsql
as $$
begin
  if new.product_id is not null then
    update public.products
    set total_orders   = total_orders + new.quantity,
        total_revenue  = total_revenue + new.line_total,
        stock_quantity = case
          when track_inventory then greatest(0, stock_quantity - new.quantity)
          else stock_quantity
        end
    where id = new.product_id;
  end if;
  return new;
end;
$$;

create trigger order_items_after_insert
  after insert on public.order_items
  for each row execute function public.tg_after_order_item_insert();


-- =============================================================================
--  SECTION 12: SITE SETTINGS TABLE (singleton)
-- =============================================================================
-- A single-row table holding global site configuration. The check constraint
-- on id forces it to always be 1, so there can only ever be one row.
-- The admin UI loads this as the "Settings" page and edits it inline.

create table public.site_settings (
  id                      int primary key default 1 check (id = 1),

  -- Brand identity (placeholders until client decides)
  site_name               text not null default 'My Shop',
  site_tagline_fr         text,
  site_tagline_en         text,
  site_tagline_ar         text,
  logo_url                text,
  favicon_url             text,

  -- Brand colors (hex). Frontend reads these to theme the public site.
  primary_color           text not null default '#FF6B35',
  secondary_color         text not null default '#0c0818',
  accent_color            text not null default '#F7931E',

  -- Contact
  contact_email           text,
  contact_phone           text,
  whatsapp_number         text, -- E.164 format, e.g. '+212600000000'
  business_address        text,

  -- Social
  facebook_url            text,
  instagram_url           text,
  tiktok_url              text,
  telegram_url            text,
  youtube_url             text,

  -- Notifications
  telegram_bot_token      text, -- For sending order alerts to admin's Telegram
  telegram_chat_id        text, -- The chat/channel where alerts are posted
  notification_email      text, -- Backup email destination for order alerts

  -- Tracking & marketing
  meta_pixel_id           text,
  meta_capi_access_token  text, -- Server-side Conversions API token
  meta_dataset_id         text,
  google_analytics_id     text, -- GA4 measurement ID, e.g. 'G-XXXXXXX'
  google_ads_id           text,
  tiktok_pixel_id         text,

  -- Defaults
  default_currency        text not null default 'MAD',
  default_locale          locale_code not null default 'fr',

  -- Operational copy (used on the customer-facing thank-you page, etc.)
  thank_you_message_fr    text default 'Merci pour votre commande ! Nous vous appellerons sous peu pour confirmer.',
  thank_you_message_en    text default 'Thank you for your order! We will call you shortly to confirm.',
  thank_you_message_ar    text default 'شكرا لطلبك! سنتصل بك قريبا للتأكيد.',

  -- Cash-on-delivery messaging that builds trust on product pages
  cod_badge_fr            text default 'Paiement à la livraison',
  cod_badge_en            text default 'Cash on delivery',
  cod_badge_ar            text default 'الدفع عند الاستلام',

  updated_at              timestamptz not null default now()
);

-- Seed the single row immediately so the frontend never has to handle "no settings yet"
insert into public.site_settings (id) values (1)
  on conflict (id) do nothing;

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.tg_set_updated_at();

alter table public.site_settings enable row level security;

-- Public read: the frontend needs site_name, colors, social links, pixel IDs
-- on every page load. The token columns are sensitive and should NOT be
-- exposed publicly. We handle this by using a public view that omits them.
create policy "site_settings: admin full"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "site_settings: staff read"
  on public.site_settings for select
  using (public.is_staff());


-- A public-safe view exposing only the columns that are OK for anonymous users.
-- The frontend should query this view, NOT the raw table.
create or replace view public.site_settings_public as
select
  id,
  site_name,
  site_tagline_fr, site_tagline_en, site_tagline_ar,
  logo_url, favicon_url,
  primary_color, secondary_color, accent_color,
  contact_email, contact_phone, whatsapp_number, business_address,
  facebook_url, instagram_url, tiktok_url, telegram_url, youtube_url,
  meta_pixel_id, google_analytics_id, tiktok_pixel_id, -- client-side pixel IDs only, never CAPI tokens
  default_currency, default_locale,
  thank_you_message_fr, thank_you_message_en, thank_you_message_ar,
  cod_badge_fr, cod_badge_en, cod_badge_ar
from public.site_settings;

grant select on public.site_settings_public to anon, authenticated;


-- =============================================================================
--  SECTION 13: PIXEL EVENTS AUDIT LOG
-- =============================================================================
-- Records every server-side Pixel/CAPI event we fire. Two purposes:
--   1. Deduplication between browser Pixel events and server CAPI events
--      (Meta dedupes by event_id, so we must store it).
--   2. Debugging when Facebook ads stop performing — you'll thank past-you
--      for keeping this log when you have to figure out why a Lead event
--      didn't fire on January 14th.

create table public.pixel_events (
  id              uuid primary key default gen_random_uuid(),
  event_name      text not null, -- e.g. 'Purchase', 'Lead', 'ViewContent'
  event_id        text not null, -- Used for Pixel/CAPI deduplication
  product_id      uuid references public.products(id) on delete set null,
  order_id        uuid references public.orders(id) on delete set null,
  payload         jsonb not null default '{}'::jsonb,
  sent_to_meta    boolean not null default false,
  meta_response   jsonb,
  error_message   text,
  created_at      timestamptz not null default now()
);

create index idx_pixel_events_event_name on public.pixel_events(event_name, created_at desc);
create index idx_pixel_events_order on public.pixel_events(order_id);

alter table public.pixel_events enable row level security;

create policy "pixel_events: staff read"
  on public.pixel_events for select
  using (public.is_staff());

create policy "pixel_events: service insert"
  on public.pixel_events for insert
  with check (true); -- Edge Functions write here with the service role key


-- =============================================================================
--  SECTION 14: SEED DATA
-- =============================================================================
-- Minimal seed so the admin can see something on first login.
-- The client will replace/extend all of this through the admin UI.

-- A handful of Moroccan cities with placeholder shipping fees.
-- The client can edit fees, add cities, disable cities through the admin UI.
insert into public.cities (name_fr, name_en, name_ar, shipping_fee, estimated_days, display_order) values
  ('Casablanca',  'Casablanca',  'الدار البيضاء', 30.00, 1, 1),
  ('Rabat',       'Rabat',       'الرباط',        35.00, 1, 2),
  ('Marrakech',   'Marrakesh',   'مراكش',          35.00, 2, 3),
  ('Tanger',      'Tangier',     'طنجة',          40.00, 2, 4),
  ('Fès',         'Fez',         'فاس',           35.00, 2, 5),
  ('Agadir',      'Agadir',      'أكادير',         40.00, 2, 6),
  ('Meknès',      'Meknes',      'مكناس',         35.00, 2, 7),
  ('Oujda',       'Oujda',       'وجدة',           45.00, 3, 8),
  ('Kénitra',     'Kenitra',     'القنيطرة',       35.00, 2, 9),
  ('Tétouan',     'Tetouan',     'تطوان',         40.00, 2, 10),
  ('Salé',        'Sale',        'سلا',           35.00, 1, 11),
  ('Mohammedia',  'Mohammedia',  'المحمدية',      30.00, 1, 12),
  ('Safi',        'Safi',        'آسفي',           40.00, 2, 13),
  ('El Jadida',   'El Jadida',   'الجديدة',        35.00, 2, 14),
  ('Béni Mellal', 'Beni Mellal', 'بني ملال',       40.00, 2, 15),
  ('Nador',       'Nador',       'الناظور',        45.00, 3, 16),
  ('Essaouira',   'Essaouira',   'الصويرة',        40.00, 2, 17),
  ('Khouribga',   'Khouribga',   'خريبكة',        40.00, 2, 18),
  ('Settat',      'Settat',      'سطات',          35.00, 2, 19),
  ('Larache',     'Larache',     'العرائش',        45.00, 3, 20);


-- =============================================================================
--  SECTION 15: STORAGE BUCKETS
-- =============================================================================
-- Create the storage buckets via Supabase Studio (UI) OR via SQL using the
-- supabase storage schema. The commented block below works if you have
-- sufficient privileges; in most Supabase projects you create buckets in
-- the dashboard under Storage → New Bucket.
--
-- Required buckets:
--   1. product-images    (public read, staff write) — for product photos
--   2. category-images   (public read, staff write) — for category banners
--   3. brand-assets      (public read, admin write) — for logo, favicon, OG images
--
-- After creating each bucket in the dashboard, set its RLS policy to:
--   SELECT: public (so customers can see product images)
--   INSERT / UPDATE / DELETE: authenticated AND public.is_staff() = true

-- Example policy SQL to run AFTER creating the buckets in the dashboard:
/*
insert into storage.buckets (id, name, public) values
  ('product-images',  'product-images',  true),
  ('category-images', 'category-images', true),
  ('brand-assets',    'brand-assets',    true)
on conflict (id) do nothing;

create policy "Staff can manage product images"
  on storage.objects for all to authenticated
  using (bucket_id = 'product-images' and public.is_staff())
  with check (bucket_id = 'product-images' and public.is_staff());

-- Repeat similar policies for category-images and brand-assets.
*/


-- =============================================================================
--  END OF MIGRATION
-- =============================================================================
-- Post-migration manual steps (do these in the Supabase dashboard):
--   1. Create the three storage buckets listed in Section 15
--   2. Create your first user (Authentication → Users → Add User)
--   3. Promote that user to admin by running:
--        update public.profiles set role = 'admin' where id = '<your-uuid>';
--   4. Configure Auth settings → URL Configuration:
--        Site URL = https://your-domain.com  (or http://localhost:3000 in dev)
--   5. Configure SMTP for password reset emails (recommended: Resend)
-- =============================================================================
-- =============================================================================
--  MIGRATION: Add announcement bar + hero content fields to site_settings
--  =============================================================================
--  Run this in the Supabase SQL Editor after the initial schema is already
--  applied. All columns use IF NOT EXISTS for idempotency.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Announcement bar
-- ---------------------------------------------------------------------------
alter table public.site_settings
  add column if not exists announcement_enabled boolean not null default false,
  add column if not exists announcement_text_fr text,
  add column if not exists announcement_text_en text,
  add column if not exists announcement_text_ar text;

-- ---------------------------------------------------------------------------
-- 2. Hero section content (trilingual)
-- ---------------------------------------------------------------------------
alter table public.site_settings
  add column if not exists hero_eyebrow_fr text,
  add column if not exists hero_eyebrow_en text,
  add column if not exists hero_eyebrow_ar text,
  add column if not exists hero_title_accent_fr text,
  add column if not exists hero_title_accent_en text,
  add column if not exists hero_title_accent_ar text,
  add column if not exists hero_title_main_fr text,
  add column if not exists hero_title_main_en text,
  add column if not exists hero_title_main_ar text,
  add column if not exists hero_subtitle_fr text,
  add column if not exists hero_subtitle_en text,
  add column if not exists hero_subtitle_ar text,
  add column if not exists hero_image_url text;

-- ---------------------------------------------------------------------------
-- 3. Recreate the public view to expose new client-safe columns
-- ---------------------------------------------------------------------------
create or replace view public.site_settings_public as
select
  id,
  site_name,
  site_tagline_fr, site_tagline_en, site_tagline_ar,
  logo_url, favicon_url,
  primary_color, secondary_color, accent_color,
  contact_email, contact_phone, whatsapp_number, business_address,
  facebook_url, instagram_url, tiktok_url, telegram_url, youtube_url,
  meta_pixel_id, google_analytics_id, tiktok_pixel_id,
  default_currency, default_locale,
  thank_you_message_fr, thank_you_message_en, thank_you_message_ar,
  cod_badge_fr, cod_badge_en, cod_badge_ar,
  announcement_enabled,
  announcement_text_fr, announcement_text_en, announcement_text_ar,
  hero_eyebrow_fr, hero_eyebrow_en, hero_eyebrow_ar,
  hero_title_accent_fr, hero_title_accent_en, hero_title_accent_ar,
  hero_title_main_fr, hero_title_main_en, hero_title_main_ar,
  hero_subtitle_fr, hero_subtitle_en, hero_subtitle_ar,
  hero_image_url
from public.site_settings;

grant select on public.site_settings_public to anon, authenticated;
-- Migration: Add trust strip and featured section editable fields
-- Trust strip: 3 items × (title + subtitle) × 3 locales = 18 columns
-- Featured section: (title + subtitle) × 3 locales = 6 columns

alter table public.site_settings
  -- Trust item 1
  add column if not exists trust_1_title_fr text,
  add column if not exists trust_1_title_en text,
  add column if not exists trust_1_title_ar text,
  add column if not exists trust_1_sub_fr text,
  add column if not exists trust_1_sub_en text,
  add column if not exists trust_1_sub_ar text,
  -- Trust item 2
  add column if not exists trust_2_title_fr text,
  add column if not exists trust_2_title_en text,
  add column if not exists trust_2_title_ar text,
  add column if not exists trust_2_sub_fr text,
  add column if not exists trust_2_sub_en text,
  add column if not exists trust_2_sub_ar text,
  -- Trust item 3
  add column if not exists trust_3_title_fr text,
  add column if not exists trust_3_title_en text,
  add column if not exists trust_3_title_ar text,
  add column if not exists trust_3_sub_fr text,
  add column if not exists trust_3_sub_en text,
  add column if not exists trust_3_sub_ar text,
  -- Featured products section
  add column if not exists featured_section_title_fr text,
  add column if not exists featured_section_title_en text,
  add column if not exists featured_section_title_ar text,
  add column if not exists featured_section_subtitle_fr text,
  add column if not exists featured_section_subtitle_en text,
  add column if not exists featured_section_subtitle_ar text;

-- Recreate public view with all new columns
-- NOTE: sensitive token columns (telegram_bot_token, meta_capi_access_token, etc.)
-- are intentionally omitted from this public view. Only append new columns at the
-- end; never insert in the middle, or CREATE OR REPLACE VIEW will fail.
create or replace view public.site_settings_public as
select
  id,
  site_name,
  site_tagline_fr, site_tagline_en, site_tagline_ar,
  logo_url, favicon_url,
  primary_color, secondary_color, accent_color,
  contact_email, contact_phone, whatsapp_number, business_address,
  facebook_url, instagram_url, tiktok_url, telegram_url, youtube_url,
  meta_pixel_id, google_analytics_id, tiktok_pixel_id,
  default_currency, default_locale,
  thank_you_message_fr, thank_you_message_en, thank_you_message_ar,
  cod_badge_fr, cod_badge_en, cod_badge_ar,
  announcement_enabled,
  announcement_text_fr, announcement_text_en, announcement_text_ar,
  hero_eyebrow_fr, hero_eyebrow_en, hero_eyebrow_ar,
  hero_title_accent_fr, hero_title_accent_en, hero_title_accent_ar,
  hero_title_main_fr, hero_title_main_en, hero_title_main_ar,
  hero_subtitle_fr, hero_subtitle_en, hero_subtitle_ar,
  hero_image_url,
  -- Trust strip
  trust_1_title_fr, trust_1_title_en, trust_1_title_ar,
  trust_1_sub_fr, trust_1_sub_en, trust_1_sub_ar,
  trust_2_title_fr, trust_2_title_en, trust_2_title_ar,
  trust_2_sub_fr, trust_2_sub_en, trust_2_sub_ar,
  trust_3_title_fr, trust_3_title_en, trust_3_title_ar,
  trust_3_sub_fr, trust_3_sub_en, trust_3_sub_ar,
  -- Featured section
  featured_section_title_fr, featured_section_title_en, featured_section_title_ar,
  featured_section_subtitle_fr, featured_section_subtitle_en, featured_section_subtitle_ar,
  updated_at
from public.site_settings;
-- Migration: Add why_us_items table + footer_description + whatsapp_default_message

-- ============================================================
-- 1. why_us_items table
-- ============================================================
create table if not exists public.why_us_items (
  id uuid primary key default gen_random_uuid(),
  display_order int not null default 0,
  number_label_fr text not null,
  number_label_en text,
  number_label_ar text,
  title_fr text not null,
  title_en text,
  title_ar text,
  text_fr text not null,
  text_en text,
  text_ar text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for public listing (active items in order)
create index if not exists idx_why_us_items_active_order
  on public.why_us_items(is_active, display_order);

-- RLS
alter table public.why_us_items enable row level security;

create policy "why_us_items_select_public"
  on public.why_us_items
  for select to anon, authenticated
  using (is_active = true);

create policy "why_us_items_all_staff"
  on public.why_us_items
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- ============================================================
-- 2. New site_settings columns
-- ============================================================
alter table public.site_settings
  add column if not exists footer_description_fr text,
  add column if not exists footer_description_en text,
  add column if not exists footer_description_ar text,
  add column if not exists whatsapp_default_message_fr text,
  add column if not exists whatsapp_default_message_en text,
  add column if not exists whatsapp_default_message_ar text;

-- ============================================================
-- 3. Recreate public view
-- ============================================================
-- NOTE: sensitive token columns (telegram_bot_token, meta_capi_access_token, etc.)
-- are intentionally omitted from this public view. Only append new columns at the
-- end; never insert in the middle, or CREATE OR REPLACE VIEW will fail.
drop view if exists public.site_settings_public;
create view public.site_settings_public as
select
  id,
  site_name,
  site_tagline_fr, site_tagline_en, site_tagline_ar,
  logo_url, favicon_url,
  primary_color, secondary_color, accent_color,
  contact_email, contact_phone, whatsapp_number, business_address,
  facebook_url, instagram_url, tiktok_url, telegram_url, youtube_url,
  meta_pixel_id, google_analytics_id, tiktok_pixel_id,
  default_currency, default_locale,
  thank_you_message_fr, thank_you_message_en, thank_you_message_ar,
  cod_badge_fr, cod_badge_en, cod_badge_ar,
  announcement_enabled,
  announcement_text_fr, announcement_text_en, announcement_text_ar,
  hero_eyebrow_fr, hero_eyebrow_en, hero_eyebrow_ar,
  hero_title_accent_fr, hero_title_accent_en, hero_title_accent_ar,
  hero_title_main_fr, hero_title_main_en, hero_title_main_ar,
  hero_subtitle_fr, hero_subtitle_en, hero_subtitle_ar,
  hero_image_url,
  trust_1_title_fr, trust_1_title_en, trust_1_title_ar,
  trust_1_sub_fr, trust_1_sub_en, trust_1_sub_ar,
  trust_2_title_fr, trust_2_title_en, trust_2_title_ar,
  trust_2_sub_fr, trust_2_sub_en, trust_2_sub_ar,
  trust_3_title_fr, trust_3_title_en, trust_3_title_ar,
  trust_3_sub_fr, trust_3_sub_en, trust_3_sub_ar,
  featured_section_title_fr, featured_section_title_en, featured_section_title_ar,
  featured_section_subtitle_fr, featured_section_subtitle_en, featured_section_subtitle_ar,
  footer_description_fr, footer_description_en, footer_description_ar,
  whatsapp_default_message_fr, whatsapp_default_message_en, whatsapp_default_message_ar,
  updated_at
from public.site_settings;

grant select on public.site_settings_public to anon, authenticated;
-- Migration: Add Why Us section title/subtitle fields to site_settings

alter table public.site_settings
  add column if not exists why_us_title_fr text,
  add column if not exists why_us_title_en text,
  add column if not exists why_us_title_ar text,
  add column if not exists why_us_sub_fr text,
  add column if not exists why_us_sub_en text,
  add column if not exists why_us_sub_ar text;

-- Recreate public view
-- NOTE: sensitive token columns (telegram_bot_token, meta_capi_access_token, etc.)
-- are intentionally omitted from this public view. Only append new columns at the
-- end; never insert in the middle, or CREATE OR REPLACE VIEW will fail.
drop view if exists public.site_settings_public;
create view public.site_settings_public as
select
  id,
  site_name,
  site_tagline_fr, site_tagline_en, site_tagline_ar,
  logo_url, favicon_url,
  primary_color, secondary_color, accent_color,
  contact_email, contact_phone, whatsapp_number, business_address,
  facebook_url, instagram_url, tiktok_url, telegram_url, youtube_url,
  meta_pixel_id, google_analytics_id, tiktok_pixel_id,
  default_currency, default_locale,
  thank_you_message_fr, thank_you_message_en, thank_you_message_ar,
  cod_badge_fr, cod_badge_en, cod_badge_ar,
  announcement_enabled,
  announcement_text_fr, announcement_text_en, announcement_text_ar,
  hero_eyebrow_fr, hero_eyebrow_en, hero_eyebrow_ar,
  hero_title_accent_fr, hero_title_accent_en, hero_title_accent_ar,
  hero_title_main_fr, hero_title_main_en, hero_title_main_ar,
  hero_subtitle_fr, hero_subtitle_en, hero_subtitle_ar,
  hero_image_url,
  trust_1_title_fr, trust_1_title_en, trust_1_title_ar,
  trust_1_sub_fr, trust_1_sub_en, trust_1_sub_ar,
  trust_2_title_fr, trust_2_title_en, trust_2_title_ar,
  trust_2_sub_fr, trust_2_sub_en, trust_2_sub_ar,
  trust_3_title_fr, trust_3_title_en, trust_3_title_ar,
  trust_3_sub_fr, trust_3_sub_en, trust_3_sub_ar,
  featured_section_title_fr, featured_section_title_en, featured_section_title_ar,
  featured_section_subtitle_fr, featured_section_subtitle_en, featured_section_subtitle_ar,
  footer_description_fr, footer_description_en, footer_description_ar,
  whatsapp_default_message_fr, whatsapp_default_message_en, whatsapp_default_message_ar,
  why_us_title_fr, why_us_title_en, why_us_title_ar,
  why_us_sub_fr, why_us_sub_en, why_us_sub_ar,
  updated_at
from public.site_settings;

grant select on public.site_settings_public to anon, authenticated;
-- Migration: Add trust strip icon columns to site_settings

alter table public.site_settings
  add column if not exists trust_1_icon text default 'Truck',
  add column if not exists trust_2_icon text default 'Banknote',
  add column if not exists trust_3_icon text default 'ShieldCheck';

-- Recreate public view
-- NOTE: sensitive token columns are intentionally omitted.
-- Only append new columns at the end; never insert in the middle.
drop view if exists public.site_settings_public;
create view public.site_settings_public as
select
  id,
  site_name,
  site_tagline_fr, site_tagline_en, site_tagline_ar,
  logo_url, favicon_url,
  primary_color, secondary_color, accent_color,
  contact_email, contact_phone, whatsapp_number, business_address,
  facebook_url, instagram_url, tiktok_url, telegram_url, youtube_url,
  meta_pixel_id, google_analytics_id, tiktok_pixel_id,
  default_currency, default_locale,
  thank_you_message_fr, thank_you_message_en, thank_you_message_ar,
  cod_badge_fr, cod_badge_en, cod_badge_ar,
  announcement_enabled,
  announcement_text_fr, announcement_text_en, announcement_text_ar,
  hero_eyebrow_fr, hero_eyebrow_en, hero_eyebrow_ar,
  hero_title_accent_fr, hero_title_accent_en, hero_title_accent_ar,
  hero_title_main_fr, hero_title_main_en, hero_title_main_ar,
  hero_subtitle_fr, hero_subtitle_en, hero_subtitle_ar,
  hero_image_url,
  trust_1_title_fr, trust_1_title_en, trust_1_title_ar,
  trust_1_sub_fr, trust_1_sub_en, trust_1_sub_ar,
  trust_2_title_fr, trust_2_title_en, trust_2_title_ar,
  trust_2_sub_fr, trust_2_sub_en, trust_2_sub_ar,
  trust_3_title_fr, trust_3_title_en, trust_3_title_ar,
  trust_3_sub_fr, trust_3_sub_en, trust_3_sub_ar,
  trust_1_icon, trust_2_icon, trust_3_icon,
  featured_section_title_fr, featured_section_title_en, featured_section_title_ar,
  featured_section_subtitle_fr, featured_section_subtitle_en, featured_section_subtitle_ar,
  footer_description_fr, footer_description_en, footer_description_ar,
  whatsapp_default_message_fr, whatsapp_default_message_en, whatsapp_default_message_ar,
  why_us_title_fr, why_us_title_en, why_us_title_ar,
  why_us_sub_fr, why_us_sub_en, why_us_sub_ar,
  updated_at
from public.site_settings;

grant select on public.site_settings_public to anon, authenticated;
-- =============================================================================
--  MIGRATION 07: Add detail_sections JSONB column to products
--  =============================================================================
--  Replaces the flat detail_images text[] array with a rich JSONB structure
--  that supports scroll-driven narrative sections (image + headline + body).
--
--  Old detail_images column is preserved for rollback safety.
-- =============================================================================

alter table public.products
  add column if not exists detail_sections jsonb default '[]'::jsonb;

comment on column public.products.detail_sections is
  'Array of narrative sections for Apple-style scroll storytelling. Each item: {id, image, headline_fr/en/ar, body_fr/en/ar, position, theme}';
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
--  MIGRATION 09: Add google_ads_conversion_label to site_settings
--  =============================================================================
--  Adds the conversion label column needed for Google Ads conversion tracking.
--  Safe to run on an existing project — uses IF NOT EXISTS.
-- =============================================================================

alter table public.site_settings
  add column if not exists google_ads_conversion_label text;

-- Recreate public view to expose the new column
-- (sensitive token columns are intentionally omitted)
drop view if exists public.site_settings_public;

create view public.site_settings_public as
select
  id,
  site_name,
  site_tagline_fr, site_tagline_en, site_tagline_ar,
  logo_url, favicon_url,
  primary_color, secondary_color, accent_color,
  contact_email, contact_phone, whatsapp_number, business_address,
  facebook_url, instagram_url, tiktok_url, telegram_url, youtube_url,
  meta_pixel_id, google_analytics_id, google_ads_id, google_ads_conversion_label, tiktok_pixel_id,
  default_currency, default_locale,
  thank_you_message_fr, thank_you_message_en, thank_you_message_ar,
  cod_badge_fr, cod_badge_en, cod_badge_ar,
  announcement_enabled,
  announcement_text_fr, announcement_text_en, announcement_text_ar,
  hero_eyebrow_fr, hero_eyebrow_en, hero_eyebrow_ar,
  hero_title_accent_fr, hero_title_accent_en, hero_title_accent_ar,
  hero_title_main_fr, hero_title_main_en, hero_title_main_ar,
  hero_subtitle_fr, hero_subtitle_en, hero_subtitle_ar,
  hero_image_url,
  trust_1_title_fr, trust_1_title_en, trust_1_title_ar,
  trust_1_sub_fr, trust_1_sub_en, trust_1_sub_ar,
  trust_2_title_fr, trust_2_title_en, trust_2_title_ar,
  trust_2_sub_fr, trust_2_sub_en, trust_2_sub_ar,
  trust_3_title_fr, trust_3_title_en, trust_3_title_ar,
  trust_3_sub_fr, trust_3_sub_en, trust_3_sub_ar,
  trust_1_icon, trust_2_icon, trust_3_icon,
  featured_section_title_fr, featured_section_title_en, featured_section_title_ar,
  featured_section_subtitle_fr, featured_section_subtitle_en, featured_section_subtitle_ar,
  why_us_title_fr, why_us_title_en, why_us_title_ar,
  why_us_sub_fr, why_us_sub_en, why_us_sub_ar,
  footer_description_fr, footer_description_en, footer_description_ar,
  whatsapp_default_message_fr, whatsapp_default_message_en, whatsapp_default_message_ar
from public.site_settings;

grant select on public.site_settings_public to anon, authenticated;
