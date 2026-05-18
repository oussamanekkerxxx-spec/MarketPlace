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
