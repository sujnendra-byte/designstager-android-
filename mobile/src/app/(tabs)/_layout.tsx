import React from 'react';
import { Tabs } from 'expo-router/js-tabs';
import { Ionicons } from '@expo/vector-icons';
import { C, F } from '../../lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;
const icon = (on: IconName, off: IconName) =>
  ({ color, focused }: { color: any; focused: boolean }) => <Ionicons name={focused ? on : off} size={23} color={color} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.orange,
        tabBarInactiveTintColor: '#8a90aa',
        tabBarLabelStyle: { fontFamily: F.medium, fontSize: 11 },
        tabBarStyle: { borderTopColor: C.line, backgroundColor: '#fff' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="create" options={{ title: 'Create', tabBarIcon: icon('sparkles', 'sparkles-outline') }} />
      <Tabs.Screen name="market" options={{ title: 'Market', tabBarIcon: icon('bag-handle', 'bag-handle-outline') }} />
      <Tabs.Screen name="creations" options={{ title: 'Creations', tabBarIcon: icon('folder', 'folder-outline') }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: icon('person-circle', 'person-circle-outline') }} />
    </Tabs>
  );
}
