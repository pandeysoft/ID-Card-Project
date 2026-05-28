import { supabase } from './supabase';

export type SupabaseHealthResult = {
  ok: boolean;
  message: string;
};

export async function checkSupabaseConnection(): Promise<SupabaseHealthResult> {
  try {
    const { error } = await supabase
      .rpc('get_public_profile_by_slug', { profile_slug: '__health_check__' });

    if (error) {
      return {
        ok: false,
        message: error.message || 'Supabase connection check failed.',
      };
    }

    return {
      ok: true,
      message: 'Supabase connection is available.',
    };
  } catch {
    return {
      ok: false,
      message: 'Supabase connection check failed.',
    };
  }
}
