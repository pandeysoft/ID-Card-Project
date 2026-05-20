import { File, Paths } from 'expo-file-system';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  completeAppUserOnboarding,
  resetAppUserOnboarding,
  upsertAppUser,
} from '../services/appUserService';

type OnboardingContextValue = {
  hasCompletedOnboarding: boolean;
  loading: boolean;
  loadOnboardingForUser: (user: OnboardingUser | null) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
};

type OnboardingUser = {
  id: string;
  email?: string;
  displayName?: string;
  isLocalOnly: boolean;
};

type StoredOnboardingState = {
  hasCompletedOnboarding?: boolean;
};

const onboardingStateFile = new File(Paths.document, 'cardiq-onboarding-state.json');
const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState<OnboardingUser | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadInitialLocalState() {
      try {
        const storedState = await readLocalOnboardingState();

        if (mounted) {
          setHasCompletedOnboarding(storedState);
        }
      } catch (error) {
        console.warn('CardIQ onboarding state failed to load.', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadInitialLocalState();

    return () => {
      mounted = false;
    };
  }, []);

  const loadOnboardingForUser = useCallback(async (user: OnboardingUser | null) => {
    setActiveUser(user);
    setLoading(true);

    try {
      if (!user || user.isLocalOnly) {
        setHasCompletedOnboarding(await readLocalOnboardingState());
        return;
      }

      const appUser = await upsertAppUser({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      });

      setHasCompletedOnboarding(appUser.onboardingCompleted);
      await writeLocalOnboardingState(appUser.onboardingCompleted);
    } catch (error) {
      console.warn('CardIQ onboarding state failed to sync.', error);
      setHasCompletedOnboarding(await readLocalOnboardingState());
    } finally {
      setLoading(false);
    }
  }, []);

  const writeLocalOnboardingState = useCallback(async (nextValue: boolean) => {
    onboardingStateFile.write(JSON.stringify({ hasCompletedOnboarding: nextValue }));
    setHasCompletedOnboarding(nextValue);
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (activeUser && !activeUser.isLocalOnly) {
      try {
        const appUser = await completeAppUserOnboarding(activeUser.id);
        await writeLocalOnboardingState(appUser.onboardingCompleted);
        return;
      } catch (error) {
        console.warn('CardIQ onboarding completion failed to sync.', error);
      }
    }

    await writeLocalOnboardingState(true);
  }, [activeUser, writeLocalOnboardingState]);

  const resetOnboarding = useCallback(async () => {
    if (activeUser && !activeUser.isLocalOnly) {
      try {
        const appUser = await resetAppUserOnboarding(activeUser.id);
        await writeLocalOnboardingState(appUser.onboardingCompleted);
        return;
      } catch (error) {
        console.warn('CardIQ onboarding reset failed to sync.', error);
      }
    }

    await writeLocalOnboardingState(false);
  }, [activeUser, writeLocalOnboardingState]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      hasCompletedOnboarding,
      loading,
      loadOnboardingForUser,
      completeOnboarding,
      resetOnboarding,
    }),
    [completeOnboarding, hasCompletedOnboarding, loadOnboardingForUser, loading, resetOnboarding],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

async function readLocalOnboardingState() {
  if (!onboardingStateFile.exists) {
    return false;
  }

  const rawState = await onboardingStateFile.text();
  const storedState = JSON.parse(rawState) as StoredOnboardingState;

  return Boolean(storedState.hasCompletedOnboarding);
}

export function useOnboarding() {
  const value = useContext(OnboardingContext);

  if (!value) {
    throw new Error('useOnboarding must be used within an OnboardingProvider.');
  }

  return value;
}
