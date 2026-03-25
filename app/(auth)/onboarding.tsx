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

export default function OnboardingScreen() {
  // Detect whether the app is in light or dark mode so the screen can match the current theme.
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  // Router is used to move the user to another screen after loading or saving profile data.
  const router = useRouter();

  // Store the currently authenticated user returned by Supabase.
  // This is needed so we know which database row to load/update.
  const [user, setUser] = useState<any>(null);

  // Local state for the form fields shown on the onboarding screen.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");

  // Prevents the submit button from being pressed multiple times while the request is still running.
  const [busy, setBusy] = useState(false);

  // Stores any load/save error message so it can be shown on the screen.
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Loads the current authenticated user and that user's profile information.
     *
     * Main goals:
     * 1. If there is no signed-in user, send them back to the sign-in page.
     * 2. If the user already completed onboarding, skip this screen and go to the main app.
     * 3. If the user has partial profile data saved, prefill the form with that data.
     */
    const loadUserAndProfile = async () => {
      // Ask Supabase who is currently signed in.
      const { data } = await supabase.auth.getUser();

      // If no user exists, this screen should not be accessible.
      // Send the person back to the sign-in screen.
      if (!data.user) {
        router.replace("/(auth)/sign-in");
        return;
      }

      // Save the authenticated user in component state so we can use the id later.
      setUser(data.user);

      // Load this user's profile row from the "users" table.
      // maybeSingle() is used because it safely returns null if the row does not exist yet.
      const { data: profile, error } = await supabase
        .from("users")
        .select("first_name, last_name, age, profile_complete")
        .eq("id", data.user.id)
        .maybeSingle();

      // If the query failed, log it for debugging and show the message on screen.
      if (error) {
        console.log("Error loading profile:", error.message);
        setError(error.message);
        return;
      }

      // If the user has already finished onboarding, there is no reason to stay on this page.
      // Send them directly into the main tab layout.
      if (profile?.profile_complete) {
        router.replace("/(tabs)");
        return;
      }

      // If profile data exists but onboarding is not complete yet,
      // prefill the form so the user does not have to retype everything.
      setFirstName(profile?.first_name ?? "");
      setLastName(profile?.last_name ?? "");
      setAge(profile?.age ? String(profile.age) : "");
    };

    loadUserAndProfile();
  }, []);

  /**
   * Saves the onboarding form to the "users" table.
   *
   * upsert() is used so the row can either:
   * - be created if it does not exist yet, or
   * - be updated if it already exists.
   */
  const handleSubmit = async () => {
    // Do nothing if:
    // 1. a save request is already in progress, or
    // 2. no authenticated user is available.
    if (busy || !user) return;

    setBusy(true);
    setError(null);

    try {
      const { error: upsertError } = await supabase
        .from("users")
        .upsert({
          // Use the authenticated user's id so the profile row matches the login account.
          id: user.id,

          // Trim spaces so we do not accidentally save values with leading/trailing whitespace.
          first_name: firstName.trim(),
          last_name: lastName.trim(),

          // Convert age from string input to a number.
          // If the field is empty, save null instead.
          age: age ? Number(age) : null,

          // Mark onboarding as complete so the app knows not to show this page again.
          profile_complete: true,
        });

      // If Supabase reports an error, throw it so the catch block can handle it.
      if (upsertError) throw upsertError;

      // Once save succeeds, send the user into the main app.
      router.replace("/(tabs)");
    } catch (err: any) {
      // Save the error message so it can be shown to the user.
      setError(err.message ?? "Could not save profile.");
    } finally {
      // Re-enable the button whether the request succeeded or failed.
      setBusy(false);
    }
  };

  // If the user has not been loaded yet, render nothing for now.
  // This prevents the form from flashing before auth/profile data is ready.
  if (!user) return null;

  return (
    <ThemedView style={styles.container}>
      {/* 
        KeyboardAvoidingView helps keep the form visible when the keyboard opens,
        especially on iPhone. On Android we leave the behavior undefined.
      */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.content}
      >
        <View
          style={[
            styles.card,
            {
              borderColor: theme.icon,
              backgroundColor: theme.background,
            },
          ]}
        >
          <ThemedText type="title">Complete Profile</ThemedText>

          {/* First Name input */}
          <TextInput
            placeholder="First Name"
            placeholderTextColor={theme.icon}
            value={firstName}
            onChangeText={setFirstName}
            style={[
              styles.input,
              { borderColor: theme.icon, color: theme.text },
            ]}
          />

          {/* Last Name input */}
          <TextInput
            placeholder="Last Name"
            placeholderTextColor={theme.icon}
            value={lastName}
            onChangeText={setLastName}
            style={[
              styles.input,
              { borderColor: theme.icon, color: theme.text },
            ]}
          />

          {/* Age input */}
          <TextInput
            placeholder="Age"
            placeholderTextColor={theme.icon}
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
            style={[
              styles.input,
              { borderColor: theme.icon, color: theme.text },
            ]}
          />

          {/* Show the error message only if one exists */}
          {error && <ThemedText style={{ color: "#B00020" }}>{error}</ThemedText>}

          {/* 
            Finish Setup button:
            - calls handleSubmit when pressed
            - becomes disabled while saving
          */}
          <Pressable
            onPress={handleSubmit}
            disabled={busy}
            style={[styles.button, { backgroundColor: theme.tint }]}
          >
            <ThemedText style={styles.buttonText}>
              {busy ? "Saving..." : "Finish Setup"}
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // Outer screen container
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },

  // Limits the width of the form so it does not stretch too wide on tablets/web
  content: {
    width: "100%",
    maxWidth: 420,
  },

  // Card that holds the onboarding form
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },

  // Shared style for all text inputs
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },

  // Finish Setup button
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },

  // Button text styling
  buttonText: {
    fontWeight: "600",
  },
});