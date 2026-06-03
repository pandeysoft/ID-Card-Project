revoke execute on function public.create_contact_exchange_request_by_slug(text, uuid) from public, anon;
grant execute on function public.create_contact_exchange_request_by_slug(text, uuid) to authenticated;

revoke execute on function public.create_contact_from_public_profile_if_missing(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.accept_contact_exchange_request(uuid) from public, anon;
grant execute on function public.accept_contact_exchange_request(uuid) to authenticated;
revoke execute on function public.list_contact_exchange_requests() from public, anon;
grant execute on function public.list_contact_exchange_requests() to authenticated;

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
