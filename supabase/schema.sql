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
  lead_status text not null default 'new' check (lead_status in ('new', 'contacted', 'qualified', 'won', 'lost')),
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
create index if not exists organization_members_user_id_idx on public.organization_members(user_id);
create index if not exists organization_members_organization_id_idx on public.organization_members(organization_id);
create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists profiles_organization_id_idx on public.profiles(organization_id);
create index if not exists profiles_public_slug_idx on public.profiles(public_slug);
create index if not exists profile_links_user_id_idx on public.profile_links(user_id);
create index if not exists profile_links_profile_id_idx on public.profile_links(profile_id);
create index if not exists contacts_user_id_idx on public.contacts(user_id);
create index if not exists contacts_source_profile_id_idx on public.contacts(source_profile_id);
create index if not exists contact_links_user_id_idx on public.contact_links(user_id);
create index if not exists contact_links_contact_id_idx on public.contact_links(contact_id);
create index if not exists leads_user_id_idx on public.leads(user_id);
create index if not exists leads_organization_id_idx on public.leads(organization_id);
create index if not exists leads_profile_id_idx on public.leads(profile_id);
create index if not exists leads_lead_status_idx on public.leads(lead_status);
create index if not exists public_profiles_user_id_idx on public.public_profiles(user_id);
create index if not exists public_profiles_profile_id_idx on public.public_profiles(profile_id);
create index if not exists public_profiles_public_slug_idx on public.public_profiles(public_slug);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_organization_id_idx on public.subscriptions(organization_id);
create index if not exists entitlements_user_id_idx on public.entitlements(user_id);
create index if not exists entitlements_organization_id_idx on public.entitlements(organization_id);

drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();
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
