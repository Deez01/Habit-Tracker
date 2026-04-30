import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { supabase } from "@/supabase/supabase";

/*
  Streak Screen
  -------------
  Displays the user's daily progress and streak information.

  Responsibilities:
  1. Load the user's habits from Supabase.
  2. Load completion status from AsyncStorage.
  3. Calculate:
     - Number of completed habits
     - Remaining habits
     - Overall completion percentage
  4. Display a summary dashboard of progress.

  Notes:
  - Habit names are stored in Supabase (persistent).
  - Completion states are stored locally per user using AsyncStorage.
*/
type Habit = {
  id: string;
  name: string;
};

export default function Streak() {
  /*
    completed
    ---------
    Tracks completion state of habits by index.

    Example:
    { 0: true, 1: false }
  */
  const [completedTodayIds, setCompletedTodayIds] = useState<string[]>([]);

  /*
    habits
    ------
    Stores the list of habit names retrieved from Supabase.
  */
  const [habits, setHabits] = useState<Habit[]>([]);

  /*
    loadHabits
    ----------
    Retrieves the current user's habits from the Supabase database.
    Habits are ordered by creation date to maintain consistency.
  */
  const loadHabits = async () => {
    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user) return;

      const userId = authData.user.id;
      const today = new Date().toISOString().split("T")[0];

      const { data: habitsData, error: habitsError } = await supabase
        .from("habits")
        .select("id, name")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (habitsError) throw habitsError;

      const { data: completionsData, error: completionsError } = await supabase
        .from("habit_completions")
        .select("habit_id")
        .eq("user_id", userId)
        .eq("completion_date", today);

      if (completionsError) throw completionsError;

      setHabits(habitsData ?? []);
      setCompletedTodayIds(
        (completionsData ?? []).map((item) => item.habit_id),
      );
    } catch (error) {
      console.log("Error loading streak data:", error);
    }
  };

  /*
    useFocusEffect
    --------------
    Reloads habits and completion data whenever the screen
    becomes active. Ensures the displayed data is always up to date.
  */
  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, []),
  );

  /*
    Derived Values
    --------------
    These values are computed from the habits and completion state:

    completedCount  → number of completed habits
    remainingCount  → number of incomplete habits
    progressPercent → percentage of completion
    streakNumber    → current streak (temporary logic based on completed count)
  */
  const completedCount = habits.filter((habit) =>
    completedTodayIds.includes(habit.id),
  ).length;

  const remainingCount = habits.length - completedCount;
  const progressPercent =
    habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  const streakNumber = completedCount;

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <ThemedText type="title" style={styles.pageTitle}>
          Streak &amp; Progress
        </ThemedText>

        {/* Streak Display */}
        <View style={styles.streakBadgeCard}>
          <ThemedText style={styles.streakNumber}>{streakNumber}</ThemedText>
          <ThemedText style={styles.streakLabel}>Current Streak</ThemedText>
        </View>

        {/* Stats Summary Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{completedCount}</ThemedText>
            <ThemedText style={styles.statLabel}>Done</ThemedText>
          </View>

          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{remainingCount}</ThemedText>
            <ThemedText style={styles.statLabel}>Left</ThemedText>
          </View>

          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>
              {progressPercent}%
            </ThemedText>
            <ThemedText style={styles.statLabel}>Progress</ThemedText>
          </View>
        </View>

        {/* Daily Summary */}
        <View style={styles.infoCard}>
          <ThemedText style={styles.infoTitle}>Today&apos;s Summary</ThemedText>
          <ThemedText style={styles.infoText}>
            You have completed {completedCount} out of {habits.length} habits
            today.
          </ThemedText>
        </View>

        {/* Empty State */}
        {habits.length === 0 && (
          <View style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>
              No habits yet. Add some habits on the home page to start building
              your streak.
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

/*
  Styles
  ------
  Defines layout, spacing, colors, and visual styling for the Streak screen.
*/
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#6f92d6",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingBottom: 100,
  },

  pageTitle: {
    color: "#ffffff",
    marginBottom: 20,
    textAlign: "center",
  },

  streakBadgeCard: {
    backgroundColor: "#7b7878",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1b4623",
  },

  streakNumber: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
  },

  streakLabel: {
    fontSize: 16,
    color: "#d4e7d6",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  statCard: {
    backgroundColor: "#1c0caf",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 10,
    width: "31%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2d2d2d",
  },

  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 13,
    color: "#cfcfcf",
  },

  infoCard: {
    backgroundColor: "#7b7878",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },

  infoText: {
    fontSize: 15,
    color: "#f3f3f3",
    lineHeight: 22,
  },

  emptyCard: {
    backgroundColor: "#f6e6c5",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#222",
    borderStyle: "dashed",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },

  emptyText: {
    fontSize: 15,
    color: "#111111",
    textAlign: "center",
    lineHeight: 22,
  },
});
