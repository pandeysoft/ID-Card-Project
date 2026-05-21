# Supabase Verification Checklist

## Auth Persistence
- Sign in, reload the Expo app, and confirm the user remains signed in.
- Confirm only anon/public Expo env vars are present in the client build.

## RLS Tables
Run:
```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```
Confirm app tables have `rowsecurity = true`.

## Profile Avatars Storage
Run:
```sql
select id, name, public
from storage.buckets
where id = 'profile-avatars';
```
Confirm the bucket exists and is public.

## Storage Policies
Run:
```sql
select policyname, cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'profile_avatars%';
```
Confirm public read plus authenticated owner insert/update/delete policies exist.

## Public Profile Read Access
- Published profiles should load by slug without authentication.
- Missing slugs should show "Profile not found", not mock data.

SQL:
```sql
select public_slug, is_public, published_data
from public.public_profiles
limit 5;
```

## Onboarding App Users
Run:
```sql
select id, email, onboarding_completed, onboarding_completed_at
from public.app_users
limit 5;
```
Confirm real users persist onboarding state.

## Account Settings Tables
Run:
```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('account_settings', 'privacy_settings', 'sharing_settings');
```
Confirm all three tables exist with owner-only RLS policies.

## Contacts And Leads Indexes
Run:
```sql
select indexname
from pg_indexes
where schemaname = 'public'
  and tablename in ('contacts', 'leads')
order by tablename, indexname;
```
Confirm owner, status, created_at, and search helper indexes exist.

## Public Profile Privacy Allowlist
- Publish a profile and inspect `public_profiles.published_data`.
- Confirm it only contains allowed public fields and visible public links.
- Confirm email, phone, location, internal user id, and hidden links are absent.

## Release Build Dev Bypass Guard
- Build/run a release variant.
- Confirm "Continue as Demo User" is not visible.
- Confirm fake demo auth cannot be enabled outside `__DEV__`.

## Beta Launch Sanity
- `npx.cmd tsc --noEmit` passes.
- `.env` is not committed.
- No `service_role` key exists in app code or public env.
- Avatar upload works for a real authenticated user.
- Contacts/leads load first page and load more without permission errors.
- Public profile scan/open works for real slugs and fails safely for missing slugs.
