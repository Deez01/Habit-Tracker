/*
 * File: app/(tabs)/upcoming.tsx
 * Purpose: Displays habits that are due in the future, sorted by due date.
 * Shows "Today", "Tomorrow", or "In X days" labels.
 */

import UpcomingHabitRow from "@/components/habits/UpcomingHabitRow";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getDaysUntilDue,
  getDueSoonLabel,
  getRecurrenceLabel,
  type HabitLike,
} from "@/lib/habit-utils";
import { supabase } from "@/supabase/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Extended habit type with upcoming-specific fields
type UpcomingHabit = HabitLike & {
  id: string;
  name: string;
  completed_today: boolean;
  current_streak: number;
  days_until_due: number; // Number of days until this habit is next due
  recurrence_label: string; // Human-readable recurrence description
};

export default function UpcomingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<UpcomingHabit[]>([]);
  const [openMenuHabitId, setOpenMenuHabitId] = useState<string | null>(null);

  /**
   * Loads all non-archived habits and calculates their next due date.
   * Results are sorted by days_until_due (soonest first), then by name.
   */
  const loadHabits = async () => {
    setLoading(true);
    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError) throw authError;

      if (!authData.user) {
        setHabits([]);
        return;
      }

      const userId = authData.user.id;

      // Fetch all non-archived habits
      const { data: habitsData, error: habitsError } = await supabase
        .from("habits")
        .select(
          "id, name, recurrence_type, recurrence_days, recurrence_date, created_at, archived",
        )
        .eq("user_id", userId)
        .eq("archived", false);
      if (habitsError) throw habitsError;

      // Transform habits with upcoming-specific calculations
      const nextHabits: UpcomingHabit[] = (habitsData ?? [])
        .map((habit) => ({
          ...habit,
          completed_today: false,
          current_streak: 0,
          days_until_due: getDaysUntilDue(habit),
          recurrence_label: getRecurrenceLabel(habit),
        }))
        .sort((a, b) => {
          // Sort by days until due (closest first), then alphabetically
          if (a.days_until_due !== b.days_until_due) {
            return a.days_until_due - b.days_until_due;
          }
          return a.name.localeCompare(b.name);
        });

      setHabits(nextHabits);
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "Could not load upcoming habits.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Permanently delete a habit.
   * Shows confirmation alert before deletion.
   */
  const deleteHabit = async (habit: UpcomingHabit) => {
    setOpenMenuHabitId(null);
    Alert.alert("Delete Habit", `Delete "${habit.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await supabase.from("habits").delete().eq("id", habit.id);
          await loadHabits();
        },
      },
    ]);
  };

  // Refresh data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, []),
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.darkBackground }]}>
      {/* ===== HEADER SECTION ===== */}
      <View style={[styles.heroSection, { backgroundColor: theme.primary }]}>
        <Text style={styles.title}>Next Stops</Text>
        <Text style={styles.subtitle}>Upcoming habits</Text>
      </View>

      {/* ===== HABITS LIST ===== */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          {/* Loading state */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={[styles.loadingText, { color: theme.text }]}>
                Loading habits...
              </Text>
            </View>
          )}

          {/* Empty state - no upcoming habits */}
          {!loading && habits.length === 0 && (
            <View
              style={[
                styles.emptyBox,
                { backgroundColor: theme.stationMarker },
              ]}
            >
              <Text style={styles.emptyText}>
                No upcoming habits right now.
              </Text>
            </View>
          )}

          {/* List of upcoming habits with due dates */}
          {!loading &&
            habits.map((habit) => (
              <UpcomingHabitRow
                key={habit.id}
                habit={habit}
                menuOpen={openMenuHabitId === habit.id}
                onToggleMenu={() =>
                  setOpenMenuHabitId((prev) =>
                    prev === habit.id ? null : habit.id,
                  )
                }
                onEdit={() => {
                  setOpenMenuHabitId(null);
                  router.push({
                    pathname: "/edit/[id]",
                    params: { id: habit.id },
                  });
                }}
                onDelete={() => {
                  setOpenMenuHabitId(null);
                  deleteHabit(habit);
                }}
                getDueSoonLabel={getDueSoonLabel}
              />
            ))}
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
  scrollContent: {
    padding: 18,
    paddingBottom: 110,
  },
  card: {
    borderRadius: 20,
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
  },
  emptyBox: {
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
