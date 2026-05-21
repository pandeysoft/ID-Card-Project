create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  onboarding_completed boolean not null default false,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  type text not null check (type in ('personal', 'professional', 'acquaintance', 'business')),
  public_slug text not null unique,
  name text not null,
  headline text,
  company text,
  bio text,
  email text,
  phone text,
  location text,
  avatar_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  url text not null,
  kind text,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  headline text,
  bio text,
  email text,
  phone text,
  location text,
  notes text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_links (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  url text not null,
  kind text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  lead_status text not null default 'new' check (lead_status in ('new', 'contacted', 'qualified', 'converted', 'lost')),
  source text,
  notes text,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  public_slug text not null unique,
  name text not null,
  headline text,
  bio text,
  avatar_url text,
  published_data jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  plan text not null,
  status text not null default 'inactive',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or organization_id is not null)
);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or organization_id is not null)
);

create index if not exists organizations_owner_user_id_idx on public.organizations(owner_user_id);
create index if not exists app_users_onboarding_completed_idx on public.app_users(onboarding_completed);
create index if not exists organization_members_user_id_idx on public.organization_members(user_id);
create index if not exists organization_members_organization_id_idx on public.organization_members(organization_id);
create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists profiles_organization_id_idx on public.profiles(organization_id);
create index if not exists profiles_public_slug_idx on public.profiles(public_slug);
create index if not exists profile_links_user_id_idx on public.profile_links(user_id);
create index if not exists profile_links_profile_id_idx on public.profile_links(profile_id);
create index if not exists contacts_user_id_idx on public.contacts(user_id);
create index if not exists contacts_source_profile_id_idx on public.contacts(source_profile_id);
create index if not exists contacts_user_created_at_idx on public.contacts(user_id, created_at desc);
create index if not exists contacts_user_name_lower_idx on public.contacts(user_id, lower(name));
create index if not exists contacts_user_headline_lower_idx on public.contacts(user_id, lower(headline));
create index if not exists contacts_user_email_lower_idx on public.contacts(user_id, lower(email));
create index if not exists contact_links_user_id_idx on public.contact_links(user_id);
create index if not exists contact_links_contact_id_idx on public.contact_links(contact_id);
create index if not exists leads_user_id_idx on public.leads(user_id);
create index if not exists leads_organization_id_idx on public.leads(organization_id);
create index if not exists leads_profile_id_idx on public.leads(profile_id);
create index if not exists leads_lead_status_idx on public.leads(lead_status);
create index if not exists leads_user_created_at_idx on public.leads(user_id, created_at desc);
create index if not exists leads_user_status_created_at_idx on public.leads(user_id, lead_status, created_at desc);
create index if not exists leads_contact_id_idx on public.leads(contact_id);
create index if not exists leads_user_source_lower_idx on public.leads(user_id, lower(source));
create index if not exists public_profiles_user_id_idx on public.public_profiles(user_id);
create index if not exists public_profiles_profile_id_idx on public.public_profiles(profile_id);
create index if not exists public_profiles_public_slug_idx on public.public_profiles(public_slug);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_organization_id_idx on public.subscriptions(organization_id);
create index if not exists entitlements_user_id_idx on public.entitlements(user_id);
create index if not exists entitlements_organization_id_idx on public.entitlements(organization_id);

drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();
drop trigger if exists set_app_users_updated_at on public.app_users;
create trigger set_app_users_updated_at before update on public.app_users for each row execute function public.set_updated_at();
drop trigger if exists set_account_settings_updated_at on public.account_settings;
create trigger set_account_settings_updated_at before update on public.account_settings for each row execute function public.set_updated_at();
drop trigger if exists set_privacy_settings_updated_at on public.privacy_settings;
create trigger set_privacy_settings_updated_at before update on public.privacy_settings for each row execute function public.set_updated_at();
drop trigger if exists set_sharing_settings_updated_at on public.sharing_settings;
create trigger set_sharing_settings_updated_at before update on public.sharing_settings for each row execute function public.set_updated_at();
drop trigger if exists set_organization_members_updated_at on public.organization_members;
create trigger set_organization_members_updated_at before update on public.organization_members for each row execute function public.set_updated_at();
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists set_profile_links_updated_at on public.profile_links;
create trigger set_profile_links_updated_at before update on public.profile_links for each row execute function public.set_updated_at();
drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at before update on public.contacts for each row execute function public.set_updated_at();
drop trigger if exists set_contact_links_updated_at on public.contact_links;
create trigger set_contact_links_updated_at before update on public.contact_links for each row execute function public.set_updated_at();
drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at before update on public.leads for each row execute function public.set_updated_at();
drop trigger if exists set_public_profiles_updated_at on public.public_profiles;
create trigger set_public_profiles_updated_at before update on public.public_profiles for each row execute function public.set_updated_at();
drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
drop trigger if exists set_entitlements_updated_at on public.entitlements;
create trigger set_entitlements_updated_at before update on public.entitlements for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.app_users enable row level security;
alter table public.account_settings enable row level security;
alter table public.privacy_settings enable row level security;
alter table public.sharing_settings enable row level security;
alter table public.organization_members enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_links enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_links enable row level security;
alter table public.leads enable row level security;
alter table public.public_profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.entitlements enable row level security;

drop policy if exists "organizations_owner_all" on public.organizations;
create policy "organizations_owner_all" on public.organizations
  for all using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists "app_users_self_all" on public.app_users;
create policy "app_users_self_all" on public.app_users
  for all using (id = auth.uid())
  with check (id = auth.uid());

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

drop policy if exists "organization_members_self_all" on public.organization_members;
create policy "organization_members_self_all" on public.organization_members
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "profiles_owner_all" on public.profiles;
create policy "profiles_owner_all" on public.profiles
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "profile_links_owner_all" on public.profile_links;
create policy "profile_links_owner_all" on public.profile_links
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "contacts_owner_all" on public.contacts;
create policy "contacts_owner_all" on public.contacts
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "contact_links_owner_all" on public.contact_links;
create policy "contact_links_owner_all" on public.contact_links
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "leads_owner_all" on public.leads;
create policy "leads_owner_all" on public.leads
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "public_profiles_public_read" on public.public_profiles;
create policy "public_profiles_public_read" on public.public_profiles
  for select using (is_public = true);

drop policy if exists "public_profiles_owner_insert" on public.public_profiles;
create policy "public_profiles_owner_insert" on public.public_profiles
  for insert with check (user_id = auth.uid());

drop policy if exists "public_profiles_owner_update" on public.public_profiles;
create policy "public_profiles_owner_update" on public.public_profiles
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "public_profiles_owner_delete" on public.public_profiles;
create policy "public_profiles_owner_delete" on public.public_profiles
  for delete using (user_id = auth.uid());

drop policy if exists "subscriptions_owner_all" on public.subscriptions;
create policy "subscriptions_owner_all" on public.subscriptions
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "entitlements_owner_all" on public.entitlements;
create policy "entitlements_owner_all" on public.entitlements
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "profile_avatars_public_read" on storage.objects;
create policy "profile_avatars_public_read" on storage.objects
  for select
  using (bucket_id = 'profile-avatars');

drop policy if exists "profile_avatars_owner_insert" on storage.objects;
create policy "profile_avatars_owner_insert" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "profile_avatars_owner_update" on storage.objects;
create policy "profile_avatars_owner_update" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "profile_avatars_owner_delete" on storage.objects;
create policy "profile_avatars_owner_delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
