import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { supabase } from '@/supabase/supabase';

export default function HabbitsScreen() {
  // Router is used for navigation, such as moving to the custom create-habit screen.
  const router = useRouter();

  // selected keeps track of which preset habits should appear highlighted in green.
  // The key is the habit's index in the basicHabits array.
  const [selected, setSelected] = useState<{ [key: number]: boolean }>({});

  // busyIndex is used to temporarily disable a habit row while a database request is running.
  // This prevents multiple rapid taps on the same habit from causing duplicate requests.
  const [busyIndex, setBusyIndex] = useState<number | null>(null);

  // A list of built-in habit suggestions the user can quickly add/remove from their account.
  const basicHabits = [
    'Brush Teeth',
    'Eat Breakfast',
    'Get Out of Bed',
    'Shower',
    '30 min run',
    'Go for a Walk',
    '30 min stretches',
    'Wash Dishes',
    'Wash Your Face',
    'Read',
    'Fix Your Bed',
  ];

  /**
   * Loads the current user's saved habits from Supabase
   * and compares them to the preset habit list.
   *
   * Purpose:
   * - If a preset habit already exists in the database for this user,
   *   mark it as selected so the UI can highlight it in green.
   *
   * This keeps the Habits screen visually synced with the real database state.
   */
  const loadSelectedHabits = async () => {
    try {
      // Get the current logged-in user from Supabase auth.
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const user = data.user;

      // If no user is signed in, stop here.
      if (!user) return;

      // Load the current user's saved habits from the habits table.
      const { data: habitsData, error } = await supabase
        .from('habits')
        .select('name')
        .eq('user_id', user.id);

      if (error) throw error;

      // Build an object that tells the UI which preset rows should be green.
      const selectedMap: { [key: number]: boolean } = {};

      basicHabits.forEach((habit, index) => {
        // Check whether this preset habit exists in the user's saved habits.
        const exists = habitsData?.some((savedHabit) => savedHabit.name === habit);

        // Save true/false for this row index.
        selectedMap[index] = !!exists;
      });

      setSelected(selectedMap);
    } catch (error) {
      console.log('Error loading selected habits:', error);
    }
  };

  /**
   * useFocusEffect runs every time this screen becomes active.
   *
   * Why this is useful:
   * - If the user adds/removes habits on another screen,
   *   this page will refresh when they come back.
   */
  useFocusEffect(
    useCallback(() => {
      loadSelectedHabits();
    }, [])
  );

  /**
   * Adds or removes a preset habit from the current user's habit list.
   *
   * Behavior:
   * - If the habit is already in the database, remove it.
   * - If the habit is not in the database, add it.
   *
   * This makes the preset habit list behave like a toggle.
   */
  const handleToggleHabit = async (habitName: string, index: number) => {
    // If another row is currently processing, ignore new taps.
    if (busyIndex !== null) return;

    // Mark this row as busy.
    setBusyIndex(index);

    try {
      // Get the currently signed-in user.
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const user = data.user;

      // If the user is not signed in, show an alert.
      if (!user) {
        Alert.alert('Not signed in', 'Please sign in again.');
        return;
      }

      // Check whether this habit already exists for this user in Supabase.
      const { data: existingHabits, error: checkError } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', habitName);

      if (checkError) throw checkError;

      // If the habit already exists, remove it from the database.
      if (existingHabits && existingHabits.length > 0) {
        const { error: deleteError } = await supabase
          .from('habits')
          .delete()
          .eq('user_id', user.id)
          .eq('name', habitName);

        if (deleteError) throw deleteError;

        // Update local UI so the row is no longer highlighted.
        setSelected((prev) => ({
          ...prev,
          [index]: false,
        }));

        return;
      }

      // If the habit does not exist yet, add it to the database.
      const { error: insertError } = await supabase.from('habits').insert({
        user_id: user.id,
        name: habitName,
      });

      if (insertError) throw insertError;

      // Update local UI so the row becomes highlighted.
      setSelected((prev) => ({
        ...prev,
        [index]: true,
      }));
    } catch (error: any) {
      console.log('Error toggling habit:', error);
      Alert.alert('Error', error?.message ?? 'Could not update habit.');
    } finally {
      // Clear busy state so rows can be tapped again.
      setBusyIndex(null);
    }
  };

  return (
    <View style={styles.screen}>
      {/* 
        Main card container for the habits page.
        Keeps all content grouped inside one styled panel.
      */}
      <View style={styles.mainCard}>
        {/* Header row with back button, centered title, and spacer */}
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>↩</Text>
          </Pressable>

          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>Start a new habbit</Text>
          </View>

          {/* Spacer keeps the title visually centered by balancing the back button */}
          <View style={styles.topSpacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 
            Special row that lets the user create a completely custom habit
            instead of choosing from the preset list.
          */}
          <Pressable style={styles.customHabitRow} onPress={() => router.push('/create')}>
            <Text style={styles.customHabitText}>Write your own habit</Text>
            <View style={styles.plusBox}>
              <Text style={styles.plusText}>+</Text>
            </View>
          </Pressable>

          {/* 
            Render all preset habits.
            Each row is pressable and acts as a toggle:
            gray = not selected
            green = selected
          */}
          {basicHabits.map((habit, index) => {
            const isSelected = selected[index];
            const isBusy = busyIndex === index;

            return (
              <Pressable
                key={`${habit}-${index}`}
                style={[styles.habitRow, isSelected && styles.habitRowSelected]}
                onPress={() => handleToggleHabit(habit, index)}
                disabled={isBusy}
              >
                <Text style={[styles.habitText, isSelected && styles.habitTextSelected]}>
                  {habit}
                </Text>

                {/* 
                  Right-side indicator:
                  - "+" means not selected
                  - "✓" means selected
                  - "..." means request is in progress
                */}
                <View style={[styles.plusBox, isSelected && styles.checkCircle]}>
                  <Text style={styles.plusText}>
                    {isBusy ? '...' : isSelected ? '✓' : '+'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full screen background
  screen: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 18,
  },

  // Main gray card that contains the page content
  mainCard: {
    flex: 1,
    backgroundColor: '#5a5a5a',
    borderRadius: 18,
    padding: 16,
  },

  // Header row layout
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  // Back button area
  backButton: {
    width: 40,
    alignItems: 'center',
  },

  // Back arrow text
  backText: {
    fontSize: 26,
  },

  // Blue title pill
  headerPill: {
    backgroundColor: '#4d77ad',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 25,
  },

  // Title text inside pill
  headerPillText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Spacer used to keep title centered
  topSpacer: {
    width: 40,
  },

  // Styling for the custom-habit row
  customHabitRow: {
    backgroundColor: '#f6e6c5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Text for custom habit row
  customHabitText: {
    fontSize: 15,
  },

  // Base style for each preset habit row
  habitRow: {
    backgroundColor: '#efefef',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Green highlight shown when a habit is selected
  habitRowSelected: {
    backgroundColor: '#dff5d8',
  },

  // Default habit text style
  habitText: {
    fontSize: 15,
    color: '#333333',
  },

  // Text style when selected
  habitTextSelected: {
    textDecorationLine: 'line-through',
    color: '#6e6e6e',
  },

  // Small square button on right side of each row
  plusBox: {
    backgroundColor: '#f2b94b',
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8a6417',
  },

  // Green version of the right-side button when selected
  checkCircle: {
    backgroundColor: '#79bd00',
    borderColor: '#5a8f00',
  },

  // Text inside right-side button (+, ✓, or ...)
  plusText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#5b3e00',
  },
});