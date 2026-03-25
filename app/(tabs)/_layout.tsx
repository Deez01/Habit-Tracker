import { Tabs } from 'expo-router';
import React from 'react';

// Custom tab button that adds haptic (vibration) feedback when pressed
import { HapticTab } from '@/components/haptic-tab';

// App color system
import { Colors } from '@/constants/theme';

// Detects light/dark mode
import { useColorScheme } from '@/hooks/use-color-scheme';

// Icon libraries used for tab bar icons
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Octicons from '@expo/vector-icons/Octicons';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

export default function TabLayout() {
  // Detect whether the app is in light or dark mode
  const colorScheme = useColorScheme();

  return (
    /**
     * Tabs is the main navigation container for the bottom tab bar.
     * Each <Tabs.Screen> represents one tab in the app.
     */
    <Tabs
      screenOptions={{
        /**
         * Controls the color of the active (selected) tab icon.
         * Uses the app's theme system so it changes with light/dark mode.
         */
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,

        /**
         * Hides the default header at the top of each screen.
         * This allows full control over custom UI layouts.
         */
        headerShown: false,

        /**
         * Replaces the default tab button with a custom one.
         * This version adds haptic feedback (small vibration) on tap.
         */
        tabBarButton: HapticTab,

        /**
         * Styles the bottom tab bar itself.
         */
        tabBarStyle: {
          backgroundColor: '#000000', // Dark background for a clean UI
          borderTopWidth: 0,          // Removes default border line
          height: 70,                 // Makes tab bar taller
          paddingBottom: 10,          // Adds spacing for better icon alignment
        },
      }}
    >
      {/* 
        HOME TAB
        This loads app/(tabs)/index.tsx
      */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',

          /**
           * Icon shown in the tab bar.
           * Octicons library is used here.
           */
          tabBarIcon: ({ color }) => (
            <Octicons name="home-fill" size={26} color={color} />
          ),
        }}
      />

      {/* 
        HABITS TAB
        This loads app/(tabs)/habits.tsx
      */}
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',

          /**
           * Icon representing habits (adding new habits / actions).
           * Uses MaterialCommunityIcons.
           */
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="heart-plus" size={26} color={color} />
          ),
        }}
      />

      {/* 
        STREAK TAB
        This loads app/(tabs)/streak.tsx
      */}
      <Tabs.Screen
        name="streak"
        options={{
          title: 'Streak',

          /**
           * Calendar icon represents tracking progress over time.
           */
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-clear" size={26} color={color} />
          ),
        }}
      />

      {/* 
        CUSTOMIZE TAB
        This loads app/(tabs)/customize.tsx
      */}
      <Tabs.Screen
        name="customize"
        options={{
          title: 'Customize',

          /**
           * Pencil icon represents editing/customizing features.
           */
          tabBarIcon: ({ color }) => (
            <Entypo name="pencil" size={26} color={color} />
          ),
        }}
      />

      {/* 
        ABOUT TAB
        This loads app/(tabs)/aboutpage.tsx
      */}
      <Tabs.Screen
        name="aboutpage"
        options={{
          title: 'About',

          /**
           * Question icon represents help/about information.
           */
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="question" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}