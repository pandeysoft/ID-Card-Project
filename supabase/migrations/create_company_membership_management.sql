create or replace function public.get_company_membership_role(
  p_company_id uuid,
  p_user_id uuid
)
returns text
language sql
security definer
set search_path = public
as $$
  select role
  from public.company_memberships
  where company_id = p_company_id
    and user_id = p_user_id
  limit 1;
$$;

create or replace function public.list_company_members(
  p_company_id uuid
)
returns table (
  id uuid,
  company_id uuid,
  user_id uuid,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.get_company_membership_role(p_company_id, auth.uid()) is null then
    raise exception 'Unable to load company members.';
  end if;

  return query
  select
    company_memberships.id,
    company_memberships.company_id,
    company_memberships.user_id,
    company_memberships.role,
    company_memberships.created_at
  from public.company_memberships
  where company_memberships.company_id = p_company_id
  order by company_memberships.created_at asc;
end;
$$;

create or replace function public.invite_company_member(
  p_company_id uuid,
  p_user_id uuid,
  p_role text
)
returns table (
  id uuid,
  company_id uuid,
  user_id uuid,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_role text;
  v_existing_role text;
  v_owner_count integer;
begin
  if p_role not in ('owner', 'admin', 'member') then
    raise exception 'Invalid company role.';
  end if;

  v_actor_role := public.get_company_membership_role(p_company_id, auth.uid());
  v_existing_role := public.get_company_membership_role(p_company_id, p_user_id);

  if v_existing_role = 'owner' and p_role <> 'owner' then
    select count(*)
      into v_owner_count
    from public.company_memberships
    where company_id = p_company_id
      and role = 'owner';

    if v_owner_count <= 1 then
      raise exception 'Unable to change the sole company owner.';
    end if;
  end if;

  if v_actor_role = 'owner' then
    null;
  elsif v_actor_role = 'admin' and p_role = 'member' and coalesce(v_existing_role, 'member') = 'member' then
    null;
  else
    raise exception 'Unable to invite company member.';
  end if;

  return query
  insert into public.company_memberships (
    company_id,
    user_id,
    role
  )
  values (
    p_company_id,
    p_user_id,
    p_role
  )
  on conflict (company_id, user_id) do update
  set role = excluded.role
  returning
    company_memberships.id,
    company_memberships.company_id,
    company_memberships.user_id,
    company_memberships.role,
    company_memberships.created_at;
end;
$$;

create or replace function public.remove_company_member(
  p_company_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_role text;
  v_target_role text;
  v_owner_count integer;
begin
  v_actor_role := public.get_company_membership_role(p_company_id, auth.uid());
  v_target_role := public.get_company_membership_role(p_company_id, p_user_id);

  if v_target_role is null then
    return;
  end if;

  if v_target_role = 'owner' then
    select count(*)
      into v_owner_count
    from public.company_memberships
    where company_id = p_company_id
      and role = 'owner';

    if v_owner_count <= 1 then
      raise exception 'Unable to remove the sole company owner.';
    end if;
  end if;

  if v_actor_role = 'owner' then
    null;
  elsif v_actor_role = 'admin' and v_target_role = 'member' then
    null;
  else
    raise exception 'Unable to remove company member.';
  end if;

  delete from public.company_memberships
  where company_id = p_company_id
    and user_id = p_user_id;
end;
$$;

revoke execute on function public.get_company_membership_role(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.list_company_members(uuid) from public, anon;
grant execute on function public.list_company_members(uuid) to authenticated;
revoke execute on function public.invite_company_member(uuid, uuid, text) from public, anon;
grant execute on function public.invite_company_member(uuid, uuid, text) to authenticated;
revoke execute on function public.remove_company_member(uuid, uuid) from public, anon;
grant execute on function public.remove_company_member(uuid, uuid) to authenticated;
