import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/supabase/supabase";

// Defines the two modes this screen can be in:
// - signIn: existing users log in
// - signUp: new users create an account
type AuthMode = "signIn" | "signUp";

export default function SignInScreen() {
  // Detect current theme (light/dark) for styling
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  // Router is used to navigate between screens
  const router = useRouter();

  // Tracks whether we are signing in or signing up
  const [mode, setMode] = useState<AuthMode>("signIn");

  // Form inputs
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(""); // only used for sign-up
  const [password, setPassword] = useState("");

  // Prevents multiple submissions at once
  const [busy, setBusy] = useState(false);

  // Stores error messages to display to the user
  const [error, setError] = useState<string | null>(null);

  // Stores the current auth session (if logged in)
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    /**
     * This effect:
     * 1. Gets the current session when the screen loads
     * 2. Subscribes to authentication changes (login/logout)
     * 3. Updates local session state whenever auth changes
     */

    // Get current session immediately
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    // Listen for auth changes (login, logout, refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    // Cleanup: unsubscribe when component unmounts
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    /**
     * Whenever the session changes:
     * - check if the user has completed onboarding
     * - route them to the correct screen
     */

    const checkProfileAndRoute = async () => {
      // If no logged-in user, do nothing
      if (!session?.user) return;

      // Check if the user has a profile in the database
      const { data: profile, error } = await supabase
        .from("users")
        .select("profile_complete")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.log("Error checking profile:", error.message);
        return;
      }

      // If no profile exists yet, send user to onboarding
      if (!profile) {
        router.replace("/(auth)/onboarding");
        return;
      }

      // If onboarding is complete → go to main app
      if (profile.profile_complete) {
        router.replace("/(tabs)");
      } 
      // Otherwise → finish onboarding first
      else {
        router.replace("/(auth)/onboarding");
      }
    };

    checkProfileAndRoute();
  }, [session]);

  /**
   * Handles both:
   * - Signing in existing users
   * - Creating new accounts
   */
  const handleSubmit = async () => {
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      if (mode === "signIn") {
        /**
         * SIGN IN FLOW
         * Uses Supabase authentication with email + password
         */
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
      } else {
        /**
         * SIGN UP FLOW
         * 1. Validate inputs
         * 2. Create auth account
         * 3. Create user profile row in database
         */

        // Basic validation
        if (!email.trim() || !username.trim()) {
          throw new Error("Email and username required");
        }

        // Create auth account
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        const userId = data.user?.id;

        // Safety check in case user creation failed
        if (!userId) {
          throw new Error("User account was created, but user id was missing.");
        }

        /**
         * Create a row in the "users" table
         * This stores extra app-specific data (username, onboarding status)
         */
        const { error: upsertError } = await supabase.from("users").upsert({
          id: userId,
          email: email.trim(),
          username: username.trim(),
          profile_complete: false, // onboarding not finished yet
        });

        if (upsertError) throw upsertError;
      }
    } catch (err: any) {
      // Show error to user
      setError(err.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container} lightColor="#fff" darkColor="#151718">
      {/* Keeps inputs visible when keyboard opens */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.content}
      >
        <View
          style={[
            styles.card,
            { borderColor: theme.icon, backgroundColor: theme.background },
          ]}
        >
          <ThemedText type="title">Welcome to StayonTrack</ThemedText>

          {/* 
            If in sign-in mode:
            - only show email field
            If in sign-up mode:
            - show email + username
          */}
          {mode === "signIn" ? (
            <TextInput
              placeholder="Email"
              placeholderTextColor={theme.icon}
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
            />
          ) : (
            <>
              <TextInput
                placeholder="Email"
                placeholderTextColor={theme.icon}
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
              />
              <TextInput
                placeholder="Username"
                placeholderTextColor={theme.icon}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
                style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
              />
            </>
          )}

          {/* Password field (used in both modes) */}
          <TextInput
            placeholder="Password"
            placeholderTextColor={theme.icon}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
          />

          {/* Display error if one exists */}
          {error && <ThemedText style={{ color: "#B00020" }}>{error}</ThemedText>}

          {/* Submit button */}
          <Pressable
            onPress={handleSubmit}
            disabled={busy}
            style={[styles.button, { backgroundColor: theme.tint }]}
          >
            <ThemedText style={styles.buttonText}>
              {mode === "signIn" ? "Sign In" : "Create Account"}
            </ThemedText>
          </Pressable>

          {/* Toggle between sign-in and sign-up */}
          <Pressable onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}>
            <ThemedText style={{ color: theme.tint }}>
              {mode === "signIn"
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // Full screen container
  container: { flex: 1, justifyContent: "center", padding: 20 },

  // Limits width on larger screens
  content: { width: "100%", maxWidth: 420 },

  // Card containing form
  card: { borderWidth: 1, borderRadius: 16, padding: 20, gap: 12 },

  // Input styling
  input: { borderWidth: 1, borderRadius: 12, padding: 12 },

  // Submit button
  button: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },

  // Button text
  buttonText: { fontWeight: "600" },
});