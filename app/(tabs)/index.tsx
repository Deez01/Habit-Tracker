import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();

  const [completed, setCompleted] = useState<{ [key: number]: boolean }>({
    0: true,
    1: false,
    2: false,
    3: true,
  });

  const [habits, setHabits] = useState<string[]>([
    'Drink Water',
    'Brush Teeth',
    'Eat Breakfast',
    '30 min walk',
  ]);

  const loadHabits = async () => {
    try {
      const savedHabits = await AsyncStorage.getItem('habits');

      if (savedHabits) {
        const parsedHabits: string[] = JSON.parse(savedHabits);
        if (parsedHabits.length > 0) {
          setHabits(parsedHabits);
        }
      }
    } catch (error) {
      console.log('Error loading habits:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [])
  );

  const toggleHabit = (index: number) => {
    setCompleted((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const completedCount = habits.filter((_, index) => completed[index]).length;
  const remainingCount = habits.length - completedCount;
  const progressPercent = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.appTitle}>Stay On Track</Text>
              <Text style={styles.appSubtitle}>Build better habits every day</Text>
            </View>

            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>7</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{completedCount}</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{remainingCount}</Text>
              <Text style={styles.statLabel}>Left</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{progressPercent}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
          </View>
        </View>

        <View style={styles.trackerCard}>
          <View style={styles.trackerHeaderRow}>
            <View style={styles.trackerPill}>
              <Text style={styles.trackerPillText}>Daily Tracker</Text>
            </View>

            <Text style={styles.todayText}>Today</Text>
          </View>

          <Text style={styles.sectionCaption}>Tap a habit to mark it complete</Text>

          {habits.map((habit, index) => {
            const isDone = completed[index];

            return (
              <Pressable
                key={`${habit}-${index}`}
                style={[styles.habitRow, isDone && styles.habitRowDone]}
                onPress={() => toggleHabit(index)}
              >
                <View style={styles.habitLeft}>
                  <View style={[styles.smallDot, isDone && styles.smallDotDone]} />
                  <Text style={[styles.habitLabel, isDone && styles.habitLabelDone]}>{habit}</Text>
                </View>

                <View style={[styles.checkCircle, isDone && styles.checkCircleDone]}>
                  <Text style={styles.checkMark}>{isDone ? '✓' : ''}</Text>
                </View>
              </Pressable>
            );
          })}

          <Pressable style={styles.addHabitRow} onPress={() => router.push('/create')}>
            <Text style={styles.addHabitText}>Add a new habbit</Text>
            <View style={styles.plusBox}>
              <Text style={styles.plusText}>+</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>

          <View style={styles.quickActionsRow}>
            <Pressable style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>📅</Text>
              <Text style={styles.quickActionText}>Streak</Text>
            </Pressable>

            <Pressable style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>✏️</Text>
              <Text style={styles.quickActionText}>Customize</Text>
            </Pressable>

            <Pressable style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>💬</Text>
              <Text style={styles.quickActionText}>About</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.motivationCard}>
          <Text style={styles.motivationTitle}>Motivation</Text>
          <Text style={styles.motivationText}>
            Small progress every day leads to big results. Keep your streak alive.
          </Text>
        </View>

        <View style={styles.fakeNav}>
          <Pressable style={styles.fakeNavItem}>
            <Text style={styles.fakeNavIcon}>🏠</Text>
            <Text style={styles.fakeNavLabel}>home</Text>
            <View style={styles.activeUnderline} />
          </Pressable>

          <Pressable style={styles.fakeNavItem} onPress={() => router.push('/habits')}>
            <Text style={styles.fakeNavIcon}>♡</Text>
            <Text style={styles.fakeNavLabel}>Habbits</Text>
          </Pressable>

          <Pressable style={styles.fakeNavItem}>
            <Text style={styles.fakeNavIcon}>📅</Text>
            <Text style={styles.fakeNavLabel}>streak</Text>
          </Pressable>

          <Pressable style={styles.fakeNavItem}>
            <Text style={styles.fakeNavIcon}>✎</Text>
            <Text style={styles.fakeNavLabel}>Customize</Text>
          </Pressable>

          <Pressable style={styles.fakeNavItem}>
            <Text style={styles.fakeNavIcon}>💬</Text>
            <Text style={styles.fakeNavLabel}>about page</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111111',
  },
  scrollContent: {
    paddingBottom: 28,
    backgroundColor: '#111111',
  },
  heroSection: {
    backgroundColor: '#0e5a1b',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appTitle: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 6,
  },
  appSubtitle: {
    color: '#d6ead8',
    fontSize: 15,
  },
  streakBadge: {
    backgroundColor: '#1d1d1d',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: '#2f2f2f',
  },
  streakEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  streakText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    width: '31%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2b2b2b',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: '#cfcfcf',
    fontSize: 13,
  },
  trackerCard: {
    backgroundColor: '#5a5a5a',
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 18,
  },
  trackerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  trackerPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#4d77ad',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 38,
  },
  trackerPillText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  todayText: {
    color: '#ededed',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionCaption: {
    color: '#ececec',
    fontSize: 13,
    marginBottom: 14,
    marginLeft: 2,
  },
  habitRow: {
    backgroundColor: '#f7f7f7',
    borderRadius: 14,
    borderWidth: 3,
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
  checkCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#d9d9d9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleDone: {
    backgroundColor: '#79bd00',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 28,
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
    lineHeight: 28,
  },
  quickActionsCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  quickActionsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: '#262626',
    width: '31%',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  motivationCard: {
    backgroundColor: '#102915',
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1b4623',
  },
  motivationTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  motivationText: {
    color: '#d4e7d6',
    fontSize: 14,
    lineHeight: 20,
  },
  fakeNav: {
    backgroundColor: '#000000',
    marginTop: 18,
    paddingTop: 18,
    paddingBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  fakeNavItem: {
    alignItems: 'center',
    minWidth: 62,
  },
  fakeNavIcon: {
    fontSize: 42,
    color: '#fff',
    marginBottom: 6,
  },
  fakeNavLabel: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
  },
  activeUnderline: {
    marginTop: 6,
    width: 54,
    height: 4,
    backgroundColor: '#ffe600',
    borderRadius: 4,
  },
});