/*
 * File: lib/habit-utils.ts
 * Purpose: Core utility functions for habit recurrence, date calculations, and streak logic.
 * These functions are used across multiple hooks and components.
 */

export type RecurrenceType =
  | "daily"
  | "weekly"
  | "monthly"
  | "one_time"
  | "custom";

// Minimum habit interface required by utility functions
export type HabitLike = {
  id?: string;
  name?: string;
  recurrence_type: RecurrenceType;
  recurrence_days: number[] | null; // Days of week (0-6) for weekly/custom
  recurrence_date: number | null; // Day of month (1-31) for monthly
  created_at: string;
};

// Days of week for display and calculations
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Converts a Date into a local YYYY-MM-DD string.
 * This avoids UTC shifting issues that can happen with toISOString().
 * Example: new Date(2024, 0, 15) -> "2024-01-15"
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Convenience wrapper for "today" or any provided date.
 * Returns YYYY-MM-DD string for the current local date.
 */
export function getLocalDateString(date = new Date()): string {
  return formatDateLocal(date);
}

/**
 * Converts a YYYY-MM-DD string back into a local Date object.
 * Important: Uses local time, not UTC.
 */
export function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Checks whether two Date objects refer to the same local calendar day.
 * Compares year, month, and day without time components.
 */
export function isSameLocalDay(a: Date, b: Date): boolean {
  return formatDateLocal(a) === formatDateLocal(b);
}

/**
 * Returns a copy of a Date set to local midnight (00:00:00).
 * Useful for comparing dates without time components.
 */
export function normalizeDate(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Determines whether a habit should appear on a given date based on its recurrence settings.
 * This is the core function that powers the habit scheduling system.
 *
 * @param habit - The habit object with recurrence configuration
 * @param date - The date to check (will be normalized to midnight)
 * @returns true if the habit is due on this date
 */
export function isHabitDueOnDate(habit: HabitLike, date: Date): boolean {
  const normalizedDate = normalizeDate(date);
  const dayOfWeek = normalizedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayOfMonth = normalizedDate.getDate(); // 1-31

  switch (habit.recurrence_type) {
    case "daily":
      return true; // Due every single day

    case "weekly":
      // Due on specific days of the week (e.g., only Mondays)
      return habit.recurrence_days?.includes(dayOfWeek) || false;

    case "monthly":
      // Due on a specific day of the month (e.g., the 15th of every month)
      return habit.recurrence_date === dayOfMonth;

    case "one_time": {
      // Due only on the day the habit was created
      const createdDate = normalizeDate(new Date(habit.created_at));
      return isSameLocalDay(createdDate, normalizedDate);
    }

    case "custom":
      // Due on multiple selected days of the week (e.g., Mon, Wed, Fri)
      return habit.recurrence_days?.includes(dayOfWeek) || false;

    default:
      return false;
  }
}

/**
 * Short label version used in compact UI like habit rows.
 * Example: "Daily", "Weekly", "Monthly", "Once", "Custom"
 */
export function getRecurrenceText(type: RecurrenceType): string {
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
}

/**
 * Longer human-readable version used in the Upcoming screen.
 * Example: "Every Monday", "Day 15 of each month", "Mon, Wed, Fri"
 */
export function getRecurrenceLabel(habit: HabitLike): string {
  switch (habit.recurrence_type) {
    case "daily":
      return "Daily";

    case "weekly":
      if (habit.recurrence_days?.length) {
        return `Every ${WEEKDAYS[habit.recurrence_days[0]]}`;
      }
      return "Weekly";

    case "monthly":
      return habit.recurrence_date
        ? `Day ${habit.recurrence_date} of each month`
        : "Monthly";

    case "one_time":
      return "One time only";

    case "custom":
      if (habit.recurrence_days?.length) {
        return habit.recurrence_days.map((d) => WEEKDAYS[d]).join(", ");
      }
      return "Custom";

    default:
      return "";
  }
}

/**
 * Finds how many days remain until the habit is next due.
 * Used for sorting and labeling in the Upcoming screen.
 *
 * @param habit - The habit to check
 * @param fromDate - Starting date (defaults to today)
 * @returns Number of days until due (0 = today, 1 = tomorrow, etc., up to 365)
 */
export function getDaysUntilDue(
  habit: HabitLike,
  fromDate = new Date(),
): number {
  const today = normalizeDate(fromDate);

  // Check up to 365 days into the future
  for (let offset = 0; offset <= 365; offset++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + offset);
    if (isHabitDueOnDate(habit, checkDate)) {
      return offset;
    }
  }

  return 9999; // Fallback: habit not due within a year
}

