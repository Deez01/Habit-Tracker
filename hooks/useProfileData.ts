/*
 * File: hooks/useProfileData.ts
 * Purpose: Custom hook that loads user profile data for the Profile/About page.
 * Includes: username, avatar, habit count, completion charts (weekly/monthly/yearly),
 * and best current streak across all habits.
 */

import { getDeterministicAvatar } from "@/lib/avatar-utils";
import {
  formatDateLocal,
  isHabitDueOnDate,
  type HabitLike,
} from "@/lib/habit-utils";
import { supabase } from "@/supabase/supabase";
import { useCallback, useEffect, useMemo, useState } from "react";

// Database shapes
type CompletionRow = {
  completion_date: string;
  habit_id: string;
};

type ProfileRow = {
  username: string | null;
};

// Chart data point for bar charts
type ChartPoint = {
  label: string;
  value: number;
};

type ProfileHabit = HabitLike & {
  id: string;
  name: string;
};

// Return type for the useProfileData hook
type UseProfileDataResult = {
  loading: boolean;
  username: string;
  avatar: ReturnType<typeof getDeterministicAvatar>;
  habitCount: number;
  todayCompleted: number;
  weeklyData: ChartPoint[];
  monthlyData: ChartPoint[];
  yearlyData: ChartPoint[];
  bestCurrentStreak: number;
  refresh: () => Promise<void>;
};

/**
 * Helper: Returns the start of the week (Sunday) for a given date.
 */
function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Helper: Returns the number of days in a given month.
 */
function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Helper: Returns a single-letter abbreviation for month names (e.g., "J" for January).
 */
function getMonthShortLabel(monthIndex: number) {
  return ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][
    monthIndex
  ];
}

/**
 * Helper: Returns a single-letter abbreviation for weekdays (e.g., "M" for Monday).
 */
function getWeekdayShortLabel(dayIndex: number) {
  return ["S", "M", "T", "W", "T", "F", "S"][dayIndex];
}

export function useProfileData(): UseProfileDataResult {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("Conductor");
  const [habitCount, setHabitCount] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [weeklyData, setWeeklyData] = useState<ChartPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartPoint[]>([]);
  const [yearlyData, setYearlyData] = useState<ChartPoint[]>([]);
  const [bestCurrentStreak, setBestCurrentStreak] = useState(0);

  /**
   * Loads all profile data including habits, completions, and streak calculations.
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError) throw authError;

      if (!authData.user) {
        setUsername("Conductor");
        setHabitCount(0);
        setTodayCompleted(0);
        setWeeklyData([]);
        setMonthlyData([]);
        setYearlyData([]);
        setBestCurrentStreak(0);
        return;
      }

      const userId = authData.user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = formatDateLocal(today);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("username")
        .eq("id", userId)
        .maybeSingle<ProfileRow>();
      if (profileError) throw profileError;

      // Fetch all non-archived habits
      const { data: habitsData, error: habitsError } = await supabase
        .from("habits")
        .select(
          "id, name, recurrence_type, recurrence_days, recurrence_date, created_at",
        )
        .eq("user_id", userId)
        .eq("archived", false);
      if (habitsError) throw habitsError;

      // Fetch all completion records
      const { data: completionData, error: completionError } = await supabase
        .from("habit_completions")
        .select("habit_id, completion_date")
        .eq("user_id", userId)
        .order("completion_date", { ascending: true });
      if (completionError) throw completionError;

      const habits = (habitsData ?? []) as ProfileHabit[];
      const completions = (completionData ?? []) as CompletionRow[];

      setUsername(profileData?.username?.trim() || "Conductor");
      setHabitCount(habits.length);

      // Build completion count map: date -> total completions on that date
      const completionCountByDate = new Map<string, number>();
      for (const row of completions) {
        completionCountByDate.set(
          row.completion_date,
          (completionCountByDate.get(row.completion_date) ?? 0) + 1,
        );
      }

      setTodayCompleted(completionCountByDate.get(todayStr) ?? 0);

      // ===== WEEKLY CHART =====
      const weekStart = startOfWeek(today);
      const nextWeeklyData: ChartPoint[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        nextWeeklyData.push({
          label: getWeekdayShortLabel(date.getDay()),
          value: completionCountByDate.get(formatDateLocal(date)) ?? 0,
        });
      }
      setWeeklyData(nextWeeklyData);

      // ===== MONTHLY CHART =====
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const totalDaysThisMonth = daysInMonth(currentYear, currentMonth);
      const nextMonthlyData: ChartPoint[] = [];
      for (let day = 1; day <= totalDaysThisMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        nextMonthlyData.push({
          label: `${day}`,
          value: completionCountByDate.get(formatDateLocal(date)) ?? 0,
        });
      }
      setMonthlyData(nextMonthlyData);

      // ===== YEARLY CHART =====
      const nextYearlyData: ChartPoint[] = [];
      for (let month = 0; month < 12; month++) {
        let monthTotal = 0;
        const totalDays = daysInMonth(currentYear, month);
        for (let day = 1; day <= totalDays; day++) {
          monthTotal +=
            completionCountByDate.get(
              formatDateLocal(new Date(currentYear, month, day)),
            ) ?? 0;
        }
        nextYearlyData.push({
          label: getMonthShortLabel(month),
          value: monthTotal,
        });
      }
      setYearlyData(nextYearlyData);

      // ===== BEST CURRENT STREAK =====
      // Build completion set per habit
      const completionDatesByHabit = new Map<string, Set<string>>();
      for (const row of completions) {
        if (!completionDatesByHabit.has(row.habit_id)) {
          completionDatesByHabit.set(row.habit_id, new Set<string>());
        }
        completionDatesByHabit.get(row.habit_id)?.add(row.completion_date);
      }

      let highestStreak = 0;
      for (const habit of habits) {
        const completionSet =
          completionDatesByHabit.get(habit.id) ?? new Set<string>();
        let streak = 0;
        const checkDate = new Date(today);

        // Walk backwards from today until a missed due date is found
        while (true) {
          const key = formatDateLocal(checkDate);

          if (!isHabitDueOnDate(habit, checkDate)) {
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }

          if (completionSet.has(key)) {
            streak += 1;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        if (streak > highestStreak) highestStreak = streak;
      }

      setBestCurrentStreak(highestStreak);
    } catch (error: any) {
      console.error("Error loading profile data:", error?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load when hook mounts
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Generate deterministic avatar based on username
  const avatar = useMemo(() => getDeterministicAvatar(username), [username]);

  return {
    loading,
    username,
    avatar,
    habitCount,
    todayCompleted,
    weeklyData,
    monthlyData,
    yearlyData,
    bestCurrentStreak,
    refresh,
  };
}
