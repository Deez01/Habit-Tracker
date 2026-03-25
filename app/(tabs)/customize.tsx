import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function CustomizeScreen() {
  // Router allows navigation (used for the back button)
  const router = useRouter();

  return (
    <View style={styles.screen}>
      {/*
        MAIN CARD CONTAINER
        This holds all content for the customize page and separates it from the background.
      */}
      <View style={styles.mainCard}>

        {/*
          HEADER ROW
          Contains:
          - Back button (left)
          - Title (center)
          - Spacer (right, for alignment)
        */}
        <View style={styles.topRow}>

          {/* BACK BUTTON: navigates to previous screen */}
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>↩</Text>
          </Pressable>

          {/* TITLE PILL: consistent UI element used across screens */}
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>Start a new habbit</Text>
          </View>

          {/* SPACER: keeps title centered by balancing the layout */}
          <View style={styles.topSpacer} />
        </View>

        {/*
          SUBTITLE
          Describes the purpose of the screen.
          In this case, customizing the train station (future feature).
        */}
        <Text style={styles.subtitle}>
          customize your train station
        </Text>

        {/*
          TRAIN OPTION LIST
          Each box represents a selectable train design.
          Currently placeholders, but will later become interactive options.
        */}

        {/* TRAIN OPTION 1 */}
        <View style={styles.trainOptionBox}>
          <View style={styles.bluePlaceholder}>
            <Text style={styles.placeholderText}>Train Option 1</Text>
          </View>
        </View>

        {/* TRAIN OPTION 2 */}
        <View style={styles.trainOptionBox}>
          <View style={styles.bluePlaceholder}>
            <Text style={styles.placeholderText}>Train Option 2</Text>
          </View>
        </View>

        {/* TRAIN OPTION 3 */}
        <View style={styles.trainOptionBox}>
          <View style={styles.bluePlaceholder}>
            <Text style={styles.placeholderText}>Train Option 3</Text>
          </View>
        </View>

        {/* TRAIN OPTION 4 */}
        <View style={styles.trainOptionBox}>
          <View style={styles.bluePlaceholder}>
            <Text style={styles.placeholderText}>Train Option 4</Text>
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full screen background container
  screen: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 24,
  },

  // Main content card
  mainCard: {
    flex: 1,
    backgroundColor: '#9d9a9a',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },

  // Header row layout
  topRow: {
    flexDirection: 'row',          // horizontal layout
    alignItems: 'center',          // vertical alignment
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  // Back button container
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Back arrow styling
  backText: {
    color: '#000000',
    fontSize: 28,
    fontWeight: '700',
  },

  // Title pill styling
  headerPill: {
    backgroundColor: '#4d77ad',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 28,
  },

  // Title text
  headerPillText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Spacer to keep title centered
  topSpacer: {
    width: 42,
  },

  // Subtitle text styling
  subtitle: {
    color: '#111111',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },

  // Container for each train option
  trainOptionBox: {
    backgroundColor: '#e9e9e9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1f1f1f',
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginBottom: 18,
    alignItems: 'center',
  },

  // Placeholder box where train images will go
  bluePlaceholder: {
    width: '78%',
    height: 58,
    backgroundColor: '#cfd9ea', // placeholder color for future image
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2b2b2b',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Placeholder text inside train boxes
  placeholderText: {
    color: '#2b2b2b',
    fontSize: 14,
    fontWeight: '600',
  },
});