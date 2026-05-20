import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { Linking } from 'react-native';
import { initializeUserProfiles } from '../services/bootstrapService';
import {
  getCurrentSession,
  handleAuthCallbackUrl,
  onAuthStateChange,
} from '../services/authService';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isDevelopmentAuthBypass: boolean;
  enableDevelopmentAuthBypass: () => void;
  clearDevelopmentAuthBypass: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const developmentUser: User = {
  app_metadata: { provider: 'development' },
  aud: 'authenticated',
  created_at: new Date(0).toISOString(),
  email: 'demo@cardiq.local',
  id: 'development-demo-user',
  user_metadata: { display_name: 'Demo User' },
};

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [developmentBypassEnabled, setDevelopmentBypassEnabled] = useState(false);
  const bootstrappedUserIds = useRef(new Set<string>());

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const initialUrl = await Linking.getInitialURL();

        if (initialUrl) {
          await handleAuthCallbackUrl(initialUrl).catch((error) => {
            console.warn('CardIQ auth callback failed.', error);
          });
        }

        const currentSession = await getCurrentSession();

        if (!mounted) {
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadSession();

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      void handleAuthCallbackUrl(url).catch((error) => {
        console.warn('CardIQ auth callback failed.', error);
      });
    });

    const subscription = onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      linkingSubscription.remove();
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (developmentBypassEnabled || !user || bootstrappedUserIds.current.has(user.id)) {
      return;
    }

    bootstrappedUserIds.current.add(user.id);

    void initializeUserProfiles(user).catch(() => {
      console.warn('CardIQ profile bootstrap failed.');
    });
  }, [developmentBypassEnabled, user]);

  function enableDevelopmentAuthBypass() {
    if (!__DEV__) {
      return;
    }

    setDevelopmentBypassEnabled(true);
    setUser(developmentUser);
    setSession(null);
    setLoading(false);
  }

  function clearDevelopmentAuthBypass() {
    if (!__DEV__) {
      return;
    }

    setDevelopmentBypassEnabled(false);
    setUser(null);
    setSession(null);
    setLoading(false);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      isAuthenticated: Boolean(session?.user) || developmentBypassEnabled,
      isDevelopmentAuthBypass: developmentBypassEnabled,
      enableDevelopmentAuthBypass,
      clearDevelopmentAuthBypass,
    }),
    [developmentBypassEnabled, loading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return value;
}
