# CardIQ Supabase Setup

## Apply the schema

1. Open your Supabase project dashboard.
2. In the left sidebar, open **SQL Editor**.
3. Create a new query.
4. Open `supabase/schema.sql` from this repo.
5. Paste the full SQL contents into the Supabase SQL Editor.
6. Click **Run**.

## Environment variables

The app expects these public Expo environment variables:

```powershell
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Use the anon key only. Never expose the Supabase `service_role` key in the app, client code, `.env` files shipped to mobile, or Expo public environment variables.

## Start Expo locally

PowerShell example:

```powershell
$env:EXPO_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
$env:EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
npm.cmd start
```

## Checklist

- Confirm the SQL completed without errors.
- Confirm all tables exist in Supabase Table Editor.
- Confirm Row Level Security is enabled on the new tables.
- Confirm public profile rows are readable by public users.
- Confirm authenticated users can only manage their own records.
- Keep `service_role` keys server-side only.
