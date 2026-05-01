import { getDeterministicTrainAvatar } from "@/lib/avatar-utils";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

const AnimatedImage = Animated.createAnimatedComponent(Animated.Image);

type RouteHabit = {
  id: string;
  name: string;
  completed_today: boolean;
};

type TodayRouteHeaderProps = {
  username: string;
  todayHabits: RouteHabit[];
  completedCount: number;
  totalCount: number;
  progress: number;
};

export default function TodayRouteHeader({
  username,
  todayHabits,
  completedCount,
  totalCount,
  progress,
}: TodayRouteHeaderProps) {
  const routeAvatar = getDeterministicTrainAvatar(username);
  const trainProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(trainProgress, {
      toValue: progress,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [progress, trainProgress]);

  return (
    <View style={styles.topSection}>
      <Text style={styles.progressTitle}>Today&apos;s Route</Text>

      <Text style={styles.completionText}>
        {completedCount} / {totalCount} stops completed
      </Text>

      <View style={styles.railContainer}>
        <View style={styles.trackBase}>
          <View
            style={[styles.trackProgress, { width: `${progress * 100}%` }]}
          />
        </View>

        {todayHabits.map((habit, index) => {
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
              <View
                style={[
                  styles.stationMarker,
                  habit.completed_today && styles.stationMarkerDone,
                ]}
              />
              <Text
                style={[
                  styles.stationLabel,
                  habit.completed_today && styles.stationLabelDone,
                ]}
              >
                {habit.name}
              </Text>
            </View>
          );
        })}

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
  );
}

const styles = StyleSheet.create({
  topSection: {
    height: "35%",
    backgroundColor: "#6f92d6",
    justifyContent: "center",
    alignItems: "center",
  },

  progressTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 5,
  },

  completionText: {
    color: "#d6ead8",
    fontSize: 14,
    marginBottom: 8,
  },

  railContainer: {
    width: "88%",
    height: 60,
    justifyContent: "center",
    position: "relative",
  },

  trackBase: {
    width: "100%",
    height: 12,
    backgroundColor: "#2d2d2d",
    borderRadius: 6,
    overflow: "hidden",
    position: "absolute",
    top: 28,
  },

  trackProgress: {
    height: "100%",
    backgroundColor: "#79bd00",
  },

  stationWrap: {
    position: "absolute",
    top: 16,
    width: 44,
    marginLeft: -10,
    alignItems: "center",
  },

  stationMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#f6e6c5",
    borderWidth: 2,
    borderColor: "#3a2e1c",
    marginBottom: 18,
    zIndex: 3,
  },

  stationMarkerDone: {
    backgroundColor: "#79bd00",
    borderColor: "#4d6d12",
  },

  stationLabel: {
    color: "#ffffff",
    fontSize: 10,
    textAlign: "center",
    width: 52,
  },

  stationLabelDone: {
    color: "#d6ead8",
  },

  trainImage: {
    position: "absolute",
    bottom: 10,
    width: 52,
    height: 52,
    resizeMode: "contain",
    zIndex: 4,
  },
});
