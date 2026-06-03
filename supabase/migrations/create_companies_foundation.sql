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

create index if not exists companies_owner_user_id_idx on public.companies(owner_user_id);
create index if not exists companies_slug_idx on public.companies(slug);
create index if not exists company_memberships_company_id_idx on public.company_memberships(company_id);
create index if not exists company_memberships_user_id_idx on public.company_memberships(user_id);

drop trigger if exists set_companies_updated_at on public.companies;
create trigger set_companies_updated_at before update on public.companies for each row execute function public.set_updated_at();

alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;

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
