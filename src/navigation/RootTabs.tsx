import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { ContactsScreen } from '../screens/ContactsScreen';
import { ExchangeRequestsScreen } from '../screens/ExchangeRequestsScreen';
import { MyCardScreen } from '../screens/MyCardScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors, spacing, typography } from '../theme';
import { RootTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<RootTabParamList>();

const tabIcons: Record<keyof RootTabParamList, string> = {
  MyCard: 'ID',
  Scan: '[]',
  Contacts: '@',
  Exchange: '<>',
  Settings: '*',
};

export function RootTabs() {
  return (
    <Tab.Navigator
      initialRouteName="MyCard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarLabelStyle: {
          fontSize: typography.sizes.caption,
          fontWeight: '600',
          paddingBottom: spacing.xs,
        },
        tabBarStyle: {
          height: 72,
          paddingTop: spacing.sm,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: typography.sizes.heading }}>
            {tabIcons[route.name]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="MyCard" component={MyCardScreen} options={{ title: 'My Card' }} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen name="Exchange" component={ExchangeRequestsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
