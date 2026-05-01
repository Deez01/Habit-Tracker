/*
 * File: app/(tabs)/streak.tsx
 * Purpose: Displays streak statistics for all user habits.
 * Shows each habit's current streak and all-time longest streak,
 * sorted by longest streak descending.
 */

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useStreaks } from "@/hooks/useStreaks";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function StreakScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  // Custom hook that manages all streak data and real-time updates
  const { loading, habitStreaks, topLongest, refresh } = useStreaks();

  // Refresh data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.darkBackground }]}>
      {/* ===== HEADER SECTION ===== */}
      <View style={[styles.heroSection, { backgroundColor: theme.primary }]}>
        <Text style={styles.title}>Longest Streaks</Text>
        <Text style={styles.subtitle}>Your strongest habit routes</Text>

        {/* Summary card showing the top streak across all habits */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.accent,
            },
          ]}
        >
          <Text style={styles.summaryNumber}>{topLongest}</Text>
          <Text style={styles.summaryLabel}>Top longest streak</Text>
        </View>
      </View>

      {/* ===== STREAK LIST ===== */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.listCard, { backgroundColor: theme.cardBackground }]}
        >
          {/* Loading state */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={[styles.loadingText, { color: theme.text }]}>
                Loading streaks...
              </Text>
            </View>
          )}

          {/* Empty state - no habits exist yet */}
          {!loading && habitStreaks.length === 0 && (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: theme.stationMarker },
              ]}
            >
              <Text style={styles.emptyText}>
                No habits yet. Add habits on the home page to start building
                streaks.
              </Text>
            </View>
          )}

          {/* List of habits with their streak data */}
          {!loading &&
            habitStreaks.map((habit) => (
              <View
                key={habit.id}
                style={[
                  styles.habitRow,
                  { backgroundColor: theme.lightBackground },
                ]}
              >
                {/* Left side: habit name and current streak */}
                <View style={styles.habitInfo}>
                  <Text style={[styles.habitName, { color: theme.text }]}>
                    {habit.name}
                  </Text>
                  <Text style={[styles.habitMeta, { color: theme.mutedText }]}>
                    Current streak: {habit.currentStreak} day
                    {habit.currentStreak === 1 ? "" : "s"}
                  </Text>
                </View>

                {/* Right side: longest streak record */}
                <View style={styles.longestNumber}>
                  <Text style={[styles.habitMeta, { color: theme.mutedText }]}>
                    Record
                  </Text>
                  <Text style={[styles.longestNumber, { color: theme.text }]}>
                    {habit.longestStreak}
                  </Text>
                </View>
              </View>
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
    marginBottom: 20,
  },
  summaryCard: {
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 2,
  },
  summaryNumber: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 4,
  },
  summaryLabel: {
    color: "#d6ead8",
    fontSize: 14,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 110,
  },
  listCard: {
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
  emptyCard: {
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
  habitRow: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#161616",
    paddingVertical: 16,
    paddingLeft: 20,
    paddingRight: 25,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  habitMeta: {
    fontSize: 13,
  },
  longestNumber: {
    fontSize: 20,
    fontWeight: "800",
    marginLeft: 12,
  },
});
