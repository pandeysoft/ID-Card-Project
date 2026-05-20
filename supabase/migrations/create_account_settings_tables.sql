create table if not exists public.account_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.privacy_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile_visibility text not null default 'private' check (profile_visibility in ('private', 'contacts', 'public')),
  searchable_by_email boolean not null default false,
  searchable_by_phone boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sharing_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  contact_sync_enabled boolean not null default false,
  lead_sharing_requires_consent boolean not null default true,
  allow_vcard_export boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_account_settings_updated_at on public.account_settings;
create trigger set_account_settings_updated_at before update on public.account_settings for each row execute function public.set_updated_at();

drop trigger if exists set_privacy_settings_updated_at on public.privacy_settings;
create trigger set_privacy_settings_updated_at before update on public.privacy_settings for each row execute function public.set_updated_at();

drop trigger if exists set_sharing_settings_updated_at on public.sharing_settings;
create trigger set_sharing_settings_updated_at before update on public.sharing_settings for each row execute function public.set_updated_at();

alter table public.account_settings enable row level security;
alter table public.privacy_settings enable row level security;
alter table public.sharing_settings enable row level security;

drop policy if exists "account_settings_owner_all" on public.account_settings;
create policy "account_settings_owner_all" on public.account_settings
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "privacy_settings_owner_all" on public.privacy_settings;
create policy "privacy_settings_owner_all" on public.privacy_settings
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "sharing_settings_owner_all" on public.sharing_settings;
create policy "sharing_settings_owner_all" on public.sharing_settings
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());
