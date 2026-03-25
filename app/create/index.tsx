import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/supabase/supabase';

/*
  CreateHabitScreen
  -----------------
  This screen allows the user to create and save a new habit.

  Responsibilities:
  1. Collect a habit name from the user.
  2. Validate that the input is not empty.
  3. Retrieve the currently authenticated user.
  4. Save the new habit to the Supabase database.
  5. Prevent duplicate submissions while the save is in progress.
  6. Return the user to the main tab screen after a successful save.
*/
export default function CreateHabitScreen() {
  const router = useRouter();

  /*
    habitName
    ---------
    Stores the text entered by the user in the habit name input field.
  */
  const [habitName, setHabitName] = useState('');

  /*
    busy
    ----
    Tracks whether a save operation is currently in progress.

    This is used to:
    - disable repeated taps on the buttons
    - prevent duplicate habit submissions
    - update the button text to show saving status
  */
  const [busy, setBusy] = useState(false);

  /*
    handleSaveHabit
    ---------------
    Validates the entered habit name and saves it to Supabase.

    Process:
    1. Remove extra whitespace from the input.
    2. Stop if the input is empty.
    3. Stop if a save is already in progress.
    4. Get the current logged-in user.
    5. Insert the new habit into the "habits" table.
    6. Clear the input and return to the main screen if successful.
    7. Show an alert if an error occurs.
  */
  const handleSaveHabit = async () => {
    const trimmedHabit = habitName.trim();

    // Prevent blank habit names from being submitted.
    if (!trimmedHabit) {
      Alert.alert('Missing habit', 'Please enter a habit name.');
      return;
    }

    // Prevent duplicate saves if the button is tapped repeatedly.
    if (busy) return;

    setBusy(true);

    try {
      // Retrieve the currently authenticated user.
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const user = data.user;

      // Stop if no authenticated user is available.
      if (!user) {
        Alert.alert('Not signed in', 'Please sign in again.');
        return;
      }

      // Insert the new habit into the database for this specific user.
      const { error } = await supabase.from('habits').insert({
        user_id: user.id,
        name: trimmedHabit,
      });

      if (error) throw error;

      // Clear the text field after a successful save.
      setHabitName('');

      /*
        Replace the current screen with the main tabs screen.

        router.replace() is used here so the user returns directly to
        the app's main view after saving the new habit.
      */
      router.replace('/(tabs)');
    } catch (error: any) {
      console.log('Error saving habit:', error);

      Alert.alert(
        'Error saving habit',
        error?.message ?? 'Could not save habit.'
      );
    } finally {
      // Re-enable interaction whether the save succeeded or failed.
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header section introducing the purpose of the page */}
      <View style={styles.heroSection}>
        <Text style={styles.title}>Create Habit</Text>
        <Text style={styles.subtitle}>Start building a new routine</Text>
      </View>

      {/* Main form container */}
      <View style={styles.formCard}>
        <Text style={styles.label}>Habit Name</Text>

        {/* Input field for the new habit name */}
        <TextInput
          value={habitName}
          onChangeText={setHabitName}
          placeholder="Enter a habit..."
          placeholderTextColor="#7a7a7a"
          style={styles.input}
        />

        {/* Primary action button to save the new habit */}
        <Pressable
          style={styles.primaryButton}
          onPress={handleSaveHabit}
          disabled={busy}
        >
          <Text style={styles.primaryButtonText}>
            {busy ? 'Saving...' : 'Save Habit'}
          </Text>
        </Pressable>

        {/* Secondary action button to cancel and return to the previous screen */}
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.back()}
          disabled={busy}
        >
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

/*
  Styles
  ------
  Defines the layout, spacing, colors, and button/input appearance
  for the Create Habit screen.
*/
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111111',
  },

  heroSection: {
    backgroundColor: '#6f92d6',
    paddingTop: 64,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },

  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 6,
  },

  subtitle: {
    color: '#d6ead8',
    fontSize: 15,
  },

  formCard: {
    backgroundColor: '#5a5a5a',
    marginHorizontal: 18,
    marginTop: 22,
    borderRadius: 18,
    padding: 18,
  },

  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },

  input: {
    backgroundColor: '#f7f7f7',
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#161616',
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 17,
    color: '#111111',
    marginBottom: 16,
  },

  primaryButton: {
    backgroundColor: '#4d77ad',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },

  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  secondaryButton: {
    backgroundColor: '#f6e6c5',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#222',
    paddingVertical: 14,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },
});