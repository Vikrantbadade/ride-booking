import React from 'react';
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';

type Role = 'passenger' | 'driver' | 'admin';

const roleConfig: Record<Role, { accent: string; tabs: { name: string; title: string; icon: keyof typeof Ionicons.glyphMap }[] }> = {
  passenger: {
    accent: Colors.brand.accent,
    tabs: [
      { name: 'home', title: 'Book', icon: 'map-outline' },
      { name: 'booking', title: 'My Ride', icon: 'car-outline' },
      { name: 'history', title: 'History', icon: 'time-outline' },
      { name: 'profile', title: 'Profile', icon: 'person-outline' },
    ],
  },
  driver: {
    accent: Colors.status.success,
    tabs: [
      { name: 'home', title: 'Dashboard', icon: 'speedometer-outline' },
      { name: 'ride', title: 'Active Ride', icon: 'car-sport-outline' },
      { name: 'earnings', title: 'Earnings', icon: 'wallet-outline' },
      { name: 'profile', title: 'Profile', icon: 'person-outline' },
    ],
  },
  admin: {
    accent: Colors.status.warning,
    tabs: [
      { name: 'home', title: 'Dashboard', icon: 'grid-outline' },
      { name: 'verifications', title: 'Verify', icon: 'shield-checkmark-outline' },
      { name: 'drivers', title: 'Drivers', icon: 'people-outline' },
    ],
  },
};

export function RoleTabs({ role }: { role: Role }) {
  const insets = useSafeAreaInsets();
  const config = roleConfig[role];
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { height: 60 + bottomInset, paddingBottom: bottomInset }],
        tabBarActiveTintColor: config.accent,
        tabBarInactiveTintColor: Colors.text.muted,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIcon,
      }}
    >
      {config.tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: `${tab.title} tab`,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={tab.icon} size={focused ? Math.max(size, 22) : size} color={color} accessible={false} importantForAccessibility="no" />
            ),
          }}
        />
      ))}
      {role === 'passenger' ? <Tabs.Screen name="payment" options={{ href: null }} /> : null}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.bg.secondary,
    borderTopColor: Colors.bg.glassBorder,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 7,
  },
  tabLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.15, marginTop: 1 },
  tabIcon: { marginTop: 1 },
});
