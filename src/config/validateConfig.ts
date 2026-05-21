type PublicConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function validateSupabaseUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.protocol !== 'https:') {
      throw new Error('Supabase URL must use https.');
    }
  } catch {
    throw new Error('Invalid EXPO_PUBLIC_SUPABASE_URL. Expected a valid HTTPS URL.');
  }
}

function warnIfAnonKeyLooksUnsafe(value: string) {
  if (value.length < 20) {
    console.warn('EXPO_PUBLIC_SUPABASE_ANON_KEY looks unexpectedly short.');
  }
}

export function validatePublicConfig(config: PublicConfig): PublicConfig {
  validateSupabaseUrl(config.supabaseUrl);
  warnIfAnonKeyLooksUnsafe(config.supabaseAnonKey);

  return config;
}
