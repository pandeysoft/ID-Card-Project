import type { AuthChangeEvent, Session, Subscription, User } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import { supabase } from './supabase';

// Google OAuth setup required:
// 1. Enable Google provider in Supabase Dashboard -> Authentication -> Providers.
// 2. Add Google OAuth client ID/secret from Google Cloud Console to Supabase.
// 3. Add the Supabase OAuth callback URL to Google Console authorized redirect URIs.
// 4. Add the redirect URLs from getAuthRedirectTo() to Supabase Dashboard -> Authentication -> URL Configuration.

const authRedirectPath = 'auth/callback';
const productionNativeRedirectTo = 'cardiq://auth/callback';

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

  const redirectTo = getAuthRedirectTo();
  console.log('CardIQ auth redirectTo:', redirectTo);

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  const authError = toAuthError(error);
  if (authError) {
    throw authError;
  }
}

export async function signInWithGoogle(): Promise<void> {
  const redirectTo = getAuthRedirectTo();
  console.log('CardIQ auth redirectTo:', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
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

  const authRequest = new AuthSession.AuthRequest({
    clientId: 'supabase',
    redirectUri: redirectTo,
    responseType: AuthSession.ResponseType.Code,
    state: getAuthParams(data.url).get('state') ?? undefined,
    usePKCE: false,
  });

  const result = await authRequest.promptAsync(
    { authorizationEndpoint: data.url },
    { url: data.url },
  );
  const resultUrl = 'url' in result ? result.url : undefined;
  console.log('CardIQ Google OAuth AuthSession result:', {
    type: result.type,
    hasUrl: Boolean(resultUrl),
    url: resultUrl ? sanitizeAuthUrlForLog(resultUrl) : undefined,
  });

  if (result.type === 'success') {
    await handleAuthCallbackUrl(result.url);
    return;
  }

  if (result.type === 'error') {
    throw new Error(result.error?.message || 'Google sign-in failed.');
  }

  if (result.type !== 'cancel' && result.type !== 'dismiss') {
    throw new Error('Google sign-in did not complete.');
  }
}

export async function handleAuthCallbackUrl(url: string): Promise<Session | null> {
  if (!isAuthCallbackUrl(url)) {
    return null;
  }

  const params = getAuthParams(url);
  const code = params.get('code');

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    const authError = toAuthError(error);

    if (authError) {
      console.warn('CardIQ exchangeCodeForSession error:', authError.message);
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

function getAuthRedirectTo(): string {
  // Expo Go/dev: AuthSession generates a reachable exp://.../--/auth/callback URL
  // for the current Metro host instead of using localhost or a fixed custom scheme.
  // Production: keep cardiq://auth/callback for standalone builds until universal
  // links/app links are configured, then replace native with that production URL.
  return AuthSession.makeRedirectUri({
    native: productionNativeRedirectTo,
    path: authRedirectPath,
    scheme: 'cardiq',
  });
}

export function isAuthCallbackUrl(url: string): boolean {
  return url.includes(authRedirectPath);
}

export function sanitizeAuthUrlForLog(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const origin = parsedUrl.host
      ? `${parsedUrl.protocol}//${parsedUrl.host}`
      : parsedUrl.protocol;

    return `${origin}${parsedUrl.pathname}`;
  } catch {
    return url.split(/[?#]/)[0] ?? '';
  }
}

function getAuthParams(url: string): URLSearchParams {
  const query = url.includes('?') ? url.split('?')[1]?.split('#')[0] : '';
  const hash = url.includes('#') ? url.split('#')[1] : '';

  return new URLSearchParams([query, hash].filter(Boolean).join('&'));
}
