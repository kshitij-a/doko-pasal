-- Doko Pasal RLS lockdown. Paste into Supabase Dashboard > SQL Editor > New query > Run.
-- Requires: admins(email), products, orders, order_items, reviews, banners,
-- coupons, site_settings, conversations, messages, activity_logs tables.

-- 1. Enable RLS everywhere (safe to re-run)
alter table admins enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reviews enable row level security;
alter table banners enable row level security;
alter table coupons enable row level security;
alter table site_settings enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table activity_logs enable row level security;

-- 2. Drop old permissive policies if they exist (allows clean re-run)
do $$
declare p record;
begin
  for p in select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('admins','products','orders','order_items','reviews',
        'banners','coupons','site_settings','conversations','messages','activity_logs')
  loop
    execute format('drop policy if exists %I on %I', p.policyname, p.tablename);
  end loop;
end $$;

-- 3. admins: only authenticated users can check their own row.
-- Service-role API routes bypass RLS, so admin writes still work.
create policy "admins_self_read" on admins
  for select to authenticated using (email = (auth.jwt() ->> 'email'));

-- 4. products + banners: public read, no anon write (admin writes via service role).
create policy "products_public_read" on products
  for select to anon, authenticated using (true);
create policy "banners_public_read" on banners
  for select to anon, authenticated using (active = true);

-- 5. orders: owner-only. Insert must match auth.uid(); users read/update own rows.
-- ponytail: no delete for customers; admin deletes via service role.
create policy "orders_owner_insert" on orders
  for insert to authenticated with check (user_id = auth.uid());
create policy "orders_owner_read" on orders
  for select to authenticated using (user_id = auth.uid());
create policy "orders_owner_update" on orders
  for update to authenticated using (user_id = auth.uid());

-- 6. order_items: writable only alongside own order.
create policy "items_owner_insert" on order_items
  for insert to authenticated with check (
    exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "items_owner_read" on order_items
  for select to authenticated using (
    exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

-- 7. reviews: public read, authenticated insert for own user_id, owner update/delete.
create policy "reviews_public_read" on reviews
  for select to anon, authenticated using (true);
create policy "reviews_owner_insert" on reviews
  for insert to authenticated with check (user_id = auth.uid());
create policy "reviews_owner_update" on reviews
  for update to authenticated using (user_id = auth.uid());
create policy "reviews_owner_delete" on reviews
  for delete to authenticated using (user_id = auth.uid());

-- 8. coupons: readable for checkout validation display; writes via service role only.
create policy "coupons_read" on coupons
  for select to anon, authenticated using (true);

-- 9. site_settings: public read (storefront needs it); writes via service role only.
create policy "settings_public_read" on site_settings
  for select to anon, authenticated using (true);

-- 10. conversations/messages: owner-only via user_id; admin reads via service role.
create policy "conv_owner_all" on conversations
  for all to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "msg_owner_read" on messages
  for select to authenticated using (
    exists (select 1 from conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "msg_owner_insert" on messages
  for insert to authenticated with check (
    exists (select 1 from conversations c where c.id = conversation_id and c.user_id = auth.uid()));

-- 11. activity_logs: no anon/direct writes (was forgeable). Reads via service role only.
-- Intentionally no policies for anon/authenticated = deny by default.

-- 12. Verify: after running, these must return rows (as postgres):
-- select * from pg_policies where schemaname='public';
