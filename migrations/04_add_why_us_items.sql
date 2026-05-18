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
