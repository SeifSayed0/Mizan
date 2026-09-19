-- ميزان: مخطط Supabase الكامل
-- شغّل هذا الملف من Supabase Dashboard > SQL Editor.
-- لا يحتوي على بيانات تجريبية.

create extension if not exists pgcrypto;

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null check (char_length(guest_id) between 8 and 120),
  title text not null check (char_length(btrim(title)) between 8 and 180),
  description text not null default '' check (char_length(description) <= 3000),
  category text not null check (char_length(btrim(category)) between 2 and 60),
  privacy text not null check (privacy in ('عام', 'مجهول للناس', 'خاص برابط')),
  option_a text not null check (char_length(btrim(option_a)) between 1 and 80),
  option_b text not null check (char_length(btrim(option_b)) between 1 and 80),
  status text not null default 'active' check (status in ('active', 'hidden', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  guest_id text not null check (char_length(guest_id) between 8 and 120),
  choice text not null check (choice in ('a', 'b')),
  experience_relation text check (experience_relation is null or char_length(experience_relation) <= 60),
  created_at timestamptz not null default now(),
  unique (decision_id, guest_id)
);

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  guest_id text not null check (char_length(guest_id) between 8 and 120),
  name text not null default 'ضيف ميزان' check (char_length(btrim(name)) between 2 and 80),
  age integer check (age is null or age between 13 and 100),
  title text not null check (char_length(btrim(title)) between 5 and 180),
  body text not null check (char_length(btrim(body)) between 20 and 5000),
  outcome text not null check (outcome in ('نجحت', 'فشلت', 'قريبة منها', 'رأي فقط')),
  likes integer not null default 0 check (likes >= 0),
  comments integer not null default 0 check (comments >= 0),
  status text not null default 'active' check (status in ('active', 'hidden', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists decisions_active_created_idx
  on public.decisions (status, created_at desc);
create index if not exists decisions_category_idx
  on public.decisions (category);
create index if not exists votes_decision_idx
  on public.votes (decision_id);
create index if not exists experiences_decision_status_created_idx
  on public.experiences (decision_id, status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists decisions_set_updated_at on public.decisions;
create trigger decisions_set_updated_at
before update on public.decisions
for each row execute function public.set_updated_at();

drop trigger if exists experiences_set_updated_at on public.experiences;
create trigger experiences_set_updated_at
before update on public.experiences
for each row execute function public.set_updated_at();

alter table public.decisions enable row level security;
alter table public.votes enable row level security;
alter table public.experiences enable row level security;

drop policy if exists "public can read active decisions" on public.decisions;
create policy "public can read active decisions"
on public.decisions for select
to anon, authenticated
using (status = 'active');

drop policy if exists "guests can create decisions" on public.decisions;
create policy "guests can create decisions"
on public.decisions for insert
to anon, authenticated
with check (char_length(guest_id) between 8 and 120 and status = 'active');

drop policy if exists "public can read votes" on public.votes;
create policy "public can read votes"
on public.votes for select
to anon, authenticated
using (true);

drop policy if exists "guests can create or update votes" on public.votes;
create policy "guests can create or update votes"
on public.votes for insert
to anon, authenticated
with check (char_length(guest_id) between 8 and 120);

drop policy if exists "guests can update their vote" on public.votes;
create policy "guests can update their vote"
on public.votes for update
to anon, authenticated
using (char_length(guest_id) between 8 and 120)
with check (char_length(guest_id) between 8 and 120);

drop policy if exists "public can read active experiences" on public.experiences;
create policy "public can read active experiences"
on public.experiences for select
to anon, authenticated
using (status = 'active');

drop policy if exists "guests can create experiences" on public.experiences;
create policy "guests can create experiences"
on public.experiences for insert
to anon, authenticated
with check (char_length(guest_id) between 8 and 120 and status = 'active');

-- لوحة المالك تستخدم service_role من السيرفر، لذلك لا نفتح update/delete للعامة.
-- لا تضع SUPABASE_SERVICE_ROLE_KEY داخل index.html أو أي كود متصفح.
