-- Phase 1 FIX-05: idempotent coupon use. Run once in Supabase Dashboard > SQL Editor.
-- One row per order; order_id UNIQUE stops repeat finalize/verify calls double-counting used_count.
-- RLS enabled with no policies = deny-by-default; service-role API routes bypass RLS for writes.

create table if not exists coupon_redemptions (
  coupon_code text not null,
  order_id uuid not null unique references orders(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table coupon_redemptions enable row level security;
