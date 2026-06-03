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

create index if not exists contact_exchange_requests_requester_user_id_idx
  on public.contact_exchange_requests(requester_user_id);

create index if not exists contact_exchange_requests_recipient_user_id_idx
  on public.contact_exchange_requests(recipient_user_id);

create index if not exists contact_exchange_requests_status_idx
  on public.contact_exchange_requests(status);

create unique index if not exists contact_exchange_requests_pending_unique_idx
  on public.contact_exchange_requests(requester_user_id, recipient_user_id, requester_profile_id, recipient_profile_id)
  where status = 'pending';

alter table public.contact_exchange_requests enable row level security;

drop policy if exists "contact_exchange_requests_participant_select" on public.contact_exchange_requests;
create policy "contact_exchange_requests_participant_select" on public.contact_exchange_requests
  for select using (requester_user_id = auth.uid() or recipient_user_id = auth.uid());

drop policy if exists "contact_exchange_requests_requester_insert" on public.contact_exchange_requests;
create policy "contact_exchange_requests_requester_insert" on public.contact_exchange_requests
  for insert with check (requester_user_id = auth.uid());

drop policy if exists "contact_exchange_requests_participant_update" on public.contact_exchange_requests;
create policy "contact_exchange_requests_participant_update" on public.contact_exchange_requests
  for update using (
    status = 'pending'
    and (requester_user_id = auth.uid() or recipient_user_id = auth.uid())
  )
  with check (requester_user_id = auth.uid() or recipient_user_id = auth.uid());
