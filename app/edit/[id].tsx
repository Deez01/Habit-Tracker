/*
 * File: app/edit/[id].tsx
 * Purpose: Allows users to edit an existing habit's name and recurrence pattern.
 * Loads existing habit data and updates it in Supabase.
 * Very similar to create screen but with pre-populated values and update instead of insert.
 */

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/supabase/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

type RecurrenceType = "daily" | "weekly" | "monthly" | "one_time" | "custom";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function EditHabitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  // Form state - will be populated from database
  const [habitName, setHabitName] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("daily");
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1);
  const [selectedCustomDays, setSelectedCustomDays] = useState<number[]>([
    1, 3, 5,
  ]);
  const [selectedMonthDay, setSelectedMonthDay] = useState<number>(1);

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  /**
   * Loads the existing habit data from Supabase and populates the form.
   * Called once when the screen mounts.
   */
  useEffect(() => {
    const loadHabit = async () => {
      try {
        if (!id) return;

        const { data, error } = await supabase
          .from("habits")
          .select("name, recurrence_type, recurrence_days, recurrence_date")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          Alert.alert("Habit not found");
          router.back();
          return;
        }

        // Populate form with existing habit data
        setHabitName(data.name ?? "");
        setRecurrenceType((data.recurrence_type as RecurrenceType) ?? "daily");

        // Set recurrence-specific values based on the habit's type
        if (data.recurrence_type === "weekly" && data.recurrence_days?.length) {
          setSelectedWeekday(data.recurrence_days[0]);
        }

        if (data.recurrence_type === "custom") {
          setSelectedCustomDays(data.recurrence_days ?? []);
        }

        if (data.recurrence_type === "monthly" && data.recurrence_date) {
          setSelectedMonthDay(data.recurrence_date);
        }
      } catch (error: any) {
        Alert.alert("Error", error?.message ?? "Could not load habit.");
      } finally {
        setLoading(false);
      }
    };

    loadHabit();
  }, [id]);

  /**
   * Toggle a day in the custom days selection.
   * If the day is already selected, remove it; otherwise add it.
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
   * Returns today's date as YYYY-MM-DD for the updated_at timestamp.
   */
  function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Updates the habit in Supabase with the edited values.
   */
  const handleUpdateHabit = async () => {
    const trimmedHabit = habitName.trim();

    if (!trimmedHabit) {
      Alert.alert("Missing habit", "Please enter a habit name.");
      return;
    }

    if (busy) return;
    setBusy(true);

    try {
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
          break;
      }

      const { error } = await supabase
        .from("habits")
        .update({
          name: trimmedHabit,
          recurrence_type: recurrenceType,
          recurrence_days: recurrenceDays,
          recurrence_date: recurrenceDate,
          updated_at: getLocalDateString(new Date()),
        })
        .eq("id", id);

      if (error) throw error;

      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert(
        "Error saving changes",
        error?.message ?? "Could not update habit.",
      );
    } finally {
      setBusy(false);
    }
  };

  // Show loading state while fetching habit data
  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.darkBackground }]}>
        <View style={[styles.heroSection, { backgroundColor: theme.primary }]}>
          <Text style={styles.title}>Edit Habit</Text>
          <Text style={styles.subtitle}>Loading habit...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.darkBackground }]}>
      {/* ===== HEADER SECTION ===== */}
      <View style={[styles.heroSection, { backgroundColor: theme.primary }]}>
        <Text style={styles.title}>Edit Habit</Text>
        <Text style={styles.subtitle}>Update your routine</Text>
      </View>

      {/* ===== FORM CARD ===== */}
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

        {/* Recurrence Preview */}
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

        {/* Weekly Day Picker */}
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

        {/* Custom Days Picker */}
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

        {/* Monthly Date Picker */}
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

        {/* Update Button - shows ActivityIndicator while saving */}
        <Pressable
          style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          onPress={handleUpdateHabit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>Save Changes</Text>
          )}
        </Pressable>

        {/* Cancel Button */}
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
});
