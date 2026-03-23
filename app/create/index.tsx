import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CreateHabitScreen() {
  const router = useRouter();
  const [habitName, setHabitName] = useState('');

  const handleSaveHabit = async () => {
    const trimmedHabit = habitName.trim();

    if (!trimmedHabit) {
      Alert.alert('Missing habit', 'Please enter a habit name.');
      return;
    }

    try {
      const existingHabits = await AsyncStorage.getItem('habits');
      const parsedHabits: string[] = existingHabits ? JSON.parse(existingHabits) : [];

      const updatedHabits = [...parsedHabits, trimmedHabit];

      await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));

      setHabitName('');
      router.back();
    } catch (error) {
      console.log('Error saving habit:', error);
      Alert.alert('Error', 'Could not save habit.');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.heroSection}>
        <Text style={styles.title}>Create Habit</Text>
        <Text style={styles.subtitle}>Start building a new routine</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Habit Name</Text>

        <TextInput
          value={habitName}
          onChangeText={setHabitName}
          placeholder="Enter a habit..."
          placeholderTextColor="#7a7a7a"
          style={styles.input}
        />

        <Pressable style={styles.primaryButton} onPress={handleSaveHabit}>
          <Text style={styles.primaryButtonText}>Save Habit</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111111',
  },
  heroSection: {
    backgroundColor: '#0e5a1b',
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