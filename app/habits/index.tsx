import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function HabitsScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.heroSection}>
        <Text style={styles.title}>Habits</Text>
        <Text style={styles.subtitle}>Manage your routines</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Habit List</Text>
        <Text style={styles.cardText}>This screen is ready. Next we can connect real habit data here.</Text>

        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
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
  card: {
    backgroundColor: '#5a5a5a',
    marginHorizontal: 18,
    marginTop: 22,
    borderRadius: 18,
    padding: 18,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  cardText: {
    color: '#f0f0f0',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  button: {
    backgroundColor: '#4d77ad',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});