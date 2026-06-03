import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ContactDetailScreen } from '../screens/ContactDetailScreen';
import { DiagnosticsScreen } from '../screens/DiagnosticsScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { LeadCaptureScreen } from '../screens/LeadCaptureScreen';
import { LeadDetailScreen } from '../screens/LeadDetailScreen';
import { LeadsScreen } from '../screens/LeadsScreen';
import { NetworkingScreen } from '../screens/NetworkingScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PublicProfileScreen } from '../screens/PublicProfileScreen';
import type { RootStackParamList } from '../types/navigation';
import { RootTabs } from './RootTabs';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={RootTabs} />
      <Stack.Screen name="ContactDetail" component={ContactDetailScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
      <Stack.Screen name="LeadCapturePreview" component={LeadCaptureScreen} />
      <Stack.Screen name="LeadsPreview" component={LeadsScreen} />
      <Stack.Screen name="LeadDetail" component={LeadDetailScreen} />
      <Stack.Screen name="NetworkingPreview" component={NetworkingScreen} />
      <Stack.Screen name="OnboardingPreview" component={OnboardingScreen} />
      {__DEV__ ? <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} /> : null}
    </Stack.Navigator>
  );
}
