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
