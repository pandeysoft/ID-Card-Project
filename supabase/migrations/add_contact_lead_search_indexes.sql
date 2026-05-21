create index if not exists contacts_user_created_at_idx
  on public.contacts (user_id, created_at desc);

create index if not exists contacts_user_name_lower_idx
  on public.contacts (user_id, lower(name));

create index if not exists contacts_user_headline_lower_idx
  on public.contacts (user_id, lower(headline));

create index if not exists contacts_user_email_lower_idx
  on public.contacts (user_id, lower(email));

create index if not exists leads_user_created_at_idx
  on public.leads (user_id, created_at desc);

create index if not exists leads_user_status_created_at_idx
  on public.leads (user_id, lead_status, created_at desc);

create index if not exists leads_contact_id_idx
  on public.leads (contact_id);

create index if not exists leads_user_source_lower_idx
  on public.leads (user_id, lower(source));
