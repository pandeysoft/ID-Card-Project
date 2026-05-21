import { supabase } from './supabase';
import type { AppUser } from '../types';
import type { Database } from '../types/database';

export type UpsertAppUserInput = {
  id: string;
  email?: string;
  displayName?: string;
};

type AppUserRow = Database['public']['Tables']['app_users']['Row'];

function assertNoError(error: Error | null, fallbackMessage: string): void {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

export async function getAppUser(userId: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', userId)
    .returns<AppUserRow[]>()
    .maybeSingle();

  assertNoError(error, 'Unable to load app user.');
  return data ? mapAppUserRow(data) : null;
}

export async function upsertAppUser(user: UpsertAppUserInput): Promise<AppUser> {
  const { data, error } = await supabase
    .from('app_users')
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        display_name: user.displayName ?? null,
      },
      { onConflict: 'id' },
    )
    .select('*')
    .returns<AppUserRow[]>()
    .single();

  assertNoError(error, 'Unable to save app user.');
  if (!data) {
    throw new Error('Unable to save app user.');
  }

  return mapAppUserRow(data);
}

export async function completeAppUserOnboarding(userId: string): Promise<AppUser> {
  const completedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('app_users')
    .update({
      onboarding_completed: true,
      onboarding_completed_at: completedAt,
    })
    .eq('id', userId)
    .select('*')
    .returns<AppUserRow[]>()
    .single();

  assertNoError(error, 'Unable to complete onboarding.');
  if (!data) {
    throw new Error('Unable to complete onboarding.');
  }

  return mapAppUserRow(data);
}

export async function resetAppUserOnboarding(userId: string): Promise<AppUser> {
  const { data, error } = await supabase
    .from('app_users')
    .update({
      onboarding_completed: false,
      onboarding_completed_at: null,
    })
    .eq('id', userId)
    .select('*')
    .returns<AppUserRow[]>()
    .single();

  assertNoError(error, 'Unable to reset onboarding.');
  if (!data) {
    throw new Error('Unable to reset onboarding.');
  }

  return mapAppUserRow(data);
}

function mapAppUserRow(row: AppUserRow): AppUser {
  return {
    id: row.id,
    email: row.email ?? undefined,
    displayName: row.display_name ?? undefined,
    onboardingCompleted: row.onboarding_completed,
    onboardingCompletedAt: row.onboarding_completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
