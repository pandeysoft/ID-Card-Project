import appConfig from '../../app.json';
import { publicEnv } from '../config/env';
import { getPublicProfileBySlug } from './publicProfileService';
import { supabase } from './supabase';
import { checkSupabaseConnection } from './healthService';

export type DiagnosticStatus = 'PASS' | 'FAIL' | 'UNKNOWN';

export type DiagnosticCheck = {
  label: string;
  status: DiagnosticStatus;
  value?: string;
};

export type DiagnosticsSnapshot = {
  appVersion: string;
  environment: 'dev' | 'prod';
  supabaseUrlConfigured: DiagnosticStatus;
  supabaseUrl: string;
  checks: DiagnosticCheck[];
};

export async function getDiagnosticsSnapshot(): Promise<DiagnosticsSnapshot> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const session = sessionData.session;
  const rpcHealth = await toCheck('RPC health check', () => checkSupabaseConnection());
  const publicProfileRpc = await toCheck('Public profile RPC', async () => {
    await getPublicProfileBySlug('__health_check__');
    return { ok: true };
  });
  const storageBucket = await toCheck('Storage bucket profile-avatars', async () => {
    const { error } = await supabase.storage.from('profile-avatars').list('', { limit: 1 });
    return { ok: !error };
  });

  return {
    appVersion: appConfig.expo.version,
    environment: __DEV__ ? 'dev' : 'prod',
    supabaseUrlConfigured: publicEnv.supabaseUrl ? 'PASS' : 'FAIL',
    supabaseUrl: publicEnv.supabaseUrl,
    checks: [
      {
        label: 'Auth session',
        status: sessionError ? 'FAIL' : session ? 'PASS' : 'UNKNOWN',
        value: session ? 'Authenticated' : 'No active session',
      },
      {
        label: 'Current user id',
        status: session?.user?.id ? 'PASS' : 'UNKNOWN',
        value: session?.user?.id,
      },
      rpcHealth,
      publicProfileRpc,
      storageBucket,
    ],
  };
}

async function toCheck(
  label: string,
  run: () => Promise<{ ok: boolean }>,
): Promise<DiagnosticCheck> {
  try {
    const result = await run();
    return { label, status: result.ok ? 'PASS' : 'FAIL' };
  } catch {
    return { label, status: 'FAIL' };
  }
}
