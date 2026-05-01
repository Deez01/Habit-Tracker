import { useEffect, useRef, useState } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
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

  // Pause rendering until sign out finishes.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const forceSignOutOnOpen = async () => {
      if (hasForcedLogout.current) return;
      hasForcedLogout.current = true;

      try {
        await supabase.auth.signOut();
        console.log("Forced sign out on app open");
      } catch (error) {
        console.log("Error forcing sign out on app open:", error);
      } finally {
        setIsReady(true);
      }
    };

    forceSignOutOnOpen();
  }, []);

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