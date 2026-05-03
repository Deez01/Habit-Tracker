/*
 External icon library used for the star badge in the "Today's Route"
card.
*/
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

/*
 Expo Router is used to navigate the user back to the sign-in screen
 after logging out.

 useFocusEffect is used to refresh the profile data every time the
 Profile tab becomes active.
*/
import { router, useFocusEffect } from "expo-router";

/*
 useCallback is used with useFocusEffect so the refresh function runs
 safely when the screen is focused.
*/
import { useCallback, useState } from "react";

/*
 Custom hook that loads and prepares all profile-page data:
 - username
 - avatar
 - habit count
 - today's completed count
 - weekly/monthly/yearly chart data
 - best current streak
*/
import { useProfileData } from "@/hooks/useProfileData";

/*
 Supabase client used for authentication.
 This allows the profile page to sign the user out.
*/
import { supabase } from "@/supabase/supabase";

/*
 React Native UI primitives used to build the screen layout.
*/
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/*
 ChartBarProps
 -------------
 Props for one vertical rail-style chart bar.
*/
type ChartBarProps = {
  label: string;
  value: number;
  maxValue: number;
  width?: number;
};

/*
 ChartBar
 --------
 Renders one rail-style chart bar made of:
 - two vertical rails
 - several horizontal rungs
 - filled rungs to represent progress/value

 The number of filled rungs is based on the value relative to maxValue.
*/
function ChartBar({ label, value, maxValue, width = 18 }: ChartBarProps) {
  /*
   trackHeight
   -----------
   Visual height of the bar/rail area.
  */
  const trackHeight = 110;

  /*
   safeMax
   -------
   Prevents division by zero if maxValue is 0.
  */
  const safeMax = Math.max(maxValue, 1);

  /*
   rungCount
   ---------
   Total number of horizontal rungs shown on the rail.

   filledRungs
   -----------
   Number of rungs that should appear highlighted based on the value.
  */
  const rungCount = 6;
  const filledRungs =
    value > 0 ? Math.max(1, Math.round((value / safeMax) * rungCount)) : 0;

  return (
    <View style={[styles.barItem, { width }]}>
      {/* Vertical rail container */}
      <View style={styles.railTrack}>
        {/* Left and right rail lines */}
        <View style={styles.railLineLeft} />
        <View style={styles.railLineRight} />

        {/* Horizontal rungs */}
        {Array.from({ length: rungCount }).map((_, index) => {
          const rungFromBottom = rungCount - index;
          const isFilled = rungFromBottom <= filledRungs;

          return (
            <View
              key={index}
              style={[
                styles.railRung,
                {
                  /*
                   Each rung is positioned vertically based on its index.
                  */
                  top: (trackHeight / rungCount) * index + 6,
                },
                /*
                 Filled rungs use a highlight color.
                */
                isFilled && styles.railRungFilled,
              ]}
            />
          );
        })}
      </View>

      {/* Label below the bar, such as weekday/month/day */}
      <Text style={styles.barLabel}>{label}</Text>
    </View>
  );
}

