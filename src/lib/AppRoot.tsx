import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts';
import { RootTabs } from '../navigation/RootTabs';
import { theme } from '../theme/theme';

export function AppRoot() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={theme.navigation}>
          <RootTabs />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
