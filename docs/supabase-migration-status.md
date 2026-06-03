# Supabase Migration Status

Use this file before beta to confirm which SQL migrations have been applied in the Supabase dashboard. This repository does not currently record remote migration state, so each migration below should be treated as manually required unless you have already applied it to the target Supabase project.

## Migration Inventory

| Filename | Purpose | Manually run in Supabase? | Verification query/check |
| --- | --- | --- | --- |
| `add_company_to_profiles.sql` | Adds `company` text column to `public.profiles`. | Yes, if not already applied. | `select column_name from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'company';` |
| `add_contact_lead_search_indexes.sql` | Adds search/sort indexes for contacts and leads. | Yes, if not already applied. | `select indexname from pg_indexes where schemaname = 'public' and indexname in ('contacts_user_created_at_idx','contacts_user_name_lower_idx','contacts_user_headline_lower_idx','contacts_user_email_lower_idx','leads_user_created_at_idx','leads_user_status_created_at_idx','leads_contact_id_idx','leads_user_source_lower_idx');` |
| `add_creator_event_profile_types.sql` | Updates `profiles_type_check` to allow `creator` and `event` profile types. | Yes, if not already applied. | `select conname, pg_get_constraintdef(oid) from pg_constraint where conname = 'profiles_type_check';` Confirm output includes `creator` and `event`. |
| `convert_lead_status_won_to_converted.sql` | Converts existing lead status `won` to `converted` and updates the lead status check constraint. | Yes, if not already applied. | `select count(*) as won_count from public.leads where lead_status = 'won';` should return `0`; also check `select conname, pg_get_constraintdef(oid) from pg_constraint where conname = 'leads_lead_status_check';` includes `converted`. |
| `create_account_settings_tables.sql` | Creates account, privacy, and sharing settings tables with RLS owner policies and updated-at triggers. | Yes, if not already applied. | `select table_name from information_schema.tables where table_schema = 'public' and table_name in ('account_settings','privacy_settings','sharing_settings');` Also verify policies with `select tablename, policyname from pg_policies where schemaname = 'public' and tablename in ('account_settings','privacy_settings','sharing_settings');` |
| `create_app_users_onboarding.sql` | Creates `public.app_users` for onboarding state, index, RLS policy, and updated-at trigger. | Yes, if not already applied. | `select column_name from information_schema.columns where table_schema = 'public' and table_name = 'app_users' and column_name in ('id','email','display_name','onboarding_completed','onboarding_completed_at','created_at','updated_at');` Also verify `select indexname from pg_indexes where schemaname = 'public' and indexname = 'app_users_onboarding_completed_idx';` |
| `create_profile_avatars_storage_policies.sql` | Creates/updates public `profile-avatars` storage bucket and owner-scoped storage policies. | Yes, if not already applied. | `select id, name, public from storage.buckets where id = 'profile-avatars';` should show `public = true`. Also verify `select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'profile_avatars_%';` |
| `create_public_profile_lookup_rpc.sql` | Removes public table read policy, restricts `public_profiles` direct select, and creates public-safe `get_public_profile_by_slug` RPC. | Yes, if not already applied. | `select routine_name, security_type from information_schema.routines where specific_schema = 'public' and routine_name = 'get_public_profile_by_slug';` Also verify `select policyname from pg_policies where schemaname = 'public' and tablename = 'public_profiles';` does not include `public_profiles_public_read`. |

## Beta Verification Checklist

- [ ] Profile avatar storage policies: `profile-avatars` bucket exists, is public, and storage object policies allow public reads plus owner-only authenticated insert/update/delete.
- [ ] Creator/event profile types: `profiles_type_check` includes `creator` and `event`.
- [ ] Public-safe profile lookup RPC: `public.get_public_profile_by_slug(text)` exists, anon/authenticated can execute it, and direct anon select from `public.public_profiles` is not available.
- [ ] Contacts/leads indexes: all contact and lead search/sort indexes from `add_contact_lead_search_indexes.sql` exist.
- [ ] App users onboarding: `public.app_users` exists with onboarding fields, RLS enabled, self-owner policy, updated-at trigger, and onboarding index.
- [ ] Account settings tables: `public.account_settings`, `public.privacy_settings`, and `public.sharing_settings` exist with RLS enabled, owner policies, and updated-at triggers.

