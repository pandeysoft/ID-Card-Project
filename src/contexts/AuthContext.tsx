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
import { initializeUserProfiles } from '../services/bootstrapService';
import {
  getCurrentSession,
  onAuthStateChange,
} from '../services/authService';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const bootstrappedUserIds = useRef(new Set<string>());

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
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

    const subscription = onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || bootstrappedUserIds.current.has(user.id)) {
      return;
    }

    bootstrappedUserIds.current.add(user.id);

    void initializeUserProfiles(user).catch(() => {
      console.warn('CardIQ profile bootstrap failed.');
    });
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      isAuthenticated: Boolean(session?.user),
    }),
    [loading, session, user],
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
