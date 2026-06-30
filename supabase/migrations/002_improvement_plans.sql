-- ============================================================
-- LYFE — Improvement Plans table
-- ============================================================

create table if not exists public.improvement_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  actions jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.improvement_plans enable row level security;

create policy "Users can manage own improvement plans" on public.improvement_plans
  for all using (auth.uid() = user_id);

create trigger set_improvement_plans_updated_at
  before update on public.improvement_plans
  for each row execute function update_updated_at();
