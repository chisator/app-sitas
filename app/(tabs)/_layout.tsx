import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#06b6d4', // Cyan neon
        tabBarInactiveTintColor: '#64748b', // Slate 500
        tabBarStyle: {
          backgroundColor: '#0f172a', // Slate 900
          borderTopColor: '#1e293b', // Slate 800
          height: 60 + (Platform.OS === 'ios' ? insets.bottom : insets.bottom / 2),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : insets.bottom / 2 + 8,
          paddingTop: 8,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="registros"
        options={{
          title: 'Registros',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="clipboard-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progreso"
        options={{
          title: 'Progreso',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="stats-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="mas"
        options={{
          title: 'Más',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="menu" color={color} />,
        }}
      />
    </Tabs>
  );
}
