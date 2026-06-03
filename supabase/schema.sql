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

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  logo_url text,
  website text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
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
  type text not null check (type in ('personal', 'professional', 'acquaintance', 'business', 'creator', 'event')),
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

create table if not exists public.contact_exchange_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  requester_profile_id uuid not null references public.profiles(id) on delete cascade,
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_user_id <> recipient_user_id),
  check (requester_profile_id <> recipient_profile_id)
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
create index if not exists companies_owner_user_id_idx on public.companies(owner_user_id);
create index if not exists companies_slug_idx on public.companies(slug);
create index if not exists company_memberships_company_id_idx on public.company_memberships(company_id);
create index if not exists company_memberships_user_id_idx on public.company_memberships(user_id);
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
create index if not exists contact_exchange_requests_requester_user_id_idx on public.contact_exchange_requests(requester_user_id);
create index if not exists contact_exchange_requests_recipient_user_id_idx on public.contact_exchange_requests(recipient_user_id);
create index if not exists contact_exchange_requests_status_idx on public.contact_exchange_requests(status);
create unique index if not exists contact_exchange_requests_pending_unique_idx
  on public.contact_exchange_requests(requester_user_id, recipient_user_id, requester_profile_id, recipient_profile_id)
  where status = 'pending';
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
drop trigger if exists set_companies_updated_at on public.companies;
create trigger set_companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
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
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.organization_members enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_links enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_links enable row level security;
alter table public.contact_exchange_requests enable row level security;
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

drop policy if exists "companies_member_select" on public.companies;
drop policy if exists "companies_owner_insert" on public.companies;
drop policy if exists "companies_owner_admin_update" on public.companies;
create policy "companies_member_select" on public.companies
  for select using (
    owner_user_id = auth.uid()
    or id in (
      select company_memberships.company_id
      from public.company_memberships
      where company_memberships.user_id = auth.uid()
    )
  );
create policy "companies_owner_insert" on public.companies
  for insert with check (owner_user_id = auth.uid());
create policy "companies_owner_admin_update" on public.companies
  for update using (
    owner_user_id = auth.uid()
    or id in (
      select company_memberships.company_id
      from public.company_memberships
      where company_memberships.user_id = auth.uid()
        and company_memberships.role in ('owner', 'admin')
    )
  )
  with check (
    owner_user_id = auth.uid()
    or id in (
      select company_memberships.company_id
      from public.company_memberships
      where company_memberships.user_id = auth.uid()
        and company_memberships.role in ('owner', 'admin')
    )
  );

drop policy if exists "company_memberships_member_select" on public.company_memberships;
drop policy if exists "company_memberships_owner_insert" on public.company_memberships;
create policy "company_memberships_member_select" on public.company_memberships
  for select using (
    user_id = auth.uid()
    or company_id in (
      select companies.id
      from public.companies
      where companies.owner_user_id = auth.uid()
    )
  );
create policy "company_memberships_owner_insert" on public.company_memberships
  for insert with check (
    user_id = auth.uid()
    and role = 'owner'
    and company_id in (
      select companies.id
      from public.companies
      where companies.owner_user_id = auth.uid()
    )
  );

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

drop policy if exists "contact_exchange_requests_participant_select" on public.contact_exchange_requests;
create policy "contact_exchange_requests_participant_select" on public.contact_exchange_requests
  for select using (requester_user_id = auth.uid() or recipient_user_id = auth.uid());

drop policy if exists "contact_exchange_requests_requester_insert" on public.contact_exchange_requests;
create policy "contact_exchange_requests_requester_insert" on public.contact_exchange_requests
  for insert with check (
    requester_user_id = auth.uid()
    and requester_profile_id in (
      select profiles.id
      from public.profiles
      where profiles.user_id = auth.uid()
    )
    and recipient_user_id <> auth.uid()
    and recipient_profile_id in (
      select public_profiles.profile_id
      from public.public_profiles
      where public_profiles.user_id = recipient_user_id
        and public_profiles.is_public = true
    )
  );

