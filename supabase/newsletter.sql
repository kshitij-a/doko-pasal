-- Newsletter subscribers. Run in Supabase Dashboard > SQL Editor.
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

alter table newsletter_subscribers enable row level security;

drop policy if exists "newsletter_anon_insert" on newsletter_subscribers;
create policy "newsletter_anon_insert" on newsletter_subscribers
  for insert to anon with check (true);
