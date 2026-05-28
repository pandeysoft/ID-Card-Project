drop policy if exists "public_profiles_public_read" on public.public_profiles;

drop policy if exists "public_profiles_owner_select" on public.public_profiles;
create policy "public_profiles_owner_select" on public.public_profiles
  for select using (auth.uid() = user_id);

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
