-- Doko Pasal: coupons + checkout stock wiring. Run once in Supabase Dashboard > SQL Editor.
-- Safe to re-run (IF NOT EXISTS / idempotent policies assumed from supabase/rls.sql).

-- Orders must carry the applied coupon (already read by app/admin/orders/page.tsx).
alter table orders add column if not exists coupon_code text;
alter table orders add column if not exists discount_amount numeric not null default 0;

-- Coupons usage counter (seed data already writes used_count; ensures it exists).
alter table coupons add column if not exists used_count integer not null default 0;

-- NOTE: products.stock is public-read-only per supabase/rls.sql, so stock
-- decrements run via service-role API routes (verify success blocks for
-- khalti/esewa, /api/decrement-stock for COD/bank), never anon update.
