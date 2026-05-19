type PublicEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function readRequiredEnv(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to your Expo environment before using Supabase.`,
    );
  }

  return value;
}

export const publicEnv: PublicEnv = {
  supabaseUrl: readRequiredEnv(
    'EXPO_PUBLIC_SUPABASE_URL',
    process.env.EXPO_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: readRequiredEnv(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  ),
};
