import { supabase } from "@/supabase/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

export default function EditHabitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [habitName, setHabitName] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("daily");
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1);
  const [selectedCustomDays, setSelectedCustomDays] = useState<number[]>([
    1, 3, 5,
  ]);
  const [selectedMonthDay, setSelectedMonthDay] = useState<number>(1);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

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

        setHabitName(data.name ?? "");
        setRecurrenceType((data.recurrence_type as RecurrenceType) ?? "daily");

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
        console.log("Error loading habit:", error);
        Alert.alert("Error", error?.message ?? "Could not load habit.");
      } finally {
        setLoading(false);
      }
    };

    loadHabit();
  }, [id]);

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

  const handleUpdateHabit = async () => {
    const trimmedHabit = habitName.trim();

    if (!trimmedHabit) {
      Alert.alert("Missing habit", "Please enter a habit name.");
      return;
    }

    if (busy) return;

    setBusy(true);

    try {
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      router.replace("/(tabs)");
    } catch (error: any) {
      console.log("Error updating habit:", error);
      Alert.alert(
        "Error saving changes",
        error?.message ?? "Could not update habit.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.heroSection}>
          <Text style={styles.title}>Edit Habit</Text>
          <Text style={styles.subtitle}>Loading habit...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.heroSection}>
        <Text style={styles.title}>Edit Habit</Text>
        <Text style={styles.subtitle}>Update your routine</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Habit Name</Text>

        <TextInput
          value={habitName}
          onChangeText={setHabitName}
          placeholder="Enter a habit..."
          placeholderTextColor="#7a7a7a"
          style={styles.input}
        />

        <Text style={styles.label}>How often?</Text>

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

        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Preview:</Text>
          <Text style={styles.previewText}>{getRecurrencePreview()}</Text>
        </View>

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

        <Pressable
          style={styles.primaryButton}
          onPress={handleUpdateHabit}
          disabled={busy}
        >
          <Text style={styles.primaryButtonText}>
            {busy ? "Saving..." : "Save Changes"}
          </Text>
        </Pressable>

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

  recurrenceOptionSelected: {
    backgroundColor: "#4d77ad",
  },

  recurrenceText: {
    color: "#ffffff",
    fontSize: 15,
  },

  recurrenceTextSelected: {
    fontWeight: "600",
  },

  previewContainer: {
    backgroundColor: "#4a4a4a",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginBottom: 8,
  },

  previewLabel: {
    color: "#aaaaaa",
    fontSize: 12,
    marginBottom: 4,
  },

  previewText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },

  pickerContainer: {
    marginTop: 12,
    marginBottom: 16,
  },

  pickerLabel: {
    color: "#f0f0f0",
    fontSize: 14,
    marginBottom: 8,
  },

  weekdayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  weekdayButton: {
    backgroundColor: "#4a4a4a",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    minWidth: 50,
    alignItems: "center",
  },

  weekdayButtonSelected: {
    backgroundColor: "#79bd00",
  },

  weekdayText: {
    color: "#ffffff",
    fontSize: 14,
  },

  weekdayTextSelected: {
    fontWeight: "700",
  },

  monthDayRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 4,
  },

  monthDayButton: {
    backgroundColor: "#4a4a4a",
    width: 44,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: "center",
  },

  monthDayButtonSelected: {
    backgroundColor: "#79bd00",
  },

  monthDayText: {
    color: "#ffffff",
    fontSize: 14,
  },

  monthDayTextSelected: {
    fontWeight: "700",
  },

  warningText: {
    color: "#ffaa00",
    fontSize: 12,
    marginTop: 8,
  },

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
