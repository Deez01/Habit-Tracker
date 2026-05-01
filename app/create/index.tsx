/*
 * File: app/create/index.tsx
 * Purpose: Allows users to create a new habit with custom recurrence patterns.
 * Supports daily, weekly (specific day), monthly (specific date), one-time, and custom (multiple days).
 */

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/supabase/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// Valid recurrence patterns for habits
type RecurrenceType = "daily" | "weekly" | "monthly" | "one_time" | "custom";

// Days of the week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CreateHabitScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  // Form state
  const [habitName, setHabitName] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("daily");

  // Weekly: which day of the week (0-6, default Monday = 1)
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1);

  // Custom: array of selected days (default: Monday, Wednesday, Friday)
  const [selectedCustomDays, setSelectedCustomDays] = useState<number[]>([
    1, 3, 5,
  ]);

  // Monthly: which day of the month (1-31, default 1st)
  const [selectedMonthDay, setSelectedMonthDay] = useState<number>(1);

  // Prevents duplicate submissions while save is in progress
  const [busy, setBusy] = useState(false);

  /**
   * Toggle a day in the custom days selection.
   * If the day is already selected, remove it; otherwise add it.
   * Maintains sorted order for consistent display.
   */
  const toggleCustomDay = (dayIndex: number) => {
    if (selectedCustomDays.includes(dayIndex)) {
      setSelectedCustomDays(selectedCustomDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedCustomDays([...selectedCustomDays, dayIndex].sort());
    }
  };

  /**
   * Generate a human-readable preview of the recurrence pattern.
   * Used to show users what they've selected before saving.
   */
  const getRecurrencePreview = () => {
    switch (recurrenceType) {
      case "daily":
        return "Every day";
      case "weekly":
        return `Every ${WEEKDAYS[selectedWeekday]}`;
      case "monthly":
        return `Day ${selectedMonthDay} of each month`;
      case "one_time":
        return "One time only (on creation day)";
      case "custom":
        if (selectedCustomDays.length === 0) return "Select at least one day";
        return `Only on ${selectedCustomDays.map((d) => WEEKDAYS[d]).join(", ")}`;
      default:
        return "";
    }
  };

  /**
   * Save the new habit to Supabase.
   * Validates input, gets current user, builds recurrence data, and inserts.
   */
  const handleSaveHabit = async () => {
    const trimmedHabit = habitName.trim();

    // Validation: habit name cannot be empty
    if (!trimmedHabit) {
      Alert.alert("Missing habit", "Please enter a habit name.");
      return;
    }

    // Prevent duplicate submissions
    if (busy) return;
    setBusy(true);

    try {
      // Get the currently authenticated user
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const user = data.user;
      if (!user) {
        Alert.alert("Not signed in", "Please sign in again.");
        return;
      }

      // Build recurrence data based on selected type
      let recurrenceDays = null;
      let recurrenceDate = null;

      switch (recurrenceType) {
        case "weekly":
          recurrenceDays = [selectedWeekday];
          break;
        case "custom":
          recurrenceDays = selectedCustomDays;
          break;
        case "monthly":
          recurrenceDate = selectedMonthDay;
          break;
        default:
          // daily and one_time don't need extra recurrence data
          break;
      }

      // Insert the new habit into the database
      const { error } = await supabase.from("habits").insert({
        user_id: user.id,
        name: trimmedHabit,
        recurrence_type: recurrenceType,
        recurrence_days: recurrenceDays,
        recurrence_date: recurrenceDate,
      });

      if (error) throw error;

      // Clear form and navigate back to main screen
      setHabitName("");
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert(
        "Error saving habit",
        error?.message ?? "Could not save habit.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.darkBackground }]}>
      {/* ===== HEADER SECTION ===== */}
      <View style={[styles.heroSection, { backgroundColor: theme.primary }]}>
        <Text style={styles.title}>Create Habit</Text>
        <Text style={styles.subtitle}>Start building a new routine</Text>
      </View>

      {/* ===== FORM CARD ===== */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.formCard, { backgroundColor: theme.cardBackground }]}
        >
          {/* Habit Name Input */}
          <Text style={[styles.label, { color: theme.text }]}>Habit Name</Text>
          <TextInput
            value={habitName}
            onChangeText={setHabitName}
            placeholder="Enter a habit..."
            placeholderTextColor={theme.placeholderText}
            style={[
              styles.input,
              {
                backgroundColor: theme.lightBackground,
                borderColor: theme.cardBorder,
                color: theme.text,
              },
            ]}
          />

          {/* Recurrence Type Selector */}
          <Text style={[styles.label, { color: theme.text }]}>How often?</Text>
          {[
            { type: "daily", label: "Daily" },
            { type: "weekly", label: "Weekly (specific day)" },
            { type: "monthly", label: "Monthly (specific date)" },
            { type: "one_time", label: "One time only" },
            { type: "custom", label: "Custom (select days)" },
          ].map((option) => (
            <Pressable
              key={option.type}
              style={[
                styles.recurrenceOption,
                { backgroundColor: theme.cardBorder },
                recurrenceType === option.type && {
                  backgroundColor: theme.accent,
                },
              ]}
              onPress={() => setRecurrenceType(option.type as RecurrenceType)}
            >
              <Text
                style={[
                  styles.recurrenceText,
                  { color: theme.text },
                  recurrenceType === option.type && { fontWeight: "600" },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}

          {/* Recurrence Preview - shows what the selected pattern means */}
          <View
            style={[
              styles.previewContainer,
              { backgroundColor: theme.cardBorder },
            ]}
          >
            <Text style={[styles.previewLabel, { color: theme.mutedText }]}>
              Preview:
            </Text>
            <Text style={[styles.previewText, { color: theme.text }]}>
              {getRecurrencePreview()}
            </Text>
          </View>

          {/* Weekly Day Picker (shown only when weekly is selected) */}
          {recurrenceType === "weekly" && (
            <View style={styles.pickerContainer}>
              <Text style={[styles.pickerLabel, { color: theme.text }]}>
                Select day:
              </Text>
              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((day, index) => (
                  <Pressable
                    key={day}
                    style={[
                      styles.weekdayButton,
                      { backgroundColor: theme.cardBorder },
                      selectedWeekday === index && {
                        backgroundColor: theme.success,
                      },
                    ]}
                    onPress={() => setSelectedWeekday(index)}
                  >
                    <Text
                      style={[
                        styles.weekdayText,
                        { color: theme.text },
                        selectedWeekday === index && { fontWeight: "700" },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Custom Days Picker (shown only when custom is selected) */}
          {recurrenceType === "custom" && (
            <View style={styles.pickerContainer}>
              <Text style={[styles.pickerLabel, { color: theme.text }]}>
                Select days:
              </Text>
              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((day, index) => (
                  <Pressable
                    key={day}
                    style={[
                      styles.weekdayButton,
                      { backgroundColor: theme.cardBorder },
                      selectedCustomDays.includes(index) && {
                        backgroundColor: theme.success,
                      },
                    ]}
                    onPress={() => toggleCustomDay(index)}
                  >
                    <Text
                      style={[
                        styles.weekdayText,
                        { color: theme.text },
                        selectedCustomDays.includes(index) && {
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {selectedCustomDays.length === 0 && (
                <Text style={[styles.warningText, { color: theme.warning }]}>
                  Select at least one day
                </Text>
              )}
            </View>
          )}

          {/* Monthly Date Picker (shown only when monthly is selected) */}
          {recurrenceType === "monthly" && (
            <View style={styles.pickerContainer}>
              <Text style={[styles.pickerLabel, { color: theme.text }]}>
                Select day of month:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.monthDayRow}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <Pressable
                      key={day}
                      style={[
                        styles.monthDayButton,
                        { backgroundColor: theme.cardBorder },
                        selectedMonthDay === day && {
                          backgroundColor: theme.success,
                        },
                      ]}
                      onPress={() => setSelectedMonthDay(day)}
                    >
                      <Text
                        style={[
                          styles.monthDayText,
                          { color: theme.text },
                          selectedMonthDay === day && { fontWeight: "700" },
                        ]}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Save Button - shows ActivityIndicator while saving */}
          <Pressable
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
            onPress={handleSaveHabit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Save Habit</Text>
            )}
          </Pressable>

          {/* Cancel Button - returns to previous screen without saving */}
          <Pressable
            style={[
              styles.secondaryButton,
              { backgroundColor: theme.stationMarker },
            ]}
            onPress={() => router.back()}
            disabled={busy}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  heroSection: {
    paddingTop: 64,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  title: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    color: "#d6ead8",
    fontSize: 15,
  },
  formCard: {
    marginHorizontal: 18,
    marginTop: 22,
    borderRadius: 18,
    padding: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  input: {
    borderWidth: 3,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 17,
    marginBottom: 16,
  },
  recurrenceOption: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  recurrenceText: {
    fontSize: 15,
  },
  previewContainer: {
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    fontWeight: "500",
  },
  pickerContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  weekdayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  weekdayButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    minWidth: 50,
    alignItems: "center",
  },
  weekdayText: {
    fontSize: 14,
  },
  monthDayRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 4,
  },
  monthDayButton: {
    width: 44,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: "center",
  },
  monthDayText: {
    fontSize: 14,
  },
  warningText: {
    fontSize: 12,
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#222",
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: 100,
  }
});
