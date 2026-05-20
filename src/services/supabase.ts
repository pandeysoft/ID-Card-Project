import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { publicEnv } from '../config/env';

const secureAuthStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  publicEnv.supabaseUrl,
  publicEnv.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
      storage: secureAuthStorage,
    },
  },
);
