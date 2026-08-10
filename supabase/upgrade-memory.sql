create table if not exists public.user_memories (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null check (category in ('goal', 'preference', 'habit', 'experience', 'observation')),
  content text not null,
  source text not null default 'user' check (source in ('user', 'ai')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.user_memories enable row level security;

drop policy if exists "Users read own memories" on public.user_memories;
drop policy if exists "Users create own memories" on public.user_memories;
drop policy if exists "Users update own memories" on public.user_memories;
drop policy if exists "Users delete own memories" on public.user_memories;

create policy "Users read own memories" on public.user_memories for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users create own memories" on public.user_memories for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own memories" on public.user_memories for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own memories" on public.user_memories for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.user_memories to authenticated;
create index if not exists user_memories_user_updated_idx on public.user_memories(user_id, updated_at desc);
