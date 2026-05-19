import { createClient } from '@supabase/supabase-js';
import { publicEnv } from '../config/env';

export const supabase = createClient(
  publicEnv.supabaseUrl,
  publicEnv.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: false,
    },
  },
);
