import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Octicons from '@expo/vector-icons/Octicons';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Octicons name="home-fill" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="habbits"
        options={{
          title: 'Habbits',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="heart-plus" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="streak"
        options={{
          title: 'Streak',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-clear" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="customize"
        options={{
          title: 'Customize',
          tabBarIcon: ({ color }) => <Entypo name="pencil" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="aboutpage"
        options={{
          title: 'About Page',
          tabBarIcon: ({ color }) => <FontAwesome5 name="question" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
