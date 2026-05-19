import type { AuthChangeEvent, Session, Subscription, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type AuthStateChangeCallback = (
  event: AuthChangeEvent,
  session: Session | null,
) => void;

function toAuthError(error: Error | null): Error | null {
  if (!error) {
    return null;
  }

  return new Error(error.message || 'Supabase authentication request failed.');
}

export async function signInWithEmail(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Email is required to sign in.');
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
  });

  const authError = toAuthError(error);
  if (authError) {
    throw authError;
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  const authError = toAuthError(error);

  if (authError) {
    throw authError;
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  const authError = toAuthError(error);

  if (authError) {
    throw authError;
  }

  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  const authError = toAuthError(error);

  if (authError) {
    throw authError;
  }

  return data.user;
}

export function onAuthStateChange(
  callback: AuthStateChangeCallback,
): Subscription {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return data.subscription;
}
