-- 在 Supabase Dashboard > SQL Editor 中完整运行此文件。
create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 120),
  scheduled_day date not null,
  remind_time time,
  original_day date not null,
  completed_at timestamptz,
  carry_count integer not null default 0 check (carry_count >= 0),
  history jsonb not null default '[]'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('suggestion','bug','feeling')),
  message text not null check (char_length(message) between 1 and 2000),
  contact_email text,
  page_url text,
  app_version text,
  created_at timestamptz not null default now()
);

create table if not exists public.account_deletion_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'pending' check (status in ('pending','completed','rejected')),
  created_at timestamptz not null default now()
);

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

create table if not exists public.notification_deliveries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_key text not null unique,
  sent_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_user_day_idx on public.tasks(user_id, scheduled_day);
create index if not exists feedback_user_id_idx on public.feedback(user_id);
create index if not exists important_days_user_id_idx on public.important_days(user_id);
create index if not exists important_days_user_date_idx on public.important_days(user_id, event_date);

alter table public.tasks enable row level security;
alter table public.feedback enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.important_days enable row level security;
alter table public.user_preferences enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_deliveries enable row level security;

create policy "Users read own tasks" on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users create own tasks" on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own tasks" on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own tasks" on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users read own important days" on public.important_days for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users create own important days" on public.important_days for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own important days" on public.important_days for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own important days" on public.important_days for delete to authenticated using ((select auth.uid()) = user_id);
create policy "Users manage own preferences" on public.user_preferences for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own push subscriptions" on public.push_subscriptions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users send own feedback" on public.feedback for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Developers read feedback" on public.feedback for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'developer');

create policy "Users request own deletion" on public.account_deletion_requests for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users read own deletion request" on public.account_deletion_requests for select to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.important_days to authenticated;
grant select, insert, update, delete on public.user_preferences to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, insert on public.feedback to authenticated;
grant select, insert on public.account_deletion_requests to authenticated;
grant usage, select on all sequences in schema public to authenticated;
