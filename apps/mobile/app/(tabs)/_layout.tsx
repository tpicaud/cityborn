import { Tabs } from 'expo-router';
import React from 'react';
import { IconSymbol } from '@/components/ui/Icon-symbol';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: 'Play',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="gamecontroller.circle.fill"
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
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.2.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="components"
        options={{
          title: 'Components',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="cube.box.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
