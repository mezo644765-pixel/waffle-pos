import React from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';

export default function UserTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'extraLight'}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="sales"
        options={{
          title: 'البيع',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'مبيعاتي',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
