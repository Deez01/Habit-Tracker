/*
 * File: hooks/useStreaks.ts
 * Purpose: Custom hook that loads and subscribes to streak data for the current user.
 * Calculates current streak and longest streak for each habit.
 * Subscribes to real-time changes in habit_completions to refresh automatically.
 */

import {
  calculateCurrentStreak,
  calculateLongestStreak,
  type HabitLike,
} from "@/lib/habit-utils";
import { supabase } from "@/supabase/supabase";
import { useCallback, useEffect, useState } from "react";

/**
 * One completion record from Supabase.
 */
type CompletionRow = {
  habit_id: string;
  completion_date: string;
};

/**
 * Habit shape needed for streak calculations.
 */
type HabitRow = HabitLike & {
  id: string;
  name: string;
};

/**
 * Final shape returned to the streak screen UI.
 */
export type HabitStreakRow = {
  id: string;
  name: string;
  currentStreak: number; // Current consecutive streak
  longestStreak: number; // All-time longest streak
};

type UseStreaksResult = {
  loading: boolean;
  habitStreaks: HabitStreakRow[];
  topLongest: number; // Highest longestStreak across all habits
  refresh: () => Promise<void>;
};

/**
 * Loads and subscribes to streak data for the current user.
 * Responsibilities:
 * - Fetch active habits
 * - Fetch completion history
 * - Build current/longest streaks for each habit
 * - Sort by longest streak, then current streak
 * - Refresh automatically when completions change
 */
export function useStreaks(): UseStreaksResult {
  const [loading, setLoading] = useState(true);
  const [habitStreaks, setHabitStreaks] = useState<HabitStreakRow[]>([]);

  /**
   * Fetches all habits and completions, calculates streaks, and updates state.
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError) throw authError;

      if (!authData.user) {
        setHabitStreaks([]);
        return;
      }

      const userId = authData.user.id;

      // Fetch all non-archived habits for this user
      const { data: habitsData, error: habitsError } = await supabase
        .from("habits")
        .select(
          "id, name, recurrence_type, recurrence_days, recurrence_date, created_at",
        )
        .eq("user_id", userId)
        .eq("archived", false)
        .order("created_at", { ascending: true });
      if (habitsError) throw habitsError;

      // Fetch all completion records for this user
      const { data: completionsData, error: completionsError } = await supabase
        .from("habit_completions")
        .select("habit_id, completion_date")
        .eq("user_id", userId)
        .order("completion_date", { ascending: true });
      if (completionsError) throw completionsError;

      const habits = (habitsData ?? []) as HabitRow[];
      const completions = (completionsData ?? []) as CompletionRow[];

      // Build a map: habit_id -> Set of completion dates
      const completionMap = new Map<string, Set<string>>();
      for (const row of completions) {
        if (!completionMap.has(row.habit_id)) {
          completionMap.set(row.habit_id, new Set<string>());
        }
        completionMap.get(row.habit_id)?.add(row.completion_date);
      }

      // Calculate streaks for each habit
      const rows: HabitStreakRow[] = habits.map((habit) => {
        const completionSet = completionMap.get(habit.id) ?? new Set<string>();
        const currentStreak = calculateCurrentStreak(habit, completionSet);
        const longestStreak = Math.max(
          calculateLongestStreak(habit, completionSet),
          currentStreak,
        );

        return {
          id: habit.id,
          name: habit.name,
          currentStreak,
          longestStreak,
        };
      });

      // Sort by longest streak (descending), then current streak (descending), then name
      rows.sort((a, b) => {
        if (b.longestStreak !== a.longestStreak) {
          return b.longestStreak - a.longestStreak;
        }
        if (b.currentStreak !== a.currentStreak) {
          return b.currentStreak - a.currentStreak;
        }
        return a.name.localeCompare(b.name);
      });

      setHabitStreaks(rows);
    } catch (error: any) {
      console.error("Error loading streaks:", error?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load when hook mounts
  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Subscribe to real-time changes in habit_completions.
   * When a completion is added or removed, refresh streak data automatically.
   */
  useEffect(() => {
    const channel = supabase
      .channel("streak-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "habit_completions",
        },
        () => {
          refresh(); // Refresh when any completion changes
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const topLongest =
    habitStreaks.length > 0 ? habitStreaks[0].longestStreak : 0;

  return {
    loading,
    habitStreaks,
    topLongest,
    refresh,
  };
}
