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
