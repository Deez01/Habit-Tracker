import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

/*
  TabLayout
  ---------
  Defines the bottom tab navigation for the app.

  Responsibilities:
  - Controls tab structure and routing
  - Applies consistent styling to the tab bar
  - Assigns icons and labels for each screen
*/
export default function TabLayout() {
  // Detect system theme (light/dark)
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        /*
          Active tab color (depends on theme)
        */
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,

        /*
          Remove default header for all tabs
          (you control layout manually inside each screen)
        */
        headerShown: false,

        /*
          Custom tab button with haptic feedback
        */
        tabBarButton: HapticTab,

        /*
          Tab bar styling
        */
        tabBarStyle: {
          backgroundColor: "#000000",
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
        },
      }}
    >
      {/* ===== STREAK TAB ===== */}
      <Tabs.Screen
        name="streak"
        options={{
          title: "Streak",

          /*
            Icon: progress indicator
          */
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="progress-check"
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* ===== TODAY TAB ===== */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",

          /*
            Icon: stopwatch/timer
          */
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="timer-outline"
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* ===== UPCOMING TAB ===== */}
      <Tabs.Screen
        name="upcoming"
        options={{
          title: "Next Stops",

          /*
            Icon: train (fits theme)
          */
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="train" size={26} color={color} />
          ),
        }}
      />

      {/* ===== PROFILE TAB ===== */}
      <Tabs.Screen
        name="aboutpage"
        options={{
          title: "Profile",

          /*
            Icon: user/profile
          */
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
