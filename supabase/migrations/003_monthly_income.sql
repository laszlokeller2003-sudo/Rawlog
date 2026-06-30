-- Add monthly_income column to users table
alter table public.users
  add column if not exists monthly_income numeric(12, 2);
