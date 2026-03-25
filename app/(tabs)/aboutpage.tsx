import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function AboutPageScreen() {
  // Router allows navigation (used here for the back button)
  const router = useRouter();

  return (
    <View style={styles.screen}>
      {/* 
        MAIN CARD CONTAINER
        This acts as the primary content box for the page.
        It visually separates the page from the background.
      */}
      <View style={styles.mainCard}>

        {/* 
          TOP ROW (HEADER AREA)
          Contains:
          - Back button (left)
          - Title (center)
          - Spacer (right, for alignment)
        */}
        <View style={styles.topRow}>

          {/* 
            BACK BUTTON
            Navigates to the previous screen in the navigation stack.
          */}
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>↩</Text>
          </Pressable>

          {/* 
            HEADER TITLE
            Styled as a "pill" to match the app’s design system.
          */}
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>About Page</Text>
          </View>

          {/* 
            SPACER
            This invisible view balances the layout so the title stays centered.
            Without it, the title would shift due to the back button.
          */}
          <View style={styles.topSpacer} />
        </View>

        {/* 
          CONTENT AREA
          This is where actual About content will go in the future.
          Right now it is a placeholder box.
        */}
        <View style={styles.aboutContentBox}>
          <Text style={styles.placeholderText}>
            Text....
          </Text>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full screen container (background layer)
  screen: {
    flex: 1,
    backgroundColor: '#000000', // dark background for contrast
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 24,
  },

  // Main content card
  mainCard: {
    flex: 1,
    backgroundColor: '#9d9a9a', // light gray card background
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },

  // Header row layout
  topRow: {
    flexDirection: 'row',          // horizontal layout
    alignItems: 'center',          // vertically center items
    justifyContent: 'space-between', // spread items evenly
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

  // Title pill container
  headerPill: {
    backgroundColor: '#4d77ad', // blue accent color
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 32,
  },

  // Title text styling
  headerPillText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Invisible spacer used for layout balancing
  topSpacer: {
    width: 42,
  },

  // Main content box for About section
  aboutContentBox: {
    flex: 1,
    backgroundColor: '#e9e9e9', // light background 
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#106477', //border
    paddingHorizontal: 18,
    paddingVertical: 16,
  },

  // Placeholder text styling
  placeholderText: {
    color: '#111111',
    fontSize: 15,
  },
});