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

grant execute on function public.accept_contact_exchange_request(uuid) to authenticated;
grant execute on function public.list_contact_exchange_requests() to authenticated;
