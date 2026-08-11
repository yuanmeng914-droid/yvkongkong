-- 明日复明日 AI-2：每日成长分析结果。
-- 在 Supabase Dashboard > SQL Editor 中运行一次；不会修改任务、心情、复盘或记忆数据。

create table if not exists public.ai_daily_insights (
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_date date not null,
  summary text not null check (char_length(summary) between 1 and 300),
  observation text not null check (char_length(observation) between 1 and 300),
  tomorrow_suggestion text not null check (char_length(tomorrow_suggestion) between 1 and 300),
  source_snapshot jsonb not null default '{}'::jsonb,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, insight_date)
);

alter table public.ai_daily_insights enable row level security;

drop policy if exists "Users read own daily insights" on public.ai_daily_insights;
drop policy if exists "Users create own daily insights" on public.ai_daily_insights;
drop policy if exists "Users update own daily insights" on public.ai_daily_insights;
drop policy if exists "Users delete own daily insights" on public.ai_daily_insights;

create policy "Users read own daily insights"
  on public.ai_daily_insights for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users create own daily insights"
  on public.ai_daily_insights for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update own daily insights"
  on public.ai_daily_insights for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete own daily insights"
  on public.ai_daily_insights for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.ai_daily_insights to authenticated;
