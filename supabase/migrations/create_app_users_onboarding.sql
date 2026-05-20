create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  onboarding_completed boolean not null default false,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_users_onboarding_completed_idx on public.app_users(onboarding_completed);

drop trigger if exists set_app_users_updated_at on public.app_users;
create trigger set_app_users_updated_at before update on public.app_users for each row execute function public.set_updated_at();

alter table public.app_users enable row level security;

drop policy if exists "app_users_self_all" on public.app_users;
create policy "app_users_self_all" on public.app_users
  for all using (id = auth.uid())
  with check (id = auth.uid());
