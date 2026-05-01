/*
 * File: hooks/useTodayHabits.ts
 * Purpose: Custom hook that loads today's habits, handles completion toggling,
 * and manages streak calculations. This is the main data provider for the home screen.
 */

import {
  calculateCurrentStreak,
  getLocalDateString,
  getRecurrenceText,
  isHabitDueOnDate,
  type HabitLike,
} from "@/lib/habit-utils";
import { supabase } from "@/supabase/supabase";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

// Shape of a habit with today-specific data
export type TodayHabit = HabitLike & {
  id: string;
  name: string;
  completed_today: boolean; // Whether the user completed this habit today
  current_streak: number; // Current streak length for this habit
};

// Return type for the useTodayHabits hook
type UseTodayHabitsResult = {
  loading: boolean;
  username: string;
  todayHabits: TodayHabit[];
  activeHabits: TodayHabit[]; // Habits not yet completed today
  completedHabits: TodayHabit[]; // Habits already completed today
  completedCount: number;
  totalCount: number;
  allCompleted: boolean;
  progress: number; // 0 to 1 ratio
  openMenuHabitId: string | null;
  setOpenMenuHabitId: React.Dispatch<React.SetStateAction<string | null>>;
  loadTodayHabits: () => Promise<void>;
  toggleHabit: (habit: TodayHabit) => Promise<void>;
  deleteHabit: (habit: TodayHabit) => Promise<void>;
  getRecurrenceText: (type: TodayHabit["recurrence_type"]) => string;
};

// Database shapes
type ProfileRow = {
  username: string | null;
};

type CompletionRow = {
  habit_id: string;
  completion_date: string;
};

export function useTodayHabits(): UseTodayHabitsResult {
  const [todayHabits, setTodayHabits] = useState<TodayHabit[]>([]);
  const [openMenuHabitId, setOpenMenuHabitId] = useState<string | null>(null);
  const [username, setUsername] = useState("Conductor");
  const [loading, setLoading] = useState(true);

  /**
   * Loads all habits for the current user, filters them to show only those
   * due today, and enriches them with completion status and streak data.
   */
  const loadTodayHabits = useCallback(async () => {
    setLoading(true);
    try {
      // Get current authenticated user
      const { data: userData, error: authError } =
        await supabase.auth.getUser();
      if (authError) throw authError;

      if (!userData.user) {
        setTodayHabits([]);
        setUsername("Conductor");
        return;
      }

      const userId = userData.user.id;

      // Fetch all non-archived habits for this user
      const { data: habits, error: habitsError } = await supabase
        .from("habits")
        .select(
          "id, name, recurrence_type, recurrence_days, recurrence_date, created_at, archived, user_id",
        )
        .eq("user_id", userId)
        .eq("archived", false);
      if (habitsError) throw habitsError;

      // Fetch all completion records for this user
      const { data: completions, error: completionsError } = await supabase
        .from("habit_completions")
        .select("habit_id, completion_date")
        .eq("user_id", userId)
        .order("completion_date", { ascending: true });
      if (completionsError) throw completionsError;

      // Build a map: habit_id -> Set of completion dates (YYYY-MM-DD)
      const completionMap = new Map<string, Set<string>>();
      for (const row of (completions ?? []) as CompletionRow[]) {
        if (!completionMap.has(row.habit_id)) {
          completionMap.set(row.habit_id, new Set<string>());
        }
        completionMap.get(row.habit_id)?.add(row.completion_date);
      }

      // Filter habits to only those due today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = getLocalDateString(today);
      const dueHabits: TodayHabit[] = [];

      for (const habit of (habits ?? []) as (HabitLike & {
        id: string;
        name: string;
      })[]) {
        if (isHabitDueOnDate(habit, today)) {
          const completionSet =
            completionMap.get(habit.id) ?? new Set<string>();
          const completed = completionSet.has(todayStr);
          const streak = calculateCurrentStreak(habit, completionSet, today);

          dueHabits.push({
            ...habit,
            completed_today: completed,
            current_streak: streak,
          });
        }
      }

      setTodayHabits(dueHabits);

      // Fetch user's profile/username
      const { data: profileData } = await supabase
        .from("users")
        .select("username")
        .eq("id", userId)
        .maybeSingle<ProfileRow>();

      setUsername(profileData?.username?.trim() || "Conductor");
    } catch (error: any) {
      // Silent fail for background refresh - no alert needed
      console.error("Error loading habits:", error?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load habits when the hook first mounts
  useEffect(() => {
    loadTodayHabits();
  }, [loadTodayHabits]);

  /**
   * Schedule a refresh at midnight so today's habits update automatically
   * without requiring app restart.
   */
  useEffect(() => {
    const scheduleMidnightRefresh = () => {
      const now = new Date();
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);
      const timeout = nextMidnight.getTime() - now.getTime();

      const timer = setTimeout(async () => {
        await loadTodayHabits();
        scheduleMidnightRefresh(); // Re-schedule for next day
      }, timeout);

      return timer;
    };

    const timer = scheduleMidnightRefresh();
    return () => clearTimeout(timer);
  }, [loadTodayHabits]);

  /**
   * Toggle a habit's completion status for today.
   * If completed, remove the record. If not completed, add it.
   */
  const toggleHabit = useCallback(
    async (habit: TodayHabit) => {
      const today = getLocalDateString();
      const { data: userData, error: authError } =
        await supabase.auth.getUser();
      if (authError) {
        console.error("Error getting user:", authError);
        return;
      }

      setOpenMenuHabitId(null);
      if (!userData.user) return;

      if (habit.completed_today) {
        // Remove completion (un-mark as complete)
        await supabase
          .from("habit_completions")
          .delete()
          .eq("habit_id", habit.id)
          .eq("completion_date", today);
      } else {
        // Add completion (mark as complete)
        await supabase.from("habit_completions").insert({
          habit_id: habit.id,
          user_id: userData.user.id,
          completion_date: today,
        });
      }

      await loadTodayHabits(); // Refresh the list
    },
    [loadTodayHabits],
  );

  /**
   * Permanently delete a habit and all its completion records.
   * Shows a confirmation alert before deletion.
   */
  const deleteHabit = useCallback(
    async (habit: TodayHabit) => {
      setOpenMenuHabitId(null);
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
    },
    [loadTodayHabits],
  );

  // Memoized derived data for performance
  const activeHabits = useMemo(
    () => todayHabits.filter((h) => !h.completed_today),
    [todayHabits],
  );

  const completedHabits = useMemo(
    () => todayHabits.filter((h) => h.completed_today),
    [todayHabits],
  );

  const completedCount = completedHabits.length;
  const totalCount = todayHabits.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  return {
    loading,
    username,
    todayHabits,
    activeHabits,
    completedHabits,
    completedCount,
    totalCount,
    allCompleted,
    progress,
    openMenuHabitId,
    setOpenMenuHabitId,
    loadTodayHabits,
    toggleHabit,
    deleteHabit,
    getRecurrenceText,
  };
}
