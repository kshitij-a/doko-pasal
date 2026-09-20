-- Phase 2 commerce: delivery zones, returns, loyalty. Run once in Supabase Dashboard > SQL Editor.
-- Safe to re-run (IF NOT EXISTS / idempotent seeds / drop-policy loop).

-- 1. Delivery zones -----------------------------------------------------------
create table if not exists delivery_zones (
  id uuid not null default gen_random_uuid() primary key,
  name text not null unique,
  cities text[] not null default '{}',
  charge numeric not null default 0,
  free_above numeric not null default 0,
  cod_allowed boolean not null default true,
  eta_days text not null default '',
  active boolean not null default true
);
alter table delivery_zones enable row level security;
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='delivery_zones' loop
    execute format('drop policy if exists %I on delivery_zones', p.policyname);
  end loop;
end $$;
create policy "zones_public_read" on delivery_zones
  for select to anon, authenticated using (active = true);

insert into delivery_zones (name, cities, charge, free_above, cod_allowed, eta_days, active) values
  ('Kathmandu Valley', array['Kathmandu','Lalitpur','Bhaktapur'], 0, 0, true, '1-2 days', true),
  ('Pokhara + Chitwan', array['Pokhara','Chitwan'], 0, 0, true, '2-3 days', true),
  ('Rest of Nepal', array[]::text[], 0, 5000, false, '3-5 days', true)
on conflict (name) do nothing;

-- 2. Return requests ----------------------------------------------------------
create table if not exists return_requests (
  id uuid not null default gen_random_uuid() primary key,
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid not null,
  reason text not null default '',
  status text not null default 'requested',
  created_at timestamptz not null default now()
);
alter table return_requests enable row level security;
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='return_requests' loop
    execute format('drop policy if exists %I on return_requests', p.policyname);
  end loop;
end $$;
create policy "returns_owner_insert" on return_requests
  for insert to authenticated with check (user_id = auth.uid());
create policy "returns_owner_read" on return_requests
  for select to authenticated using (user_id = auth.uid());
-- Admin writes via service role (bypasses RLS). No update/delete policies = deny by default.

-- 3. Loyalty ------------------------------------------------------------------
create table if not exists loyalty_points (
  user_id uuid not null primary key,
  points integer not null default 0
);
alter table loyalty_points enable row level security;
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='loyalty_points' loop
    execute format('drop policy if exists %I on loyalty_points', p.policyname);
  end loop;
end $$;
create policy "loyalty_owner_read" on loyalty_points
  for select to authenticated using (user_id = auth.uid());
-- Writes via service role only (deny by default).

create table if not exists loyalty_ledger (
  order_id uuid not null primary key references orders(id) on delete cascade,
  user_id uuid not null,
  points integer not null default 0,
  created_at timestamptz not null default now()
);
alter table loyalty_ledger enable row level security;
-- Intentionally no policies = deny by default; service-role API routes only.
