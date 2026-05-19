import { supabase } from './supabase';

export type SupabaseHealthResult = {
  ok: boolean;
  message: string;
};

export async function checkSupabaseConnection(): Promise<SupabaseHealthResult> {
  try {
    const { error } = await supabase
      .from('public_profiles')
      .select('id')
      .limit(1);

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
