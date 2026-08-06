-- 明日复明日 2.1 数据库升级
-- 在 Supabase Dashboard > SQL Editor 中完整运行一次。
-- 本脚本只增加字段和数据表，不会删除现有任务。

alter table public.tasks
  add column if not exists remind_time time;

create table if not exists public.important_days (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  event_date date not null,
  event_type text not null default 'other' check (event_type in ('deadline','birthday','anniversary','other')),
  remind_days integer not null default 3 check (remind_days between 0 and 365),
  repeats_yearly boolean not null default false,
  note text check (note is null or char_length(note) <= 240),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists important_days_user_id_idx on public.important_days(user_id);
create index if not exists important_days_user_date_idx on public.important_days(user_id, event_date);

alter table public.important_days enable row level security;

drop policy if exists "Users read own important days" on public.important_days;
drop policy if exists "Users create own important days" on public.important_days;
drop policy if exists "Users update own important days" on public.important_days;
drop policy if exists "Users delete own important days" on public.important_days;

create policy "Users read own important days" on public.important_days
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users create own important days" on public.important_days
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own important days" on public.important_days
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete own important days" on public.important_days
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.important_days to authenticated;

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weather_city text,
  quiet_start time not null default '22:00',
  quiet_end time not null default '08:00',
  notifications_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

alter table public.user_preferences enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "Users manage own preferences" on public.user_preferences;
drop policy if exists "Users manage own push subscriptions" on public.push_subscriptions;

create policy "Users manage own preferences" on public.user_preferences
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users manage own push subscriptions" on public.push_subscriptions
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.user_preferences to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

create table if not exists public.notification_deliveries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_key text not null unique,
  sent_at timestamptz not null default now()
);

alter table public.notification_deliveries enable row level security;
