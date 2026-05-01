/*
 * File: app/(tabs)/index.tsx
 * Purpose: Main dashboard screen showing today's habits with a train-themed progress UI.
 * Users can mark habits complete/incomplete, edit, delete, and navigate to create new habits.
 */

import HabitRow from "@/components/habits/HabitRow";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTodayHabits } from "@/hooks/useTodayHabits";
import { getDeterministicTrainAvatar } from "@/lib/avatar-utils";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Create an animated version of Image for the train movement animation
const AnimatedImage = Animated.createAnimatedComponent(Animated.Image);

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  // Custom hook that manages all habit data, completion status, and streak calculations
  const {
    loading, // Whether data is currently being fetched
    username, // User's display name (used for train avatar)
    todayHabits, // All habits due today
    activeHabits, // Habits not yet completed today
    completedHabits, // Habits already completed today
    completedCount, // Number of completed habits
    totalCount, // Total habits due today
    allCompleted, // Whether all due habits are complete
    progress, // Completion ratio (0 to 1)
    openMenuHabitId, // Which habit's menu is currently open (null if none)
    setOpenMenuHabitId, // Function to change which menu is open
    toggleHabit, // Mark a habit as complete or incomplete
    deleteHabit, // Permanently delete a habit
    getRecurrenceText, // Convert recurrence type to human-readable string
  } = useTodayHabits();

  // Get deterministic train avatar based on username (same avatar always for same user)
  const routeAvatar = getDeterministicTrainAvatar(username);

  // Animated value for train position - moves from start (0) to end (1) based on progress
  const trainProgress = useRef(new Animated.Value(0)).current;

  // Animate train when progress changes (e.g., when user marks a habit complete)
  useEffect(() => {
    Animated.timing(trainProgress, {
      toValue: progress,
      duration: 450, // Smooth 450ms movement
      useNativeDriver: false, // False because we're animating "left" which is not a transform
    }).start();
  }, [progress, trainProgress]);

  return (
    <View style={styles.screen}>
      {/* ===== TOP SECTION: Train Route Progress ===== */}
      <View style={[styles.topSection, { backgroundColor: theme.primary }]}>
        <Text style={styles.progressTitle}>Today&apos;s Route</Text>
        <Text style={styles.completionText}>
          {completedCount} / {totalCount} stops completed
        </Text>

        <View style={styles.railContainer}>
          {/* Background track - always visible */}
          <View style={styles.trackBase}>
            <View
              style={[
                styles.trackProgress,
                { width: `${progress * 100}%`, backgroundColor: theme.success },
              ]}
            />
          </View>

          {/* Station markers - one for each habit, positioned along the track */}
          {todayHabits.map((habit, index) => {
            // Calculate percentage position for this station
            // trackStart = 11% (left edge), trackEnd = 86% (right edge)
            const trackStart = 11;
            const trackEnd = 86;
            const usableTrack = trackEnd - trackStart;
            const stationLeft: `${number}%` =
              totalCount <= 1
                ? `${trackStart}%`
                : `${trackStart + (index / (totalCount - 1)) * usableTrack}%`;

            return (
              <View
                key={habit.id}
                style={[styles.stationWrap, { left: stationLeft }]}
              >
                <MaterialCommunityIcons
                  name="storefront"
                  size={18}
                  color={
                    habit.completed_today ? theme.cardBackground : theme.success
                  }
                />
              </View>
            );
          })}

          {/* Animated train that moves from left to right as progress increases */}
          <AnimatedImage
            source={routeAvatar}
            style={[
              styles.trainImage,
              {
                left: trainProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["-4%" as const, "80%" as const],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* ===== MAIN CONTENT SCROLL AREA ===== */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== TODAY'S HABITS CARD ===== */}
        <View
          style={[
            styles.trackerCard,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.trackerHeaderWrapper}>
            <View
              style={[styles.trackerPill, { backgroundColor: theme.accent }]}
            >
              <Text style={styles.trackerPillText}>Today&apos;s Track</Text>
            </View>
          </View>

          {/* Loading state */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={[styles.loadingText, { color: theme.text }]}>
                Loading habits...
              </Text>
            </View>
          )}

          {/* Empty state - no habits due today */}
          {!loading && todayHabits.length === 0 && (
            <View
              style={[
                styles.emptyStateBox,
                { backgroundColor: theme.stationMarker },
              ]}
            >
              <Text style={styles.emptyStateText}>
                No habits due today. Add a habit to start your route.
              </Text>
            </View>
          )}

          {/* Congratulations message when all habits are complete */}
          {!loading && allCompleted && (
            <View
              style={[
                styles.congratsBox,
                { backgroundColor: theme.success + "90" },
              ]}
            >
              <Text style={styles.congratsText}>Congrats on a good run!</Text>
            </View>
          )}

          {/* List of habits not yet completed */}
          <View style={styles.titleContentGap}>
            {!loading &&
              activeHabits.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  completed={false}
                  menuOpen={openMenuHabitId === habit.id}
                  onToggle={() => toggleHabit(habit)}
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
                  getRecurrenceText={getRecurrenceText}
                />
              ))}
          </View>
        </View>

        {/* ===== COMPLETED HABITS SECTION (collapsible, only shows if any exist) ===== */}
        {!loading && completedHabits.length > 0 && (
          <View
            style={[
              styles.completedCard,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <View style={styles.completedHeaderWrapper}>
              <View
                style={[
                  styles.completedHeaderPill,
                  { backgroundColor: theme.mutedText },
                ]}
              >
                <Text style={styles.completedHeaderText}>
                  Completed Transit
                </Text>
              </View>
            </View>
            <View style={styles.sectionInset}>
              {completedHabits.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  completed={true}
                  menuOpen={openMenuHabitId === habit.id}
                  onToggle={() => toggleHabit(habit)}
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
                  getRecurrenceText={getRecurrenceText}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ===== FLOATING ACTION BUTTON (FAB) ===== */}
      {/* Pressing this navigates to the habit creation screen */}
      <Pressable
        style={[styles.fab, { backgroundColor: theme.warning }]}
        onPress={() => router.push("/create")}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

// ===== STYLES =====
// Note: Some colors remain hardcoded where they are design-specific and not theme-dependent
// (e.g., white text on dark backgrounds, black text on light backgrounds)
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000000" },
  topSection: {
    height: "30%",
    justifyContent: "center",
    alignItems: "center",
  },
  progressTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },
  completionText: {
    color: "#d6ead8",
    marginBottom: 8,
  },
  railContainer: {
    width: "88%",
    height: 40,
    position: "relative",
  },
  trackBase: {
    height: 12,
    backgroundColor: "#2d2d2d",
    borderRadius: 6,
    position: "absolute",
    top: 38,
    width: "100%",
  },
  trackProgress: {
    height: "100%",
    borderRadius: 6,
  },
  stationWrap: {
    position: "absolute",
    top: 22,
    alignItems: "center",
  },
  titleContentGap: {
    marginTop: 10,
  },
  sectionInset: {
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 7,
    padding: 5,
    marginTop: 7,
  },
  trainImage: {
    position: "absolute",
    top: -25,
    width: 160,
    height: 110,
    resizeMode: "contain",
    zIndex: 10,
    transform: [{ translateX: -90 }],
  },
  scrollContent: { paddingBottom: 100 },
  trackerCard: {
    margin: 18,
    borderRadius: 20,
    padding: 16,
  },
  trackerHeaderWrapper: {
    alignItems: "center",
    marginTop: -30,
  },
  trackerPill: {
    paddingHorizontal: 40,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trackerPillText: { color: "#fff" },
  loadingContainer: { alignItems: "center", padding: 20 },
  loadingText: {
    marginTop: 12,
  },
  emptyStateBox: {
    padding: 16,
    borderRadius: 14,
  },
  emptyStateText: { textAlign: "center", color: "#111111" },
  congratsBox: {
    padding: 16,
    top: 10,
    borderRadius: 14,
  },
  congratsText: { textAlign: "center", fontWeight: "800", color: "#111111" },
  completedCard: {
    margin: 18,
    borderRadius: 20,
    padding: 16,
  },
  completedHeaderWrapper: { alignItems: "center", marginTop: -30 },
  completedHeaderPill: {
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 6,
  },
  completedHeaderText: { color: "#fff" },
  fab: {
    position: "absolute",
    bottom: 28,
    right: 22,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    // Shadow for elevation on iOS and Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 34,
    fontWeight: "800",
    color: "#5b3e00",
  },
});
