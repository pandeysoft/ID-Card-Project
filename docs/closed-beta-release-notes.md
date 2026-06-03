# Closed Beta Release Notes

## Current Readiness Verdict

CardIQ is ready for controlled closed beta validation after manual Supabase checks and real-device smoke tests. It is not ready for public launch until the blockers below are resolved.

Run the automated pre-beta check before each beta build:

```sh
npm run verify:beta
```

## Features Ready for Beta

- Profile creation and editing foundation.
- Public/private profile publishing flow.
- Public profile lookup through the public-safe RPC path.
- QR-based public profile sharing flow.
- Contact save and lead workflow foundations.
- Developer diagnostics and beta smoke checklist in dev builds.
- Account/data, legal, and support placeholders.

## Features Intentionally Limited/Disabled

- OCR is intentionally disabled and should show coming soon.
- Networking is preview/mock and not production-ready.
- Export my data and delete account controls are placeholders only.
- Legal/support links are placeholders only.
- OAuth/magic-link Expo Go redirect is still a known dev testing issue.

## Known Blockers Before Public Launch

- Production auth redirect behavior must be validated outside Expo Go.
- Legal pages and support intake must be connected.
- Account export and deletion flows must be implemented safely.
- Networking must move from preview/mock behavior to production behavior or remain hidden.
- Supabase migrations must be confirmed in the target project.

## Required Manual Supabase Checks

- Confirm all migrations listed in `docs/supabase-migration-status.md` are applied.
- Confirm `profile-avatars` bucket exists, is public, and has owner-scoped write policies.
- Confirm creator/event profile types are allowed.
- Confirm public profile privacy uses RPC and direct public table reads are not exposed.
- Confirm contacts/leads indexes exist.
- Confirm app user onboarding and account settings tables exist with RLS policies.

## Required Real-Device Smoke Tests

- Auth sign-in works on target beta device/build.
- Session persists after app restart.
- Onboarding persists.
- Create and edit profile.
- Toggle public/private.
- Hide/show profile link.
- Public preview matches expected public data.
- Avatar upload works.
- Public QR opens public profile.
- Private QR shows unavailable.
- Save public profile as contact.
- Contact links persist.
- Create lead and update lead status.
- OCR shows coming soon.

## Recommended Beta Tester Instructions

- Use the beta build on a real device, not only Expo Go.
- Do not share sensitive production data during closed beta.
- Report screenshots, device model, OS version, and exact steps for failures.
- Verify public profiles do not expose private email, phone, location, user id, or hidden links.
- Treat networking, OCR, account deletion/export, and legal/support links as unfinished placeholders.

