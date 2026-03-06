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

type AuthMode = "signIn" | "signUp";

export default function SignInScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) =>
      setSession(session)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) router.replace("/(auth)/onboarding");
  }, [session]);

  const handleSubmit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      if (mode === "signIn") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        if (!email.trim() || !username.trim()) throw new Error("Email and username required");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        const userId = data.user?.id;
        await supabase.from("users").insert({
          id: userId,
          email: email.trim(),
          username: username.trim(),
          profile_complete: false,
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container} lightColor="#fff" darkColor="#151718">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.content}
      >
        <View
          style={[styles.card, { borderColor: theme.icon, backgroundColor: theme.background }]}
        >
          <ThemedText type="title">Welcome to StayonTrack</ThemedText>

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

          <TextInput
            placeholder="Password"
            placeholderTextColor={theme.icon}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
          />

          {error && <ThemedText style={{ color: "#B00020" }}>{error}</ThemedText>}

          <Pressable
            onPress={handleSubmit}
            disabled={busy}
            style={[styles.button, { backgroundColor: theme.tint }]}
          >
            <ThemedText style={styles.buttonText}>
              {mode === "signIn" ? "Sign In" : "Create Account"}
            </ThemedText>
          </Pressable>

          <Pressable onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}>
            <ThemedText style={{ color: theme.tint }}>
              {mode === "signIn" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  content: { width: "100%", maxWidth: 420 },
  card: { borderWidth: 1, borderRadius: 16, padding: 20, gap: 12 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12 },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  buttonText: { fontWeight: "600" },
});
