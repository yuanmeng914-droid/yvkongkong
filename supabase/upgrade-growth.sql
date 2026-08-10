create table if not exists public.daily_reviews (
  user_id uuid references auth.users(id) on delete cascade not null,
  review_date date not null,
  highlight text,
  unfinished text,
  next_step text,
  updated_at timestamptz not null default now(),
  primary key (user_id, review_date)
);

alter table public.daily_reviews enable row level security;

drop policy if exists "Users read own daily reviews" on public.daily_reviews;
drop policy if exists "Users create own daily reviews" on public.daily_reviews;
drop policy if exists "Users update own daily reviews" on public.daily_reviews;
drop policy if exists "Users delete own daily reviews" on public.daily_reviews;

create policy "Users read own daily reviews" on public.daily_reviews for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users create own daily reviews" on public.daily_reviews for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own daily reviews" on public.daily_reviews for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own daily reviews" on public.daily_reviews for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.daily_reviews to authenticated;
create index if not exists daily_reviews_user_date_idx on public.daily_reviews(user_id, review_date);
