import { File, Paths } from 'expo-file-system';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

type OnboardingContextValue = {
  hasCompletedOnboarding: boolean;
  loading: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
};

type StoredOnboardingState = {
  hasCompletedOnboarding?: boolean;
};

const onboardingStateFile = new File(Paths.document, 'cardiq-onboarding-state.json');
const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadOnboardingState() {
      try {
        if (!onboardingStateFile.exists) {
          return;
        }

        const rawState = await onboardingStateFile.text();
        const storedState = JSON.parse(rawState) as StoredOnboardingState;

        if (mounted) {
          setHasCompletedOnboarding(Boolean(storedState.hasCompletedOnboarding));
        }
      } catch (error) {
        console.warn('CardIQ onboarding state failed to load.', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadOnboardingState();

    return () => {
      mounted = false;
    };
  }, []);

  async function writeOnboardingState(nextValue: boolean) {
    onboardingStateFile.write(JSON.stringify({ hasCompletedOnboarding: nextValue }));
    setHasCompletedOnboarding(nextValue);
  }

  const value = useMemo<OnboardingContextValue>(
    () => ({
      hasCompletedOnboarding,
      loading,
      completeOnboarding: () => writeOnboardingState(true),
      resetOnboarding: () => writeOnboardingState(false),
    }),
    [hasCompletedOnboarding, loading],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const value = useContext(OnboardingContext);

  if (!value) {
    throw new Error('useOnboarding must be used within an OnboardingProvider.');
  }

  return value;
}