/**
 * Small helper for upcoming habit labels.
 * Returns human-readable due date text.
 */
export function getDueSoonLabel(daysUntilDue: number): string {
  if (daysUntilDue === 0) return "Today";
  if (daysUntilDue === 1) return "Tomorrow";
  return `In ${daysUntilDue} days`;
}

/**
 * Builds an ordered list of all due dates for a habit from a given start date to end date.
 * This is useful for longest streak calculations.
 *
 * @returns Array of YYYY-MM-DD strings representing all due dates in the range
 */
export function buildDueDateSequence(
  habit: HabitLike,
  startDate: Date,
  endDate: Date,
): string[] {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  const dueDates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    if (isHabitDueOnDate(habit, cursor)) {
      dueDates.push(formatDateLocal(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dueDates;
}

/**
 * Counts the current streak for a habit based on completion dates.
 *
 * Logic:
 * - If habit is due today and already completed today, include today in streak
 * - If habit is due today but not completed yet, count up through yesterday
 * - Non-due days do NOT break the streak (they are ignored, not counted as failures)
 *
 * @param habit - The habit to evaluate
 * @param completionSet - Set of completion dates (YYYY-MM-DD strings)
 * @param todayInput - Current date (defaults to today)
 * @returns Current streak length (number of consecutive due dates completed)
 */
export function calculateCurrentStreak(
  habit: HabitLike,
  completionSet: Set<string>,
  todayInput = new Date(),
): number {
  let streak = 0;
  const today = normalizeDate(todayInput);
  let checkDate = new Date(today);
  const todayStr = formatDateLocal(today);

  const dueToday = isHabitDueOnDate(habit, today);
  const completedToday = completionSet.has(todayStr);

  // If due today but not completed yet, start counting from yesterday
  if (dueToday && !completedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Walk backwards through due dates until a missed day is found
  while (true) {
    const dateKey = formatDateLocal(checkDate);

    // Skip non-due days (they don't affect the streak)
    if (!isHabitDueOnDate(habit, checkDate)) {
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    // If completed on this due date, increment streak and continue
    if (completionSet.has(dateKey)) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break; // Found first missed due date, streak ends here
    }
  }

  return streak;
}

/**
 * Counts the longest streak across all due dates for the habit.
 *
 * Notes:
 * - One-time habits can only ever have a streak of 1
 * - Longest streak should never be lower than current streak
 *
 * @param habit - The habit to evaluate
 * @param completionSet - Set of completion dates (YYYY-MM-DD strings)
 * @param todayInput - Current date (defaults to today)
 * @returns Longest streak length ever achieved
 */
export function calculateLongestStreak(
  habit: HabitLike,
  completionSet: Set<string>,
  todayInput = new Date(),
): number {
  // No completions = no streak
  if (completionSet.size === 0) return 0;

  // One-time habits can only be completed once
  if (habit.recurrence_type === "one_time") {
    return 1;
  }

  // Get date range to analyze - from habit creation to today
  const completionDates = Array.from(completionSet).sort();
  const earliestCompletionDate = parseLocalDateString(completionDates[0]);
  const createdDate = normalizeDate(new Date(habit.created_at));
  const startDate =
    createdDate <= earliestCompletionDate
      ? createdDate
      : earliestCompletionDate;
  const today = normalizeDate(todayInput);

  // Get all due dates in the range
  const dueDates = buildDueDateSequence(habit, startDate, today);

  // Find the longest consecutive run of completed due dates
  let longest = 0;
  let running = 0;

  for (const dueDate of dueDates) {
    if (completionSet.has(dueDate)) {
      running += 1;
      if (running > longest) {
        longest = running;
      }
    } else {
      running = 0;
    }
  }

  // Longest streak cannot be less than current streak
  return Math.max(longest, calculateCurrentStreak(habit, completionSet, today));
}
