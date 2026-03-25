import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/supabase/supabase';

/*
  HomeScreen
  ----------
  Main dashboard screen for the habit tracker.

  Responsibilities:
  1. Load the current user's habits from Supabase.
  2. Load each habit's completion state from AsyncStorage.
  3. Allow the user to mark a habit as completed or incomplete.
  4. Allow the user to delete a habit.
  5. Navigate to the habit creation screen.

  Notes:
  - Habit names are stored in Supabase so they persist across devices/accounts.
  - Completion states are stored locally in AsyncStorage using the logged-in
    user's ID as part of the storage key.
*/
export default function HomeScreen() {
  const router = useRouter();

  /*
    completed
    ---------
    Stores completion status by habit index.

    Example:
    {
      0: true,
      1: false
    }

    This allows the UI to quickly determine whether each displayed habit
    should appear completed.
  */
  const [completed, setCompleted] = useState<{ [key: number]: boolean }>({});

  /*
    habits
    ------
    Stores the list of habit names loaded from the database for the
    currently authenticated user.
  */
  const [habits, setHabits] = useState<string[]>([]);

  /*
    loadHabits
    ----------
    Retrieves the currently authenticated user, then loads that user's
    saved habits from the Supabase "habits" table.

    Habits are ordered by creation date so they appear in the same
    sequence they were added.
  */
  const loadHabits = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      // Stop if no authenticated user is found.
      if (!user) return;

      const { data: habitsData, error } = await supabase
        .from('habits')
        .select('name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Extract only the habit names from the returned rows.
      const habitNames = habitsData ? habitsData.map((habit) => habit.name) : [];
      setHabits(habitNames);
    } catch (error) {
      console.log('Error loading habits:', error);
    }
  };

  /*
    loadCompleted
    -------------
    Loads the local completion data for the currently authenticated user.

    Each user has a unique AsyncStorage key so that one user's checked
    habits do not affect another user's data on the same device.
  */
  const loadCompleted = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      // Stop if no authenticated user is found.
      if (!user) return;

      const completedKey = `completedHabits_${user.id}`;
      const savedCompleted = await AsyncStorage.getItem(completedKey);

      if (savedCompleted) {
        setCompleted(JSON.parse(savedCompleted));
      } else {
        setCompleted({});
      }
    } catch (error) {
      console.log('Error loading completed habits:', error);
    }
  };

  /*
    useFocusEffect
    --------------
    Reloads habits and completion states whenever this screen comes into focus.

    This is useful because the user may navigate away to create a new habit
    and then return to this screen. When they come back, the latest data
    should be displayed immediately.
  */
  useFocusEffect(
    useCallback(() => {
      loadHabits();
      loadCompleted();
    }, [])
  );

  /*
    toggleHabit
    -----------
    Toggles the completion state for a habit at the given index.

    Steps:
    1. Get the currently authenticated user.
    2. Build that user's AsyncStorage key.
    3. Flip the selected habit's completion value.
    4. Save the updated completion object back to AsyncStorage.
    5. Update local React state so the UI refreshes.
  */
  const toggleHabit = async (index: number) => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) return;

    const completedKey = `completedHabits_${user.id}`;

    setCompleted((prev) => {
      const updated = {
        ...prev,
        [index]: !prev[index],
      };

      AsyncStorage.setItem(completedKey, JSON.stringify(updated));

      return updated;
    });
  };

  /*
    deleteHabit
    -----------
    Deletes a habit from Supabase for the current user, then updates the
    local habit list and local completion tracking.

    Why the completion object must be rebuilt:
    - Completion states are stored by index.
    - After deleting one habit, the indexes of the habits after it shift down.
    - The completion object must be adjusted so each remaining habit keeps
      the correct checked/unchecked state.
  */
  const deleteHabit = async (habitName: string, index: number) => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) return;

      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('user_id', user.id)
        .eq('name', habitName);

      if (error) throw error;

      const completedKey = `completedHabits_${user.id}`;

      // Remove the deleted habit from the visible habit list.
      setHabits((prev) => prev.filter((_, i) => i !== index));

      /*
        Rebuild completion state after deletion.

        Example:
        If habit at index 1 is deleted, old index 2 becomes new index 1.
      */
      setCompleted((prev) => {
        const updated: { [key: number]: boolean } = {};

        Object.keys(prev).forEach((key) => {
          const oldIndex = Number(key);

          if (oldIndex < index) {
            updated[oldIndex] = prev[oldIndex];
          } else if (oldIndex > index) {
            updated[oldIndex - 1] = prev[oldIndex];
          }
        });

        AsyncStorage.setItem(completedKey, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.log('Delete error:', error);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Top section reserved for future train/progress visualization UI */}
      <View style={styles.topSection}>
        <Text style={styles.placeholderText}>Train / Progress UI here</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.trackerCard}>
          {/* Card title */}
          <View style={styles.trackerHeaderWrapper}>
            <View style={styles.trackerPill}>
              <Text style={styles.trackerPillText}>Daily Tracker</Text>
            </View>
          </View>

          {/* Empty state shown when no habits exist yet */}
          {habits.length === 0 && (
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyStateText}>
                No habits yet. Add your first habit below.
              </Text>
            </View>
          )}

          {/* Habit list */}
          {habits.map((habit, index) => {
            const isDone = completed[index];

            return (
              <Pressable
                key={`${habit}-${index}`}
                style={[styles.habitRow, isDone && styles.habitRowDone]}
                onPress={() => toggleHabit(index)}
              >
                {/* Left side: status dot + habit name */}
                <View style={styles.habitLeft}>
                  <View style={[styles.smallDot, isDone && styles.smallDotDone]} />
                  <Text style={[styles.habitLabel, isDone && styles.habitLabelDone]}>
                    {habit}
                  </Text>
                </View>

                {/* Right side: completion icon + delete button */}
                <View style={styles.habitActions}>
                  <View style={[styles.checkCircle, isDone && styles.checkCircleDone]}>
                    <Text style={styles.checkMark}>{isDone ? '✓' : ''}</Text>
                  </View>

                  <Pressable
                    onPress={() => deleteHabit(habit, index)}
                    style={styles.deleteBox}
                  >
                    <Text style={styles.deleteText}>✕</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })}

          {/* Navigation row to open the habit creation screen */}
          <Pressable
            style={styles.addHabitRow}
            onPress={() => router.push('/create')}
          >
            <Text style={styles.addHabitText}>Write a new habbit</Text>
            <View style={styles.plusBox}>
              <Text style={styles.plusText}>+</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/*
  Styles
  ------
  Defines the visual appearance of the HomeScreen, including layout,
  colors, spacing, and the completed/uncompleted habit states.
*/
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },

  topSection: {
    height: '45%',
    backgroundColor: '#6f92d6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeholderText: {
    color: '#ffffff',
    fontSize: 18,
  },

  scrollContent: {
    paddingBottom: 100,
    backgroundColor: '#000000',
  },

  trackerCard: {
    backgroundColor: '#5a5a5a',
    marginHorizontal: 18,
    marginTop: 20,
    borderRadius: 20,
    padding: 16,
  },

  trackerHeaderWrapper: {
    alignItems: 'center',
    marginTop: -30,
    marginBottom: 10,
  },

  trackerPill: {
    backgroundColor: '#4d77ad',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 50,
  },

  trackerPillText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  emptyStateBox: {
    backgroundColor: '#f6e6c5',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#222222',
    borderStyle: 'dashed',
  },

  emptyStateText: {
    color: '#111111',
    fontSize: 16,
    textAlign: 'center',
  },

  habitRow: {
    backgroundColor: '#f7f7f7',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#161616',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  habitRowDone: {
    backgroundColor: '#eef8df',
  },

  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  smallDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#b8b8b8',
    marginRight: 12,
  },

  smallDotDone: {
    backgroundColor: '#79bd00',
  },

  habitLabel: {
    fontSize: 18,
    color: '#111',
  },

  habitLabelDone: {
    textDecorationLine: 'line-through',
    color: '#6e6e6e',
  },

  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  checkCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d9d9d9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkCircleDone: {
    backgroundColor: '#79bd00',
  },

  checkMark: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },

  deleteBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },

  addHabitRow: {
    backgroundColor: '#f6e6c5',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#222',
    borderStyle: 'dashed',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  addHabitText: {
    fontSize: 17,
    color: '#111',
  },

  plusBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#f6c15b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7a5a16',
  },

  plusText: {
    fontSize: 26,
    color: '#5b3e00',
    fontWeight: '700',
  },
});