# Data Model Changes — Scenario B (clothing store)

Existing tables (keep): `admins`, `products`, `orders`, `order_items`, `reviews`, `banners`, `coupons`, `site_settings`, `conversations`, `messages`, `activity_logs`, `newsletter_subscribers`. RLS posture in `supabase/rls.sql` stays: owner-only orders/items, public read on active catalog, service-role writes, deny-by-default logs.

## Migration 1 — delivery zones + COD rules
```sql
create table if not exists delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null, cities text[] not null default '{}',
  charge numeric not null default 0, free_above numeric not null default 2000,
  cod_allowed boolean not null default true, eta_days text not null default '2-5',
  active boolean not null default true
);
alter table delivery_zones enable row level security;
create policy "zones_public_read" on delivery_zones for select to anon, authenticated using (active = true);
```
Seed: Kathmandu Valley (charge 0/100, COD true, ETA 1-2), Pokhara/Chitwan (100, COD true, 2-3), Rest of Nepal (150, COD false over 5000, 3-5).

## Migration 2 — order returns
```sql
create table if not exists return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid not null, reason text not null, status text not null default 'requested',
  created_at timestamptz default now()
);
alter table return_requests enable row level security;
create policy "returns_owner" on return_requests for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table orders add column if not exists return_status text;
```

## Migration 3 — coupon redemptions (idempotency, fixes bug-audit #18)
```sql
create table if not exists coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_code text not null, order_id uuid not null unique references orders(id) on delete cascade,
  created_at timestamptz default now()
);
```
Increment `coupons.used_count` only on successful insert into this table.

## Migration 4 — atomic stock (fixes N4-oversell)
```sql
create or replace function decrement_stock(p_product uuid, p_qty int)
returns boolean language plpgsql as $$
declare ok boolean;
begin
  update products set stock = stock - p_qty
  where id = p_product and stock >= p_qty returning true into ok;
  return coalesce(ok, false);
end $$;
```
Call via service role from `verify` + `decrement-stock` routes.

## Migration 5 — product slugs (SEO)
`alter table products add column if not exists slug text unique;` backfill from names; canonical `/products/[id]` keeps working, slug added to metadata/OG later.

All migrations idempotent + re-runnable. Seed/demo data stays in `scripts/` + `supabase/seed-catalog.sql`, never in migrations.
