-- 修复：补齐生产环境缺失的“每日心情”表。
-- 可在 Supabase Dashboard > SQL Editor 中安全重复执行；不会影响任务、日期或其他表。

create table if not exists public.mood_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  mood_date date not null,
  mood text,
  note text check (note is null or char_length(note) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, mood_date)
);

alter table public.mood_entries enable row level security;

drop policy if exists "Users read own moods" on public.mood_entries;
drop policy if exists "Users create own moods" on public.mood_entries;
drop policy if exists "Users update own moods" on public.mood_entries;
drop policy if exists "Users delete own moods" on public.mood_entries;

create policy "Users read own moods"
  on public.mood_entries for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users create own moods"
  on public.mood_entries for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update own moods"
  on public.mood_entries for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete own moods"
  on public.mood_entries for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.mood_entries to authenticated;
