import { useEffect, useRef, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/supabase/supabase";

export default function RootLayout() {
  // Detect current light/dark mode for app theming.
  const colorScheme = useColorScheme();

  // Prevent the forced logout logic from running more than once per app launch.
  const hasForcedLogout = useRef(false);

  // Used to pause rendering until the initial logout check finishes.
  // This prevents the app from briefly showing tabs before the logout completes.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    /**
     * This effect runs once when the app starts.
     *
     * Goal:
     * Force the user to sign in again every time the app is opened.
     *
     * Important:
     * We only sign out here.
     * We do NOT navigate here, because navigating from the root layout
     * can cause loops and unstable routing behavior.
     */
    const forceSignOutOnOpen = async () => {
      // Stop if this has already run once.
      if (hasForcedLogout.current) return;
      hasForcedLogout.current = true;

      try {
        await supabase.auth.signOut();
        console.log("Forced sign out on app open");
      } catch (error) {
        console.log("Error forcing sign out on app open:", error);
      } finally {
        // Allow the app to render after logout attempt finishes.
        setIsReady(true);
      }
    };

    forceSignOutOnOpen();
  }, []);

  // While the initial auth reset is happening, render nothing.
  // This avoids flashing the wrong screen on first launch.
  if (!isReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Auth screens */}
          <Stack.Screen name="(auth)/sign-in" />
          <Stack.Screen name="(auth)/onboarding" />

          {/* Main app tabs */}
          <Stack.Screen name="(tabs)" />

          {/* Modal screen */}
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}