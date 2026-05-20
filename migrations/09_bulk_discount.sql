-- ============================================
-- MIGRATION 09: Bulk Quantity Discount
-- ============================================

alter table public.products
  add column if not exists bulk_discount_threshold int check (bulk_discount_threshold >= 2),
  add column if not exists bulk_discount_percent numeric(5,2) check (bulk_discount_percent > 0 and bulk_discount_percent <= 100);

alter table public.orders
  add column if not exists discount_percent numeric(5,2) default 0,
  add column if not exists discount_amount numeric(10,2) default 0;
