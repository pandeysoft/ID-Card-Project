import type { AuthChangeEvent, Session, Subscription, User } from '@supabase/supabase-js';
import { Linking } from 'react-native';
import { supabase } from './supabase';

const authRedirectTo = 'cardiq://auth/callback';

// Google OAuth setup required:
// 1. Enable Google provider in Supabase Dashboard -> Authentication -> Providers.
// 2. Add Google OAuth client ID/secret from Google Cloud Console to Supabase.
// 3. Add the Supabase OAuth callback URL to Google Console authorized redirect URIs.
// 4. Add cardiq://auth/callback to Supabase Dashboard -> Authentication -> URL Configuration.

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
    options: {
      emailRedirectTo: authRedirectTo,
    },
  });

  const authError = toAuthError(error);
  if (authError) {
    throw authError;
  }
}

export async function signInWithGoogle(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: authRedirectTo,
      skipBrowserRedirect: true,
    },
  });

  const authError = toAuthError(error);
  if (authError) {
    throw authError;
  }

  if (!data.url) {
    throw new Error('Unable to start Google sign-in.');
  }

  const canOpen = await Linking.canOpenURL(data.url);

  if (!canOpen) {
    throw new Error('Unable to open Google sign-in URL.');
  }

  await Linking.openURL(data.url);
}

export async function handleAuthCallbackUrl(url: string): Promise<Session | null> {
  const params = getAuthParams(url);
  const code = params.get('code');

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    const authError = toAuthError(error);

    if (authError) {
      throw authError;
    }

    return data.session;
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    const authError = toAuthError(error);

    if (authError) {
      throw authError;
    }

    return data.session;
  }

  return null;
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

function getAuthParams(url: string): URLSearchParams {
  const query = url.includes('?') ? url.split('?')[1]?.split('#')[0] : '';
  const hash = url.includes('#') ? url.split('#')[1] : '';

  return new URLSearchParams([query, hash].filter(Boolean).join('&'));
}
