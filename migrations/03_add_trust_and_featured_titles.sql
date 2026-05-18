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
