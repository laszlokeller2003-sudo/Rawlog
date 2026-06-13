-- ============================================================
-- RAWLOG — Full Database Schema v1
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Users (profile table) ────────────────────────────────
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  dob date,
  sex text check (sex in ('male', 'female', 'other', 'prefer_not_to_say')),
  language text not null default 'en',
  currency text not null default 'EUR',
  photo_url text,
  score_weights jsonb not null default '{"sleep":25,"fitness":20,"work":20,"finance":15,"social":10,"nutrition":5,"health":5}'::jsonb,
  reminder_frequency text not null default 'none',
  reminder_time text,
  daily_report_enabled boolean not null default true,
  daily_report_time text not null default '21:00',
  weekly_report_enabled boolean not null default true,
  monthly_report_enabled boolean not null default false,
  is_premium boolean not null default false,
  trial_started_at timestamptz default now(),
  onboarding_complete boolean not null default false,
  selected_categories text[] not null default array['substances','intimacy','fitness','sleep','mood','nutrition','finance','social','work','health'],
  goals_onboarding text[] not null default array[]::text[],
  app_lock_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- ─── Entries ──────────────────────────────────────────────
create table if not exists public.entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  category text not null,
  subcategory text not null,
  fields jsonb not null default '{}'::jsonb,
  note text,
  tags text[],
  timestamp timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.entries enable row level security;

create policy "Users can manage own entries" on public.entries
  for all using (auth.uid() = user_id);

create index if not exists entries_user_id_idx on public.entries(user_id);
create index if not exists entries_timestamp_idx on public.entries(timestamp desc);
create index if not exists entries_category_idx on public.entries(category);

-- ─── Habits ───────────────────────────────────────────────
create table if not exists public.habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  category text not null,
  frequency text not null default 'daily',
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  graceperiod boolean not null default false,
  enabled boolean not null default true,
  color text,
  created_at timestamptz not null default now()
);

alter table public.habits enable row level security;

create policy "Users can manage own habits" on public.habits
  for all using (auth.uid() = user_id);

-- ─── Habit Logs ───────────────────────────────────────────
create table if not exists public.habit_logs (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  unique(habit_id, date)
);

alter table public.habit_logs enable row level security;

create policy "Users can manage own habit logs" on public.habit_logs
  for all using (auth.uid() = user_id);

-- ─── Goals ────────────────────────────────────────────────
create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  category text not null,
  target_value numeric not null default 0,
  current_value numeric not null default 0,
  unit text not null default '',
  deadline date,
  achieved boolean not null default false,
  achieved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "Users can manage own goals" on public.goals
  for all using (auth.uid() = user_id);

-- ─── Chat Messages ────────────────────────────────────────
create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "Users can manage own chat messages" on public.chat_messages
  for all using (auth.uid() = user_id);

create index if not exists chat_messages_user_id_idx on public.chat_messages(user_id, created_at);

-- ─── Body Metrics ─────────────────────────────────────────
create table if not exists public.body_metrics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  weight numeric,
  body_fat numeric,
  measurements jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

alter table public.body_metrics enable row level security;

create policy "Users can manage own body metrics" on public.body_metrics
  for all using (auth.uid() = user_id);

-- ─── Score History ────────────────────────────────────────
create table if not exists public.score_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  overall_score integer,
  category_scores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

alter table public.score_history enable row level security;

create policy "Users can manage own score history" on public.score_history
  for all using (auth.uid() = user_id);

-- ─── Updated-at trigger ───────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_updated_at
  before update on public.users
  for each row execute function update_updated_at();

-- ─── New user profile auto-create ─────────────────────────
create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
