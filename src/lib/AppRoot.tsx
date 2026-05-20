import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, OnboardingProvider, useAuth, useOnboarding } from '../contexts';
import { RootNavigator } from '../navigation/EditProfileNavigation';
import { AuthScreen } from '../screens/AuthScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { colors } from '../theme';
import { theme } from '../theme/theme';

export function AppRoot() {
  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}

function AuthGate() {
  const { loading, isAuthenticated, isDevelopmentAuthBypass, user } = useAuth();
  const {
    hasCompletedOnboarding,
    loadOnboardingForUser,
    loading: onboardingLoading,
  } = useOnboarding();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!isAuthenticated || !user) {
      void loadOnboardingForUser(null);
      return;
    }

    void loadOnboardingForUser({
      id: user.id,
      email: user.email,
      displayName: getDisplayName(user.user_metadata?.display_name),
      isLocalOnly: isDevelopmentAuthBypass,
    });
  }, [isAuthenticated, isDevelopmentAuthBypass, loadOnboardingForUser, loading, user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (onboardingLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen />;
  }

  return (
    <NavigationContainer theme={theme.navigation}>
      <RootNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});

function getDisplayName(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}
