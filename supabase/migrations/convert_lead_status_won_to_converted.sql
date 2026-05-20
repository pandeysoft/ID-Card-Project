update public.leads
set lead_status = 'converted'
where lead_status = 'won';

alter table public.leads
drop constraint if exists leads_lead_status_check;

alter table public.leads
add constraint leads_lead_status_check
check (lead_status in ('new', 'contacted', 'qualified', 'converted', 'lost'));
