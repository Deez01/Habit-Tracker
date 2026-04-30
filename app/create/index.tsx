import { supabase } from "@/supabase/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
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

/*
  CreateHabitScreen
  -----------------
  This screen allows the user to create and save a new habit.

  Responsibilities:
  1. Collect a habit name from the user.
  2. Validate that the input is not empty.
  3. Retrieve the currently authenticated user.
  4. Save the new habit to the Supabase database.
  5. Prevent duplicate submissions while the save is in progress.
  6. Return the user to the main tab screen after a successful save.
*/
export default function CreateHabitScreen() {
  const router = useRouter();

  /*
    habitName
    ---------
    Stores the text entered by the user in the habit name input field.
  */

  const [habitName, setHabitName] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("daily");
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1); // Monday
  const [selectedCustomDays, setSelectedCustomDays] = useState<number[]>([
    1, 3, 5,
  ]); // M,W,F
  const [selectedMonthDay, setSelectedMonthDay] = useState<number>(1);

  /*
    busy
    ----
    Tracks whether a save operation is currently in progress.

    This is used to:
    - disable repeated taps on the buttons
    - prevent duplicate habit submissions
    - update the button text to show saving status
  */
  const [busy, setBusy] = useState(false);

  /*
    handleSaveHabit
    ---------------
    Validates the entered habit name and saves it to Supabase.

    Process:
    1. Remove extra whitespace from the input.
    2. Stop if the input is empty.
    3. Stop if a save is already in progress.
    4. Get the current logged-in user.
    5. Insert the new habit into the "habits" table.
    6. Clear the input and return to the main screen if successful.
    7. Show an alert if an error occurs.
  */
  const handleSaveHabit = async () => {
    const trimmedHabit = habitName.trim();

    // Prevent blank habit names from being submitted.
    if (!trimmedHabit) {
      Alert.alert("Missing habit", "Please enter a habit name.");
      return;
    }

    // Prevent duplicate saves if the button is tapped repeatedly.
    if (busy) return;

    setBusy(true);

    try {
      // Retrieve the currently authenticated user.
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const user = data.user;

      // Stop if no authenticated user is available.
      if (!user) {
        Alert.alert("Not signed in", "Please sign in again.");
        return;
      }

      // Recurrence
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

      // Insert the new habit into the database for this specific user.
      const { error } = await supabase.from("habits").insert({
        user_id: user.id,
        name: trimmedHabit,
        recurrence_type: recurrenceType,
        recurrence_days: recurrenceDays,
        recurrence_date: recurrenceDate,
      });

      if (error) throw error;

      // Clear the text field after a successful save.
      setHabitName("");

      /*
        Replace the current screen with the main tabs screen.

        router.replace() is used here so the user returns directly to
        the app's main view after saving the new habit.
      */
      router.replace("/(tabs)");
    } catch (error: any) {
      console.log("Error saving habit:", error);

      Alert.alert(
        "Error saving habit",
        error?.message ?? "Could not save habit.",
      );
    } finally {
      // Re-enable interaction whether the save succeeded or failed.
      setBusy(false);
    }
  };

  const toggleCustomDay = (dayIndex: number) => {
    if (selectedCustomDays.includes(dayIndex)) {
      setSelectedCustomDays(selectedCustomDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedCustomDays([...selectedCustomDays, dayIndex].sort());
    }
  };

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

  return (
    <View style={styles.screen}>
      {/* Header section introducing the purpose of the page */}
      <View style={styles.heroSection}>
        <Text style={styles.title}>Create Habit</Text>
        <Text style={styles.subtitle}>Start building a new routine</Text>
      </View>

      {/* Main form container */}
      <View style={styles.formCard}>
        <Text style={styles.label}>Habit Name</Text>

        {/* Input field for the new habit name */}
        <TextInput
          value={habitName}
          onChangeText={setHabitName}
          placeholder="Enter a habit..."
          placeholderTextColor="#7a7a7a"
          style={styles.input}
        />

        <Text style={styles.label}>How often?</Text>

        {/* Recurrence options */}
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
              recurrenceType === option.type && styles.recurrenceOptionSelected,
            ]}
            onPress={() => setRecurrenceType(option.type as RecurrenceType)}
          >
            <Text
              style={[
                styles.recurrenceText,
                recurrenceType === option.type && styles.recurrenceTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}

        {/* Preview */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Preview:</Text>
          <Text style={styles.previewText}>{getRecurrencePreview()}</Text>
        </View>

        {/* Weekly day picker */}
        {recurrenceType === "weekly" && (
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Select day:</Text>
            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((day, index) => (
                <Pressable
                  key={day}
                  style={[
                    styles.weekdayButton,
                    selectedWeekday === index && styles.weekdayButtonSelected,
                  ]}
                  onPress={() => setSelectedWeekday(index)}
                >
                  <Text
                    style={[
                      styles.weekdayText,
                      selectedWeekday === index && styles.weekdayTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Custom days picker */}
        {recurrenceType === "custom" && (
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Select days:</Text>
            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((day, index) => (
                <Pressable
                  key={day}
                  style={[
                    styles.weekdayButton,
                    selectedCustomDays.includes(index) &&
                      styles.weekdayButtonSelected,
                  ]}
                  onPress={() => toggleCustomDay(index)}
                >
                  <Text
                    style={[
                      styles.weekdayText,
                      selectedCustomDays.includes(index) &&
                        styles.weekdayTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              ))}
            </View>
            {selectedCustomDays.length === 0 && (
              <Text style={styles.warningText}>Select at least one day</Text>
            )}
          </View>
        )}
        {/* Monthly date picker */}
        {recurrenceType === "monthly" && (
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Select day of month:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.monthDayRow}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <Pressable
                    key={day}
                    style={[
                      styles.monthDayButton,
                      selectedMonthDay === day && styles.monthDayButtonSelected,
                    ]}
                    onPress={() => setSelectedMonthDay(day)}
                  >
                    <Text
                      style={[
                        styles.monthDayText,
                        selectedMonthDay === day && styles.monthDayTextSelected,
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

        {/* Primary action button to save the new habit */}
        <Pressable
          style={styles.primaryButton}
          onPress={handleSaveHabit}
          disabled={busy}
        >
          <Text style={styles.primaryButtonText}>
            {busy ? "Saving..." : "Save Habit"}
          </Text>
        </Pressable>

        {/* Secondary action button to cancel and return to the previous screen */}
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.back()}
          disabled={busy}
        >
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

/*
  Styles
  ------
  Defines the layout, spacing, colors, and button/input appearance
  for the Create Habit screen.
*/
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#111111",
  },

  heroSection: {
    backgroundColor: "#6f92d6",
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
    backgroundColor: "#5a5a5a",
    marginHorizontal: 18,
    marginTop: 22,
    borderRadius: 18,
    padding: 18,
  },

  label: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },

  recurrenceOption: {
    backgroundColor: "#4a4a4a",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  recurrenceOptionSelected: { backgroundColor: "#4d77ad" },
  recurrenceText: { color: "#ffffff", fontSize: 15 },
  recurrenceTextSelected: { fontWeight: "600" },
  previewContainer: {
    backgroundColor: "#4a4a4a",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  previewLabel: { color: "#aaaaaa", fontSize: 12, marginBottom: 4 },
  previewText: { color: "#ffffff", fontSize: 14, fontWeight: "500" },
  pickerContainer: { marginTop: 12, marginBottom: 16 },
  pickerLabel: { color: "#f0f0f0", fontSize: 14, marginBottom: 8 },
  weekdayRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  weekdayButton: {
    backgroundColor: "#4a4a4a",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    minWidth: 50,
    alignItems: "center",
  },
  weekdayButtonSelected: { backgroundColor: "#79bd00" },
  weekdayText: { color: "#ffffff", fontSize: 14 },
  weekdayTextSelected: { fontWeight: "700" },
  monthDayRow: { flexDirection: "row", gap: 6, paddingVertical: 4 },
  monthDayButton: {
    backgroundColor: "#4a4a4a",
    width: 44,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: "center",
  },
  monthDayButtonSelected: { backgroundColor: "#79bd00" },
  monthDayText: { color: "#ffffff", fontSize: 14 },
  monthDayTextSelected: { fontWeight: "700" },
  warningText: { color: "#ffaa00", fontSize: 12, marginTop: 8 },

  input: {
    backgroundColor: "#f7f7f7",
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#161616",
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 17,
    color: "#111111",
    marginBottom: 16,
  },

  primaryButton: {
    backgroundColor: "#4d77ad",
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
    backgroundColor: "#f6e6c5",
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
