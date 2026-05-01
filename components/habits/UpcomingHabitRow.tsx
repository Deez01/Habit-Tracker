/*
 * File: components/habits/UpcomingHabitRow.tsx
 * Purpose: Reusable component that renders a single habit row for the Upcoming screen.
 * Shows habit name, recurrence label, and due date label (today/tomorrow/in X days).
 * Includes three-dot menu with Edit and Delete options.
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

// Recurrence type options (must match database schema)
type RecurrenceType = "daily" | "weekly" | "monthly" | "one_time" | "custom";

// Minimum habit data required by this component
export type UpcomingHabitRowHabit = {
  id: string;
  name: string;
  recurrence_type: RecurrenceType;
  recurrence_label: string; // Human-readable recurrence description
  days_until_due: number; // Number of days until next due date
};

type UpcomingHabitRowProps = {
  habit: UpcomingHabitRowHabit;
  menuOpen: boolean; // Whether the three-dot menu is expanded
  onToggleMenu: () => void; // Called when three-dot button is pressed
  onEdit: () => void; // Called when Edit is selected from menu
  onDelete: () => void; // Called when Delete is selected from menu
  getDueSoonLabel: (daysUntilDue: number) => string; // Formats due date text
};

export default function UpcomingHabitRow({
  habit,
  menuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
  getDueSoonLabel,
}: UpcomingHabitRowProps) {
  return (
    <View style={styles.habitRow}>
      {/* ===== LEFT SIDE: HABIT INFO ===== */}
      <View style={styles.habitMain}>
        <Text style={styles.habitName}>{habit.name}</Text>
        <Text style={styles.habitRecurrence}>{habit.recurrence_label}</Text>
      </View>

      {/* ===== RIGHT SIDE: DUE DATE + MENU ===== */}
      <View style={styles.habitRight}>
        {/* Due date label (e.g., "Due today", "Due tomorrow", "In 3 days") */}
        <Text style={styles.dueLabel}>
          {getDueSoonLabel(habit.days_until_due)}
        </Text>

        {/* Three-dot menu */}
        <View style={styles.habitActions}>
          <Pressable
            onPress={onToggleMenu}
            style={styles.menuButton}
            hitSlop={8}
          >
            <Text style={styles.menuButtonText}>⋮</Text>
          </Pressable>

          {/* Dropdown menu - conditionally rendered when open */}
          {menuOpen && (
            <View style={styles.habitMenu}>
              <Pressable onPress={onEdit} style={styles.menuItem}>
                <Text style={styles.menuItemText}>Edit</Text>
              </Pressable>
              <Pressable onPress={onDelete} style={styles.menuItem}>
                <Text style={[styles.menuItemText, styles.deleteMenuText]}>
                  Delete
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  habitRow: {
    backgroundColor: "#f7f7f7",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#161616",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  habitMain: {
    flex: 1,
    paddingRight: 14,
  },
  habitName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 4,
  },
  habitRecurrence: {
    fontSize: 13,
    color: "#666666",
  },
  habitRight: {
    alignItems: "flex-end",
  },
  dueLabel: {
    fontSize: 12,
    color: "#4d77ad",
    fontWeight: "700",
    marginBottom: 8,
  },
  habitActions: {
    position: "relative",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  menuButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButtonText: {
    color: "#444444",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 22,
  },
  habitMenu: {
    position: "absolute",
    top: 28,
    right: 0,
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    minWidth: 110,
    overflow: "hidden",
    zIndex: 20,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  menuItemText: {
    color: "#222222",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteMenuText: {
    color: "#b00020",
  },
});
