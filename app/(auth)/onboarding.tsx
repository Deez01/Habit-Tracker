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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.replace("/(auth)/sign-in");
      setUser(data.user);
    };
    loadUser();
  }, []);

  const handleSubmit = async () => {
    if (busy || !user) return;
    setBusy(true);

    await supabase
      .from("users")
      .update({
        first_name: firstName,
        last_name: lastName,
        age: age ? Number(age) : null,
        profile_complete: true,
      })
      .eq("id", user.id);

    router.replace("/(tabs)");
  };

  if (!user) return null;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.content}
      >
        <View style={[styles.card, { borderColor: theme.icon, backgroundColor: theme.background }]}>
          <ThemedText type="title">Complete Profile</ThemedText>

          <TextInput
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            style={[styles.input, { borderColor: theme.icon }]}
          />
          <TextInput
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
            style={[styles.input, { borderColor: theme.icon }]}
          />
          <TextInput
            placeholder="Age"
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
            style={[styles.input, { borderColor: theme.icon }]}
          />

          <Pressable onPress={handleSubmit} disabled={busy} style={[styles.button, { backgroundColor: theme.tint }]}>
            <ThemedText style={styles.buttonText}>Finish Setup</ThemedText>
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