drop policy if exists "contact_exchange_requests_participant_update" on public.contact_exchange_requests;
drop policy if exists "contact_exchange_requests_recipient_accept_decline" on public.contact_exchange_requests;
drop policy if exists "contact_exchange_requests_requester_cancel" on public.contact_exchange_requests;
create policy "contact_exchange_requests_recipient_accept_decline" on public.contact_exchange_requests
  for update using (
    status = 'pending'
    and recipient_user_id = auth.uid()
  )
  with check (
    recipient_user_id = auth.uid()
    and status in ('accepted', 'declined')
  );
create policy "contact_exchange_requests_requester_cancel" on public.contact_exchange_requests
  for update using (
    status = 'pending'
    and requester_user_id = auth.uid()
  )
  with check (
    requester_user_id = auth.uid()
    and status = 'cancelled'
  );

drop policy if exists "leads_owner_all" on public.leads;
create policy "leads_owner_all" on public.leads
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "public_profiles_public_read" on public.public_profiles;
drop policy if exists "public_profiles_owner_select" on public.public_profiles;
create policy "public_profiles_owner_select" on public.public_profiles
  for select using (user_id = auth.uid());

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

revoke select on public.public_profiles from anon;

create or replace function public.get_public_profile_by_slug(profile_slug text)
returns table (
  public_slug text,
  name text,
  headline text,
  bio text,
  avatar_url text,
  published_data jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pp.public_slug,
    pp.name,
    pp.headline,
    pp.bio,
    pp.avatar_url,
    pp.published_data,
    pp.updated_at
  from public.public_profiles pp
  where pp.public_slug = profile_slug
    and pp.is_public = true
  limit 1;
$$;

grant execute on function public.get_public_profile_by_slug(text) to anon, authenticated;

create or replace function public.create_contact_exchange_request_by_slug(
  p_recipient_public_slug text,
  p_requester_profile_id uuid
)
returns table (
  id uuid,
  requester_user_id uuid,
  recipient_user_id uuid,
  requester_profile_id uuid,
  recipient_profile_id uuid,
  status text,
  created_at timestamptz,
  responded_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  insert into public.contact_exchange_requests (
    requester_user_id,
    recipient_user_id,
    requester_profile_id,
    recipient_profile_id
  )
  select
    auth.uid(),
    pp.user_id,
    p_requester_profile_id,
    pp.profile_id
  from public.public_profiles pp
  join public.profiles requester_profile
    on requester_profile.id = p_requester_profile_id
    and requester_profile.user_id = auth.uid()
  where pp.public_slug = p_recipient_public_slug
    and pp.is_public = true
    and pp.user_id <> auth.uid()
  returning
    contact_exchange_requests.id,
    contact_exchange_requests.requester_user_id,
    contact_exchange_requests.recipient_user_id,
    contact_exchange_requests.requester_profile_id,
    contact_exchange_requests.recipient_profile_id,
    contact_exchange_requests.status,
    contact_exchange_requests.created_at,
    contact_exchange_requests.responded_at;
end;
$$;

revoke execute on function public.create_contact_exchange_request_by_slug(text, uuid) from public, anon;
grant execute on function public.create_contact_exchange_request_by_slug(text, uuid) to authenticated;

create or replace function public.create_contact_from_public_profile_if_missing(
  p_owner_user_id uuid,
  p_source_profile_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_public record;
  v_contact_id uuid;
begin
  select name, headline, bio, published_data
    into v_public
  from public.public_profiles
  where profile_id = p_source_profile_id
    and is_public = true;

  if not found then
    return null;
  end if;

  select id
    into v_contact_id
  from public.contacts
  where user_id = p_owner_user_id
    and source_profile_id = p_source_profile_id
  limit 1;

  if v_contact_id is null then
    insert into public.contacts (
      user_id,
      source_profile_id,
      name,
      headline,
      bio,
      notes,
      tags
    )
    values (
      p_owner_user_id,
      p_source_profile_id,
      v_public.name,
      v_public.headline,
      v_public.bio,
      'Source: contact_exchange',
      array['contact_exchange']
    )
    returning id into v_contact_id;

    insert into public.contact_links (
      contact_id,
      user_id,
      label,
      url,
      kind,
      display_order
    )
    select
      v_contact_id,
      p_owner_user_id,
      link_item.link ->> 'label',
      link_item.link ->> 'url',
      link_item.link ->> 'kind',
      coalesce((link_item.link ->> 'order')::integer, link_item.ordinality::integer - 1)
    from jsonb_array_elements(coalesce(v_public.published_data -> 'links', '[]'::jsonb))
      with ordinality as link_item(link, ordinality)
    where link_item.link ? 'label'
      and link_item.link ? 'url'
      and coalesce((link_item.link ->> 'isVisible')::boolean, true) = true;
  end if;

  return v_contact_id;
end;
$$;

create or replace function public.accept_contact_exchange_request(
  p_request_id uuid
)
returns table (
  id uuid,
  requester_user_id uuid,
  recipient_user_id uuid,
  requester_profile_id uuid,
  recipient_profile_id uuid,
  status text,
  created_at timestamptz,
  responded_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.contact_exchange_requests%rowtype;
begin
  select *
    into v_request
  from public.contact_exchange_requests
  where contact_exchange_requests.id = p_request_id
    and contact_exchange_requests.recipient_user_id = auth.uid()
    and contact_exchange_requests.status = 'pending'
  for update;

  if not found then
    raise exception 'Unable to accept contact exchange request.';
  end if;

  update public.contact_exchange_requests
  set status = 'accepted',
      responded_at = now()
  where contact_exchange_requests.id = p_request_id;

  perform public.create_contact_from_public_profile_if_missing(
    v_request.recipient_user_id,
    v_request.requester_profile_id
  );
  perform public.create_contact_from_public_profile_if_missing(
    v_request.requester_user_id,
    v_request.recipient_profile_id
  );

  return query
  select
    cer.id,
    cer.requester_user_id,
    cer.recipient_user_id,
    cer.requester_profile_id,
    cer.recipient_profile_id,
    cer.status,
    cer.created_at,
    cer.responded_at
  from public.contact_exchange_requests cer
  where cer.id = p_request_id;
end;
$$;

create or replace function public.list_contact_exchange_requests()
returns table (
  id uuid,
  requester_user_id uuid,
  recipient_user_id uuid,
  requester_profile_id uuid,
  recipient_profile_id uuid,
  status text,
  created_at timestamptz,
  responded_at timestamptz,
  requester_name text,
  requester_headline text,
  recipient_name text,
  recipient_headline text
)
language sql
security definer
set search_path = public
as $$
  select
    cer.id,
    cer.requester_user_id,
    cer.recipient_user_id,
    cer.requester_profile_id,
    cer.recipient_profile_id,
    cer.status,
    cer.created_at,
    cer.responded_at,
    requester_public.name as requester_name,
    requester_public.headline as requester_headline,
    recipient_public.name as recipient_name,
    recipient_public.headline as recipient_headline
  from public.contact_exchange_requests cer
  left join public.public_profiles requester_public
    on requester_public.profile_id = cer.requester_profile_id
    and requester_public.is_public = true
  left join public.public_profiles recipient_public
    on recipient_public.profile_id = cer.recipient_profile_id
    and recipient_public.is_public = true
  where cer.requester_user_id = auth.uid()
    or cer.recipient_user_id = auth.uid()
  order by cer.created_at desc;
$$;

revoke execute on function public.create_contact_from_public_profile_if_missing(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.accept_contact_exchange_request(uuid) from public, anon;
grant execute on function public.accept_contact_exchange_request(uuid) to authenticated;
revoke execute on function public.list_contact_exchange_requests() from public, anon;
grant execute on function public.list_contact_exchange_requests() to authenticated;

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
