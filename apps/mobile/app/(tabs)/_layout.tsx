import { Tabs } from 'expo-router';
import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@cityborn/design-system';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[500],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Icon
              size={24}
              name={focused ? 'home_fill' : 'home_outline'}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: 'Jouer',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Icon
              size={24}
              name={focused ? 'gamepad_fill' : 'gamepad_outline'}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Icon
              size={24}
              name={focused ? 'profile_fill' : 'profile_outline'}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="components"
        options={{
          title: 'Composants',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Icon size={24} name="components_fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
