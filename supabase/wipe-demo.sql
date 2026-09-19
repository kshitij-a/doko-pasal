-- Doko Pasal: wipe ALL demo data. Run in Supabase Dashboard > SQL Editor.
-- NEVER touched: admins (your login), site_settings, auth.users, storage buckets.
-- FK-safe: children first, then parents.

delete from order_items;
delete from orders;
delete from reviews;
delete from messages;
delete from conversations;
delete from activity_logs;
delete from banners;
delete from coupons;
delete from newsletter_subscribers;
delete from products;

-- Verify: every row below must be 0, admins must be >= 1.
select 'order_items' as t, count(*) as n from order_items
union all select 'orders', count(*) from orders
union all select 'reviews', count(*) from reviews
union all select 'messages', count(*) from messages
union all select 'conversations', count(*) from conversations
union all select 'activity_logs', count(*) from activity_logs
union all select 'banners', count(*) from banners
union all select 'coupons', count(*) from coupons
union all select 'newsletter_subscribers', count(*) from newsletter_subscribers
union all select 'products', count(*) from products
union all select 'admins(KEEP)', count(*) from admins;
