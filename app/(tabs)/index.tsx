import { supabase } from "@/supabase/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Habit {
  id: string;
  name: string;
  recurrence_type: "daily" | "weekly" | "monthly" | "one_time" | "custom";
  recurrence_days: number[] | null;
  recurrence_date: number | null;
  created_at: string;
}

interface TodayHabit extends Habit {
  completed_today: boolean;
  current_streak: number;
}

/*
  HomeScreen
  ----------
  Main dashboard screen for the habit tracker.

  Responsibilities:
  1. Load the current user's habits from Supabase.
  2. Load each habit's completion state from Supabase habit_completions table.
  3. Allow the user to mark a habit as completed or incomplete.
  4. Allow the user to delete a habit.
  5. Navigate to the habit creation screen.

  Notes:
  - Habit names are stored in Supabase so they persist across devices/accounts.
  - Completion states are stored in Supabase habit_completions table using the logged-in
    user's ID for filtering.
  - Only habits due today (based on recurrence) are shown on the dashboard.
*/
export default function HomeScreen() {
  const router = useRouter();

  /*
    todayHabits
    -----------
    Stores the list of habits that are due today, along with their completion
    status and current streak count.
  */
  const [todayHabits, setTodayHabits] = useState<TodayHabit[]>([]);

  /*
    loading
    -------
    Tracks whether habits are currently being loaded from the database.
    Used to show a loading indicator while fetching data.
  */
  const [loading, setLoading] = useState(true);

  /**
   * Check if a habit is due on a specific date based on its recurrence pattern.
   *
   * @param habit - The habit to check
   * @param date - The date to check against
   * @returns True if the habit should appear on the given date
   */
  const isHabitDueOnDate = (habit: Habit, date: Date): boolean => {
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const dayOfMonth = date.getDate();

    switch (habit.recurrence_type) {
      case "daily":
        return true;
      case "weekly":
        return habit.recurrence_days?.includes(dayOfWeek) || false;
      case "monthly":
        return habit.recurrence_date === dayOfMonth;
      case "one_time": {
        const createdDate = new Date(habit.created_at);
        return date.toDateString() === createdDate.toDateString();
      }
      case "custom":
        return habit.recurrence_days?.includes(dayOfWeek) || false;
      default:
        return false;
    }
  };

  /**
   * Calculate the current streak for a habit.
   *
   * A streak is the number of consecutive days the habit was completed
   * on days when it was due.
   *
   * @param habit - The habit to calculate streak for
   * @returns The current streak count
   */
  const calculateStreak = async (habit: Habit): Promise<number> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 0;

    // Get all completions for this habit
    const { data: completions } = await supabase
      .from("habit_completions")
      .select("completion_date")
      .eq("habit_id", habit.id)
      .order("completion_date", { ascending: false });

    const completionDates = completions?.map((c) => c.completion_date) || [];

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = new Date(today);

    // Walk backwards from today until a due day is missed
    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];

      // Skip days when the habit isn't due (they don't break the streak)
      if (!isHabitDueOnDate(habit, checkDate)) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }

      if (completionDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  /**
   * Check if a habit was completed today.
   *
   * @param habitId - The ID of the habit to check
   * @returns True if the habit was completed today
   */
  const isCompletedToday = async (habitId: string): Promise<boolean> => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("habit_completions")
      .select("id")
      .eq("habit_id", habitId)
      .eq("completion_date", today)
      .maybeSingle();
    return !!data;
  };

  /*
    loadTodayHabits
    ---------------
    Loads all habits for the current user, filters them to show only those
    due today, and enriches them with completion status and streak data.
  */
  const loadTodayHabits = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Get all non-archived habits for this user
      const { data: habits, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", userData.user.id)
        .eq("archived", false);

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dueHabits: TodayHabit[] = [];

      // Check each habit and include only those due today
      for (const habit of habits || []) {
        if (isHabitDueOnDate(habit, today)) {
          const completed = await isCompletedToday(habit.id);
          const streak = await calculateStreak(habit);
          dueHabits.push({
            ...habit,
            completed_today: completed,
            current_streak: streak,
          });
        }
      }

      setTodayHabits(dueHabits);
    } catch (error) {
      console.log("Error loading habits:", error);
    } finally {
      setLoading(false);
    }
  };

  /*
    useFocusEffect
    --------------
    Reloads habits whenever this screen comes into focus.

    This is useful because the user may navigate away to create a new habit
    and then return to this screen. When they come back, the latest data
    should be displayed immediately.
  */
  useFocusEffect(
    useCallback(() => {
      loadTodayHabits();
    }, []),
  );

  /*
    toggleHabit
    -----------
    Toggles the completion state for a habit for today.

    If the habit is already marked complete, it is unmarked (deleted from
    habit_completions). If it is incomplete, a new completion record is added.
  */
  const toggleHabit = async (habit: TodayHabit) => {
    const today = new Date().toISOString().split("T")[0];
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) return;

    if (habit.completed_today) {
      // Uncomplete - remove the completion record
      await supabase
        .from("habit_completions")
        .delete()
        .eq("habit_id", habit.id)
        .eq("completion_date", today);
    } else {
      // Complete - add a completion record
      await supabase.from("habit_completions").insert({
        habit_id: habit.id,
        user_id: userData.user.id,
        completion_date: today,
      });
    }

    // Refresh the list to show updated state
    await loadTodayHabits();
  };

  /*
    deleteHabit
    -----------
    Deletes a habit from Supabase for the current user.

    Shows a confirmation alert before deleting to prevent accidental removal.
  */
  const deleteHabit = async (habit: TodayHabit) => {
    Alert.alert("Delete Habit", `Delete "${habit.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await supabase.from("habits").delete().eq("id", habit.id);
          await loadTodayHabits();
        },
      },
    ]);
  };

  /*
    getRecurrenceText
    -----------------
    Returns a human-readable string describing the habit's recurrence pattern.
  */
  const getRecurrenceText = (type: string): string => {
    switch (type) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      case "one_time":
        return "Once";
      case "custom":
        return "Custom";
      default:
        return "";
    }
  };

  const completedCount = todayHabits.filter((h) => h.completed_today).length;
  const totalCount = todayHabits.length;

  return (
    <View style={styles.screen}>
      {/* Top section reserved for future train/progress visualization UI */}
      <View style={styles.topSection}>
        <Text style={styles.placeholderText}>Train / Progress UI here</Text>
        <Text style={styles.completionText}>
          {completedCount} / {totalCount} completed today
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.trackerCard}>
          {/* Card title */}
          <View style={styles.trackerHeaderWrapper}>
            <View style={styles.trackerPill}>
              <Text style={styles.trackerPillText}>Daily Tracker</Text>
            </View>
          </View>

          {/* Loading state shown when fetching data */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4d77ad" />
              <Text style={styles.loadingText}>Loading habits...</Text>
            </View>
          )}

          {/* Empty state shown when no habits are due today */}
          {!loading && todayHabits.length === 0 && (
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyStateText}>
                No habits yet. Add your first habit below.
              </Text>
            </View>
          )}

          {/* Habit list - shows only habits due today */}
          {todayHabits.map((habit) => (
            <Pressable
              key={habit.id}
              style={[
                styles.habitRow,
                habit.completed_today && styles.habitRowDone,
              ]}
              onPress={() => toggleHabit(habit)}
            >
              {/* Left side: status dot + habit name + metadata */}
              <View style={styles.habitLeft}>
                <View
                  style={[
                    styles.smallDot,
                    habit.completed_today && styles.smallDotDone,
                  ]}
                />
                <View>
                  <Text
                    style={[
                      styles.habitLabel,
                      habit.completed_today && styles.habitLabelDone,
                    ]}
                  >
                    {habit.name}
                  </Text>
                  <View style={styles.habitMeta}>
                    <Text style={styles.recurrenceText}>
                      {getRecurrenceText(habit.recurrence_type)}
                    </Text>
                    <Text style={styles.streakText}>
                      {habit.current_streak} day streak
                    </Text>
                  </View>
                </View>
              </View>

              {/* Right side: completion icon + delete button */}
              <View style={styles.habitActions}>
                <View
                  style={[
                    styles.checkCircle,
                    habit.completed_today && styles.checkCircleDone,
                  ]}
                >
                  <Text style={styles.checkMark}>
                    {habit.completed_today ? "✓" : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/edit/[id]",
                      params: { id: habit.id },
                    })
                  }
                  style={styles.editBox}
                >
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => deleteHabit(habit)}
                  style={styles.deleteBox}
                >
                  <Text style={styles.deleteText}>✕</Text>
                </Pressable>
              </View>
            </Pressable>
          ))}

          {/* Navigation row to open the habit creation screen */}
          <Pressable
            style={styles.addHabitRow}
            onPress={() => router.push("/create")}
          >
            <Text style={styles.addHabitText}>Write a new habit</Text>
            <View style={styles.plusBox}>
              <Text style={styles.plusText}>+</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/*
  Styles
  ------
  Defines the visual appearance of the HomeScreen, including layout,
  colors, spacing, and the completed/uncompleted habit states.
*/
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
  },

  topSection: {
    height: "45%",
    backgroundColor: "#6f92d6",
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderText: {
    color: "#ffffff",
    fontSize: 18,
  },

  completionText: {
    color: "#d6ead8",
    fontSize: 14,
    marginTop: 8,
  },

  scrollContent: {
    paddingBottom: 100,
    backgroundColor: "#000000",
  },

  trackerCard: {
    backgroundColor: "#5a5a5a",
    marginHorizontal: 18,
    marginTop: 20,
    borderRadius: 20,
    padding: 16,
  },

  trackerHeaderWrapper: {
    alignItems: "center",
    marginTop: -30,
    marginBottom: 10,
  },

  trackerPill: {
    backgroundColor: "#4d77ad",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 50,
  },

  trackerPillText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },

  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },

  loadingText: {
    color: "#ffffff",
    marginTop: 12,
  },

  emptyStateBox: {
    backgroundColor: "#f6e6c5",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#222222",
    borderStyle: "dashed",
  },

  emptyStateText: {
    color: "#111111",
    fontSize: 16,
    textAlign: "center",
  },

  habitRow: {
    backgroundColor: "#f7f7f7",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#161616",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  habitRowDone: {
    backgroundColor: "#eef8df",
  },

  habitLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  smallDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#b8b8b8",
    marginRight: 12,
  },

  smallDotDone: {
    backgroundColor: "#79bd00",
  },

  habitLabel: {
    fontSize: 18,
    color: "#111",
  },

  habitLabelDone: {
    textDecorationLine: "line-through",
    color: "#6e6e6e",
  },

  habitMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },

  recurrenceText: {
    fontSize: 12,
    color: "#666666",
  },

  streakText: {
    fontSize: 11,
    color: "#e67e22",
    fontWeight: "600",
  },

  habitActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  checkCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#d9d9d9",
    alignItems: "center",
    justifyContent: "center",
  },

  checkCircleDone: {
    backgroundColor: "#79bd00",
  },

  checkMark: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },

  deleteBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#ff6b6b",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },

  addHabitRow: {
    backgroundColor: "#f6e6c5",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#222",
    borderStyle: "dashed",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  addHabitText: {
    fontSize: 17,
    color: "#111",
  },

  plusBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#f6c15b",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#7a5a16",
  },

  plusText: {
    fontSize: 26,
    color: "#5b3e00",
    fontWeight: "700",
  },
  editBox: {
    width: 52,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#4d77ad",
    alignItems: "center",
    justifyContent: "center",
  },

  editText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
});