/*
 AboutPageScreen
 ---------------
 Profile page for the app.

 Responsibilities:
 1. Show the user's avatar and username.
 2. Show habit stats such as active habit count and best current streak.
 3. Show today's completion summary.
 4. Render weekly, monthly, and yearly rail-style completion charts.
 5. Allow the user to log out of their account.
*/
export default function AboutPageScreen() {
  const [reloadKey, setReloadKey] = useState(0);

  /*
   useProfileData
   --------------
   Provides all data needed by this screen.
  */
  const {
    loading,
    username,
    avatar,
    habitCount,
    todayCompleted,
    weeklyData,
    monthlyData,
    yearlyData,
    bestCurrentStreak,
    refresh,
  } = useProfileData();

  /*
   Refresh profile data when the Profile tab becomes active.
   This keeps today's completed habits, charts, and streak stats synced
   after the user completes or uncompletes habits on the Today screen.
  */
  useFocusEffect(
    useCallback(() => {
      refresh();
      setReloadKey((prev) => prev + 1);
    }, [refresh]),
  );

  /*
   handleLogout
   ------------
   Signs the current user out using Supabase authentication.

   After the sign out finishes, router.replace sends the user back
   to the sign-in screen and removes the profile page from the
   navigation history.
  */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  /*
   Max values for each chart
   -------------------------
   Used to scale each chart so the highest value fills the most rungs.
  */
  const weekMax = Math.max(...weeklyData.map((item) => item.value), 1);
  const monthMax = Math.max(...monthlyData.map((item) => item.value), 1);
  const yearMax = Math.max(...yearlyData.map((item) => item.value), 1);

  return (
    <View style={styles.screen} key={reloadKey}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== HERO / PROFILE HEADER ===== */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Conductor Profile</Text>
          <Text style={styles.heroSubtitle}>
            Your station, your stats, your momentum.
          </Text>

          {/* Profile summary card */}
          <View style={styles.profileCard}>
            {/* Outer avatar ring */}
            <View
              style={[
                styles.avatarOuter,
                { backgroundColor: avatar.colors.outer },
              ]}
            >
              {/* Inner avatar background */}
              <View
                style={[
                  styles.avatarInner,
                  { backgroundColor: avatar.colors.inner },
                ]}
              >
                {/* Train avatar image */}
                <Image source={avatar.icon} style={styles.avatarImage} />
              </View>
            </View>

            {/* User info and stats */}
            <View style={styles.profileInfo}>
              <Text style={styles.usernameText}>@{username}</Text>
              <Text style={styles.profileSubtext}>Junior Conductor</Text>

              <View style={styles.profileStatsRow}>
                {/* Active habits stat */}
                <View style={styles.profileStatPill}>
                  <Text style={styles.profileStatNumber}>{habitCount}</Text>
                  <Text style={styles.profileStatLabel}>Active Habits</Text>
                </View>

                {/* Best current streak stat */}
                <View style={styles.profileStatPill}>
                  <Text style={styles.profileStatNumber}>
                    {bestCurrentStreak}
                  </Text>
                  <Text style={styles.profileStatLabel}>
                    Best Current Streak
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ===== LOADING STATE ===== */}
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#4d77ad" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <>
            {/* ===== TODAY SUMMARY ===== */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Today's Route</Text>

              <View style={styles.todayRow}>
                {/* Star badge */}
                <View style={styles.todayBadge}>
                  <MaterialCommunityIcons
                    name="star"
                    size={40}
                    color="#f5fd13"
                  />
                </View>

                {/* Today's completion count */}
                <View style={styles.todayTextWrap}>
                  <Text style={styles.todayCount}>{todayCompleted}</Text>
                  <Text style={styles.todayLabel}>
                    habits completed today
                  </Text>
                </View>
              </View>
            </View>

            {/* ===== WEEKLY CHART ===== */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Weekly Transit</Text>

              {/* Weekly chart fills the width of the card */}
              <View style={styles.chartRowWide}>
                {weeklyData.map((item, index) => (
                  <ChartBar
                    key={`${item.label}-${index}`}
                    label={item.label}
                    value={item.value}
                    maxValue={weekMax}
                    width={28}
                  />
                ))}
              </View>
            </View>

            {/* ===== MONTHLY CHART ===== */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Monthly Transit</Text>

              {/* Monthly chart scrolls horizontally because it has many bars */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chartRowMonth}>
                  {monthlyData.map((item, index) => (
                    <ChartBar
                      key={`${item.label}-${index}`}
                      label={item.label}
                      value={item.value}
                      maxValue={monthMax}
                      width={20}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* ===== YEARLY CHART ===== */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Yearly Transit</Text>

              {/* Yearly chart also scrolls horizontally */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chartRowWideYear}>
                  {yearlyData.map((item, index) => (
                    <ChartBar
                      key={`${item.label}-${index}`}
                      label={item.label}
                      value={item.value}
                      maxValue={yearMax}
                      width={24}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* ===== LOGOUT BUTTON ===== */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

/*
 Styles
 ------
 Defines layout, spacing, and visual design for the profile page.
*/
const styles = StyleSheet.create({
  /*
   Main screen container
  */
  screen: {
    flex: 1,
    backgroundColor: "#0b0b0b",
  },

  /*
   Scroll container padding
  */
  scrollContent: {
    paddingBottom: 120,
  },

  /*
   Top hero section containing the page title and profile card
  */
  heroSection: {
    backgroundColor: "#6f92d6",
    paddingTop: 64,
    paddingBottom: 26,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  /*
   Main page title
  */
  heroTitle: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 6,
  },

  /*
   Subtitle under the main title
  */
  heroSubtitle: {
    color: "#dbe7ff",
    fontSize: 15,
    marginBottom: 18,
  },

  /*
   Card holding avatar and profile stats
  */
  profileCard: {
    backgroundColor: "#1f2430",
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2d4468",
  },

  /*
   Outer avatar circle
  */
  avatarOuter: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
  },

  /*
   Inner avatar circle
  */
  avatarInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
  },

  /*
   Right side of the profile card
  */
  profileInfo: {
    flex: 1,
  },

  /*
   Username display
  */
  usernameText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },

  /*
   Small subtitle under username
  */
  profileSubtext: {
    color: "#b8c6de",
    fontSize: 13,
    marginBottom: 12,
  },

  /*
   Row of profile stat pills
  */
  profileStatsRow: {
    flexDirection: "row",
    gap: 10,
  },

  /*
   Small stat card within the profile card
  */
  profileStatPill: {
    flex: 1,
    backgroundColor: "#2a3344",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },

  /*
   Large stat number
  */
  profileStatNumber: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },

  /*
   Small stat label
  */
  profileStatLabel: {
    color: "#c8d1e3",
    fontSize: 11,
    marginTop: 3,
  },

  /*
   Loading card shown while profile data is being fetched
  */
  loadingCard: {
    marginTop: 20,
    marginHorizontal: 18,
    backgroundColor: "#5a5a5a",
    borderRadius: 20,
    paddingVertical: 32,
    alignItems: "center",
  },

  /*
   Loading text under the spinner
  */
  loadingText: {
    color: "#ffffff",
    marginTop: 12,
    fontSize: 15,
  },

  /*
   Generic section card used for today/weekly/monthly/yearly sections
  */
  sectionCard: {
    marginTop: 18,
    marginHorizontal: 18,
    backgroundColor: "#5a5a5a",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2e2e2e",
  },

  /*
   Section title text
  */
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
  },

  /*
   Today summary row inside the Today's Route card
  */
  todayRow: {
    backgroundColor: "#f6e6c5",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3b2e17",
  },

  /*
   Circular badge holding the star icon
  */
  todayBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#4d77ad",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  /*
   Wrapper for today's text count and label
  */
  todayTextWrap: {
    flex: 1,
  },

  /*
   Today's completion count
  */
  todayCount: {
    color: "#111111",
    fontSize: 30,
    fontWeight: "800",
  },

  /*
   Small label under today's count
  */
  todayLabel: {
    color: "#3d3d3d",
    fontSize: 14,
    marginTop: 2,
  },

  /*
   Weekly chart row
   Uses space-between so the 7 bars stretch across the whole card.
  */
  chartRowWide: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
    paddingTop: 10,
  },

  /*
   Yearly chart row
   Horizontal row with spacing between monthly bars.
  */
  chartRowWideYear: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingTop: 10,
  },

  /*
   Monthly chart row
   Scrollable horizontal row because there are many day bars.
  */
  chartRowMonth: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingTop: 10,
    paddingRight: 16,
  },

  /*
   Wrapper around each chart bar
  */
  barItem: {
    alignItems: "center",
    marginRight: 8,
  },

  /*
   Container for one rail bar
  */
  railTrack: {
    height: 110,
    width: "100%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },

  /*
   Left rail of a chart bar
  */
  railLineLeft: {
    position: "absolute",
    left: "18%",
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: 2,
    backgroundColor: "#282b2e",
    zIndex: 3,
  },

  /*
   Right rail of a chart bar
  */
  railLineRight: {
    position: "absolute",
    right: "18%",
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: 2,
    backgroundColor: "#282b2e",
    zIndex: 3,
  },

  /*
   Horizontal rung between the two rails
  */
  railRung: {
    position: "absolute",
    left: "18%",
    right: "18%",
    height: 6,
    borderRadius: 4,
    backgroundColor: "#282b2e",
  },

  /*
   Highlighted rung for filled progress
  */
  railRungFilled: {
    backgroundColor: "#c2a07e",
  },

  /*
   Small label below each chart bar
  */
  barLabel: {
    color: "#ffffff",
    fontSize: 10,
    marginTop: 8,
  },

  /*
   Train avatar image inside the profile card
  */
  avatarImage: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },

  /*
   Logout button
   -------------
   Allows the user to manually sign out from the profile screen.
  */
  logoutButton: {
    marginTop: 30,
    marginHorizontal: 18,
    backgroundColor: "#c0392b",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },

  /*
   Logout button text
  */
  logoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});