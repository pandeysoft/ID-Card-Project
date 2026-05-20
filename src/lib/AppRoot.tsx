import { NavigationContainer } from '@react-navigation/native';
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
  const { loading, isAuthenticated } = useAuth();
  const { hasCompletedOnboarding, loading: onboardingLoading } = useOnboarding();

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
