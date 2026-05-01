/*
 * File: components/habits/HabitRow.tsx
 * Purpose: Reusable component that renders a single habit row with:
 * - Checkbox for completion toggle
 * - Habit name and metadata (recurrence text, streak)
 * - Three-dot menu with Edit and Delete options
 * Used in the Today screen for both active and completed habit lists.
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

// Recurrence type options (must match database schema)
type RecurrenceType = "daily" | "weekly" | "monthly" | "one_time" | "custom";

// Minimum habit data required by this component
export type HabitRowHabit = {
  id: string;
  name: string;
  recurrence_type: RecurrenceType;
  completed_today: boolean;
  current_streak: number;
};

type HabitRowProps = {
  habit: HabitRowHabit;
  completed?: boolean; // Whether this habit appears in the completed section
  menuOpen: boolean; // Whether the three-dot menu is expanded
  onToggle: () => void; // Called when checkbox is pressed
  onToggleMenu: () => void; // Called when three-dot button is pressed
  onEdit: () => void; // Called when Edit is selected from menu
  onDelete: () => void; // Called when Delete is selected from menu
  getRecurrenceText: (type: RecurrenceType) => string;
};

export default function HabitRow({
  habit,
  completed = false,
  menuOpen,
  onToggle,
  onToggleMenu,
  onEdit,
  onDelete,
  getRecurrenceText,
}: HabitRowProps) {
  return (
    <View style={[styles.habitRow, completed && styles.habitRowDone]}>
      {/* ===== LEFT SIDE: CHECKBOX + HABIT INFO ===== */}
      <View style={styles.habitLeft}>
        {/* Custom checkbox that toggles between empty and checked states */}
        <Pressable
          onPress={onToggle}
          style={[styles.checkbox, completed && styles.checkboxDone]}
          hitSlop={8} // Expands touch target for better usability
        >
          {completed ? (
            <Text style={styles.checkboxCheck}>✓</Text>
          ) : (
            <View style={styles.checkboxInner} />
          )}
        </Pressable>

        {/* Habit text and metadata */}
        <View style={styles.habitTextWrap}>
          <Text style={[styles.habitLabel, completed && styles.habitLabelDone]}>
            {habit.name}
          </Text>
          <View style={styles.habitMeta}>
            <Text
              style={[styles.recurrenceText, completed && styles.metaMuted]}
            >
              {getRecurrenceText(habit.recurrence_type)}
            </Text>
            <Text style={[styles.streakText, completed && styles.metaMuted]}>
              {habit.current_streak} day streak
            </Text>
          </View>
        </View>
      </View>

      {/* ===== RIGHT SIDE: THREE-DOT MENU ===== */}
      <View style={styles.habitActions}>
        {/* Menu toggle button */}
        <Pressable onPress={onToggleMenu} style={styles.menuButton} hitSlop={8}>
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
    alignItems: "center",
    justifyContent: "space-between",
  },
  habitRowDone: {
    backgroundColor: "#4a4a4a",
    borderColor: "#383838",
  },
  habitLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  habitTextWrap: {
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#4a4a4a",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  checkboxDone: {
    backgroundColor: "#8b8f86",
    borderColor: "#6f736a",
  },
  checkboxCheck: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 16,
  },
  habitLabel: {
    fontSize: 18,
    color: "#111111",
  },
  habitLabelDone: {
    color: "#b3b3b3",
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
  metaMuted: {
    color: "#8b8b8b",
  },
  habitActions: {
    position: "relative",
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 12,
  },
  menuButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButtonText: {
    color: "#000000",
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
